"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  applicationEvents,
  applications,
  auditLog,
  citizens,
  documents,
  services,
  type ApplicationStatus,
} from "@/db/schema";
import { referenceSlug, siteUrl } from "@/lib/applications";
import { sendDirectMessage } from "@/lib/discord";
import { newDocumentNumber } from "@/lib/documents";
import { OPEN_STATUSES, STATUS } from "@/lib/status";
import { canHandle, requireStaff } from "@/lib/viewer";

export type ActionResult = { ok: boolean; message: string };

const COLORS: Partial<Record<ApplicationStatus, number>> = {
  genehmigt: 0x17803d,
  abgelehnt: 0xc41e1e,
  rueckfrage: 0xa35a00,
  in_bearbeitung: 0x1f5fae,
};

async function loadForStaff(applicationId: string) {
  const viewer = await requireStaff();
  const [row] = await db
    .select({ app: applications, service: services, citizen: citizens })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(citizens, eq(applications.citizenId, citizens.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row || !canHandle(viewer, row.app.departmentId)) return { viewer, row: null };

  return { viewer, row };
}

function revalidate(reference: string) {
  revalidatePath(`/verwaltung/antraege/${referenceSlug(reference)}`);
  revalidatePath("/verwaltung", "layout");
  revalidatePath(`/konto/antraege/${referenceSlug(reference)}`);
}

function notify(userId: string, title: string, description: string, reference: string, color?: number) {
  after(() =>
    sendDirectMessage(userId, {
      title,
      description,
      color,
      url: `${siteUrl()}/konto/antraege/${referenceSlug(reference)}`,
      fields: [{ name: "Aktenzeichen", value: reference, inline: true }],
    }),
  );
}

/** Übernimmt genehmigte Umzüge und Namensänderungen ins Melderegister. */
async function applyToRegister(service: string, data: Record<string, unknown>, citizenId: string) {
  const str = (k: string) => (typeof data[k] === "string" && data[k] ? String(data[k]) : undefined);

  if (service === "wohnsitz-ummelden" || service === "wohnsitz-anmelden") {
    const street = str("strasse");
    const district = str("stadtteil");

    if (street || district) {
      await db.update(citizens).set({ street, district, updatedAt: new Date() }).where(eq(citizens.id, citizenId));
    }
  }
  if (service === "namensaenderung") {
    await db
      .update(citizens)
      .set({ firstName: str("neuer_vorname"), lastName: str("neuer_nachname"), updatedAt: new Date() })
      .where(eq(citizens.id, citizenId));
  }
  if (service === "eheschliessung") {
    await db.update(citizens).set({ maritalStatus: "verheiratet", updatedAt: new Date() }).where(eq(citizens.id, citizenId));
  }
  if (service === "scheidung") {
    await db.update(citizens).set({ maritalStatus: "geschieden", updatedAt: new Date() }).where(eq(citizens.id, citizenId));
  }
}

export async function changeStatus(applicationId: string, to: ApplicationStatus, message?: string): Promise<ActionResult> {
  const { viewer, row } = await loadForStaff(applicationId);

  if (!row) return { ok: false, message: "Antrag nicht gefunden oder keine Berechtigung." };
  const { app, service, citizen } = row;
  const text = message?.trim() || null;

  if (!OPEN_STATUSES.includes(app.status)) return { ok: false, message: "Der Antrag ist bereits abgeschlossen." };
  if (to === "rueckfrage" && !text) return { ok: false, message: "Bitte formulieren Sie die Rückfrage." };
  if (to === "abgelehnt" && !text) return { ok: false, message: "Bitte begründen Sie die Ablehnung." };

  const decided = to === "genehmigt" || to === "abgelehnt";

  await db.batch([
    db
      .update(applications)
      .set({
        status: to,
        updatedAt: new Date(),
        decidedAt: decided ? new Date() : null,
        assigneeId: app.assigneeId ?? viewer.user.id,
      })
      .where(eq(applications.id, app.id)),
    db.insert(applicationEvents).values({
      applicationId: app.id,
      type: "status",
      authorId: viewer.user.id,
      fromStatus: app.status,
      toStatus: to,
      message: text,
    }),
    db.insert(auditLog).values({ actorId: viewer.user.id, action: `status:${to}`, entity: "application", entityId: app.id }),
  ]);

  if (to === "genehmigt") await applyToRegister(service.slug, app.data, citizen.id);

  const titles: Partial<Record<ApplicationStatus, string>> = {
    in_bearbeitung: "Ihr Antrag wird bearbeitet",
    rueckfrage: "Rückfrage zu Ihrem Antrag",
    genehmigt: "Ihr Antrag wurde genehmigt",
    abgelehnt: "Ihr Antrag wurde abgelehnt",
  };

  notify(
    citizen.userId,
    `${titles[to] ?? "Statusänderung"}: ${service.title}`,
    [text, STATUS[to].hint].filter(Boolean).join("\n\n"),
    app.reference,
    COLORS[to],
  );
  revalidate(app.reference);

  return { ok: true, message: `Status: ${STATUS[to].label}` };
}

export async function addMessage(applicationId: string, message: string, internal: boolean): Promise<ActionResult> {
  const { viewer, row } = await loadForStaff(applicationId);

  if (!row) return { ok: false, message: "Keine Berechtigung." };
  const text = message.trim();

  if (text.length < 2) return { ok: false, message: "Bitte eine Nachricht eingeben." };

  await db.batch([
    db.insert(applicationEvents).values({ applicationId, type: "nachricht", authorId: viewer.user.id, message: text, isInternal: internal }),
    db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId)),
  ]);
  if (!internal) notify(row.citizen.userId, `Nachricht zu Ihrem Antrag: ${row.service.title}`, text, row.app.reference);
  revalidate(row.app.reference);

  return { ok: true, message: internal ? "Notiz gespeichert." : "Nachricht gesendet." };
}

export async function markFeePaid(applicationId: string): Promise<ActionResult> {
  const { viewer, row } = await loadForStaff(applicationId);

  if (!row) return { ok: false, message: "Keine Berechtigung." };
  if (row.app.feePaidAt) return { ok: false, message: "Bereits als bezahlt markiert." };

  await db.batch([
    db.update(applications).set({ feePaidAt: new Date(), updatedAt: new Date() }).where(eq(applications.id, applicationId)),
    db.insert(applicationEvents).values({ applicationId, type: "gebuehr", authorId: viewer.user.id, message: "Barzahlung an der Kasse verbucht." }),
  ]);
  revalidate(row.app.reference);

  return { ok: true, message: "Barzahlung verbucht." };
}

export async function issueDocument(
  applicationId: string,
  input: { title: string; validUntil: string | null; details: Record<string, string> },
): Promise<ActionResult> {
  const { viewer, row } = await loadForStaff(applicationId);

  if (!row) return { ok: false, message: "Keine Berechtigung." };
  const { app, service, citizen } = row;

  if (app.status !== "genehmigt") return { ok: false, message: "Dokumente werden erst nach der Genehmigung ausgestellt." };
  if (!service.issuesDocument) return { ok: false, message: "Für diese Leistung wird kein Dokument ausgestellt." };
  if (!input.title.trim()) return { ok: false, message: "Bitte einen Titel angeben." };
  if (input.validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil)) return { ok: false, message: "Ungültiges Ablaufdatum." };

  const details = Object.fromEntries(
    Object.entries(input.details)
      .map(([k, v]) => [k.trim().slice(0, 40), v.trim().slice(0, 120)])
      .filter(([k, v]) => k && v),
  );
  const number = newDocumentNumber(service.issuesDocument);

  // Ein neues Dokument gleicher Art ersetzt das alte (z. B. neuer Ausweis).
  await db.batch([
    db
      .update(documents)
      .set({ revokedAt: new Date(), revokedReason: `Ersetzt durch ${number}` })
      .where(and(eq(documents.citizenId, citizen.id), eq(documents.type, service.issuesDocument), isNull(documents.revokedAt))),
    db.insert(documents).values({
      number,
      type: service.issuesDocument,
      title: input.title.trim(),
      citizenId: citizen.id,
      applicationId: app.id,
      departmentId: app.departmentId,
      details,
      validUntil: input.validUntil,
      issuedById: viewer.user.id,
    }),
    db.insert(applicationEvents).values({ applicationId: app.id, type: "dokument", authorId: viewer.user.id, message: `${input.title.trim()} · ${number}` }),
    db.insert(auditLog).values({ actorId: viewer.user.id, action: "document:issue", entity: "document", entityId: number }),
  ]);

  after(() =>
    sendDirectMessage(citizen.userId, {
      title: `Dokument ausgestellt: ${input.title.trim()}`,
      description: service.needsAppointment
        ? "Ihr Dokument liegt zur Abholung bereit. Bitte buchen Sie einen Termin im Bürgerkonto."
        : "Ihr Dokument ist in Ihrem Bürgerkonto abrufbar.",
      color: 0x17803d,
      url: `${siteUrl()}/konto/dokumente/${number}`,
      fields: [{ name: "Dokumentnummer", value: number, inline: true }],
    }),
  );
  revalidate(app.reference);
  revalidatePath("/konto/dokumente");

  return { ok: true, message: `Dokument ${number} ausgestellt.` };
}

export async function revokeDocument(documentId: string, reason: string): Promise<ActionResult> {
  const viewer = await requireStaff();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  if (!doc || !canHandle(viewer, doc.departmentId)) return { ok: false, message: "Keine Berechtigung." };
  if (doc.revokedAt) return { ok: false, message: "Bereits widerrufen." };
  if (reason.trim().length < 3) return { ok: false, message: "Bitte einen Grund angeben." };

  await db.batch([
    db.update(documents).set({ revokedAt: new Date(), revokedReason: reason.trim() }).where(eq(documents.id, documentId)),
    db.insert(auditLog).values({ actorId: viewer.user.id, action: "document:revoke", entity: "document", entityId: doc.number, details: { reason } }),
  ]);
  revalidatePath("/verwaltung/buerger", "layout");

  return { ok: true, message: "Dokument widerrufen." };
}

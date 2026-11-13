"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, gt, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  applicationEvents,
  applications,
  appointments,
  appointmentSlots,
  citizens,
  jobs,
  services,
} from "@/db/schema";
import { nextReference, referenceSlug, siteUrl } from "@/lib/applications";
import { sendDirectMessage } from "@/lib/discord";
import { newCitizenNumber } from "@/lib/documents";
import { formatEuro } from "@/lib/format";
import { parseSubmission } from "@/lib/forms/validate";
import { OPEN_STATUSES } from "@/lib/status";
import { requireCitizen, requireResident } from "@/lib/viewer";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

/* ------------------------------- Meldedaten ------------------------------- */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen.");
const required = (label: string) => z.string().trim().min(1, `${label} fehlt.`).max(80);

const identitySchema = z.object({
  firstName: required("Vorname"),
  lastName: required("Familienname"),
  birthName: z.string().trim().max(80).optional(),
  birthDate: isoDate,
  birthPlace: required("Geburtsort"),
  gender: z.enum(["männlich", "weiblich", "divers"], { message: "Bitte wählen." }),
  nationality: required("Staatsangehörigkeit"),
  street: required("Straße"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Fünfstellige Postleitzahl."),
  district: required("Stadtteil"),
});

const contactSchema = z.object({
  phone: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(80).optional(),
  heightCm: z.coerce.number().int().min(120).max(230).optional(),
  eyeColor: z.string().trim().max(30).optional(),
  maritalStatus: z.enum(["ledig", "verheiratet", "geschieden", "verwitwet"]).default("ledig"),
});

function formObject(form: FormData) {
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v).trim() === "" ? undefined : String(v)]));
}

function fieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}

export async function saveCitizen(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireCitizen("/konto/meldedaten");
  const values = formObject(form);
  const contact = contactSchema.safeParse(values);

  if (!contact.success) return { errors: fieldErrors(contact.error) };

  if (viewer.citizen) {
    // Name, Geburt und Anschrift ändern sich nur über Anträge (Namensänderung, Umzug).
    await db
      .update(citizens)
      .set({ ...contact.data, updatedAt: new Date() })
      .where(eq(citizens.id, viewer.citizen.id));
    revalidatePath("/konto", "layout");

    return { ok: true, message: "Ihre Kontaktdaten wurden gespeichert." };
  }

  const identity = identitySchema.safeParse(values);

  if (!identity.success) return { errors: fieldErrors(identity.error) };

  let citizenNumber = newCitizenNumber();

  for (let i = 0; i < 5; i++) {
    const [{ n }] = await db.select({ n: count() }).from(citizens).where(eq(citizens.citizenNumber, citizenNumber));

    if (n === 0) break;
    citizenNumber = newCitizenNumber();
  }

  await db.insert(citizens).values({ ...identity.data, ...contact.data, userId: viewer.user.id, citizenNumber });
  revalidatePath("/", "layout");

  const next = String(form.get("weiter") ?? "");

  redirect(next.startsWith("/konto/") ? next : "/konto?willkommen=1");
}

/* --------------------------------- Anträge -------------------------------- */

export async function submitApplication(slug: string, _: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireResident(`/konto/antraege/neu/${slug}`);
  const [service] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.isActive, true))).limit(1);

  if (!service) return { message: "Diese Leistung ist nicht mehr verfügbar." };

  let jobId: string | null = null;

  if (slug === "bewerbung") {
    const jobSlug = String(form.get("stelle") ?? "");
    const [job] = await db.select().from(jobs).where(and(eq(jobs.slug, jobSlug), eq(jobs.isOpen, true))).limit(1);

    if (!job) return { message: "Die Stelle ist nicht mehr ausgeschrieben." };
    jobId = job.id;
  }

  const parsed = parseSubmission(service.fields, form);

  if (!parsed.ok) return { errors: parsed.errors, message: "Bitte prüfen Sie die markierten Felder." };

  const c = viewer.citizen;
  const id = crypto.randomUUID();
  const reference = await nextReference();

  await db.batch([
    db.insert(applications).values({
      id,
      reference,
      serviceId: service.id,
      departmentId: service.departmentId,
      citizenId: c.id,
      jobId,
      data: parsed.data,
      fieldsSnapshot: service.fields,
      citizenSnapshot: {
        name: `${c.firstName} ${c.lastName}`,
        citizenNumber: c.citizenNumber,
        birthDate: c.birthDate,
        birthPlace: c.birthPlace,
        address: `${c.street}, ${c.postalCode} ${c.district}`,
        phone: c.phone,
      },
      serviceVersion: service.version,
      feeCents: service.feeCents,
    }),
    db.insert(applicationEvents).values({ applicationId: id, type: "eingereicht", authorId: viewer.user.id, toStatus: "eingereicht" }),
  ]);

  after(() =>
    sendDirectMessage(viewer.user.id, {
      title: `Antrag eingegangen: ${service.title}`,
      description: `Ihr Antrag ist beim Rathaus eingegangen. Sie werden benachrichtigt, sobald sich der Status ändert.`,
      url: `${siteUrl()}/konto/antraege/${referenceSlug(reference)}`,
      fields: [
        { name: "Aktenzeichen", value: reference, inline: true },
        { name: "Gebühr", value: formatEuro(service.feeCents), inline: true },
      ],
    }),
  );

  revalidatePath("/konto", "layout");
  redirect(`/konto/antraege/${referenceSlug(reference)}?neu=1`);
}

async function ownApplication(id: string) {
  const viewer = await requireResident("/konto/antraege");
  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.citizenId, viewer.citizen.id)))
    .limit(1);

  return { viewer, app };
}

export async function replyToApplication(id: string, _: FormState, form: FormData): Promise<FormState> {
  const { viewer, app } = await ownApplication(id);
  const message = String(form.get("message") ?? "").trim();

  if (!app) return { message: "Antrag nicht gefunden." };
  if (!OPEN_STATUSES.includes(app.status)) return { message: "Der Antrag ist bereits abgeschlossen." };
  if (message.length < 2) return { errors: { message: "Bitte schreiben Sie eine Antwort." } };
  if (message.length > 4000) return { errors: { message: "Die Antwort ist zu lang." } };

  const reopen = app.status === "rueckfrage";

  await db.batch([
    db.insert(applicationEvents).values({
      applicationId: app.id,
      type: "antwort",
      authorId: viewer.user.id,
      message,
      fromStatus: reopen ? "rueckfrage" : null,
      toStatus: reopen ? "in_bearbeitung" : null,
    }),
    db
      .update(applications)
      .set({ status: reopen ? "in_bearbeitung" : app.status, updatedAt: new Date() })
      .where(eq(applications.id, app.id)),
  ]);
  revalidatePath(`/konto/antraege/${referenceSlug(app.reference)}`);

  return { ok: true, message: "Ihre Antwort wurde an das Amt übermittelt." };
}

export async function withdrawApplication(id: string): Promise<FormState> {
  const { viewer, app } = await ownApplication(id);

  if (!app || !OPEN_STATUSES.includes(app.status)) return { message: "Der Antrag kann nicht mehr zurückgezogen werden." };

  await db.batch([
    db.update(applications).set({ status: "zurueckgezogen", updatedAt: new Date(), decidedAt: new Date() }).where(eq(applications.id, app.id)),
    db.insert(applicationEvents).values({
      applicationId: app.id,
      type: "status",
      authorId: viewer.user.id,
      fromStatus: app.status,
      toStatus: "zurueckgezogen",
      message: "Vom Antragsteller zurückgezogen.",
    }),
  ]);
  revalidatePath("/konto", "layout");

  return { ok: true, message: "Der Antrag wurde zurückgezogen." };
}

/* --------------------------------- Termine -------------------------------- */

export async function bookAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireResident("/konto/termine");
  const slotId = String(form.get("slot") ?? "");
  const purpose = String(form.get("purpose") ?? "").trim();

  if (!slotId) return { errors: { slot: "Bitte einen Termin wählen." } };
  if (purpose.length < 3) return { errors: { purpose: "Bitte das Anliegen angeben." } };

  const [slot] = await db
    .select()
    .from(appointmentSlots)
    .where(and(eq(appointmentSlots.id, slotId), gt(appointmentSlots.startsAt, new Date())))
    .limit(1);

  if (!slot) return { errors: { slot: "Dieser Termin ist nicht mehr verfügbar." } };

  const [{ n }] = await db
    .select({ n: count() })
    .from(appointments)
    .where(and(eq(appointments.slotId, slot.id), inArray(appointments.status, ["gebucht", "erschienen"])));

  if (n >= slot.capacity) return { errors: { slot: "Dieser Termin ist bereits ausgebucht." } };

  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.slotId, slot.id), eq(appointments.citizenId, viewer.citizen.id)))
    .limit(1);

  if (existing) {
    await db.update(appointments).set({ status: "gebucht", purpose }).where(eq(appointments.id, existing.id));
  } else {
    await db.insert(appointments).values({ slotId: slot.id, citizenId: viewer.citizen.id, purpose });
  }
  revalidatePath("/konto/termine");

  return { ok: true, message: "Ihr Termin ist gebucht." };
}

export async function cancelAppointment(id: string): Promise<FormState> {
  const viewer = await requireResident("/konto/termine");

  await db
    .update(appointments)
    .set({ status: "storniert" })
    .where(and(eq(appointments.id, id), eq(appointments.citizenId, viewer.citizen.id)));
  revalidatePath("/konto/termine");

  return { ok: true, message: "Der Termin wurde storniert." };
}

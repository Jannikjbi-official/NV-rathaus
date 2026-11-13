import "server-only";

import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, appointments, appointmentSlots, citizens, documents, type Application, type Citizen, type Service } from "@/db/schema";

import { referenceSlug } from "./applications";
import { formatDate } from "./format";
import { DOCUMENT_TYPES, OPEN_STATUSES } from "./status";

export type Check = {
  tone: "ok" | "warning" | "danger" | "info";
  title: string;
  detail?: string;
  href?: string;
};

function age(birthDate: string) {
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();

  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;

  return a;
}

const MIN_AGE: Record<string, number> = {
  waffenbesitzkarte: 21,
  waffenschein: 21,
  jagdschein: 18,
  "gewerbe-anmelden": 18,
  gaststaettenkonzession: 18,
  eheschliessung: 18,
  fuehrerschein: 17,
};

const isValid = (d: { revokedAt: Date | null; validUntil: string | null }) =>
  !d.revokedAt && (!d.validUntil || new Date(d.validUntil) >= new Date(new Date().toDateString()));

/**
 * Automatische Prüfhilfe: Was ein Sachbearbeiter sonst von Hand nachsehen müsste.
 * Liefert Hinweise, entscheidet aber nichts selbst.
 */
export async function runChecks(app: Application, service: Service, citizen: Citizen): Promise<Check[]> {
  const checks: Check[] = [];
  const data = app.data as Record<string, unknown>;

  const [docs, sameOpen, booked] = await Promise.all([
    db.select().from(documents).where(eq(documents.citizenId, citizen.id)),
    db
      .select({ reference: applications.reference })
      .from(applications)
      .where(and(eq(applications.citizenId, citizen.id), eq(applications.serviceId, service.id), ne(applications.id, app.id), inArray(applications.status, OPEN_STATUSES))),
    service.needsAppointment
      ? db
          .select({ startsAt: appointmentSlots.startsAt })
          .from(appointments)
          .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
          .where(and(eq(appointments.citizenId, citizen.id), eq(appointments.status, "gebucht"), sql`${appointmentSlots.startsAt} > now()`))
      : Promise.resolve([]),
  ]);
  const valid = docs.filter(isValid);
  const hasValid = (type: string) => valid.find((d) => d.type === type);

  // Alter
  const minAge = MIN_AGE[service.slug];
  const years = age(citizen.birthDate);

  if (minAge) {
    checks.push(
      years >= minAge
        ? { tone: "ok", title: `Mindestalter erfüllt (${years} Jahre, nötig ${minAge})` }
        : { tone: "danger", title: `Mindestalter nicht erfüllt`, detail: `${years} Jahre, nötig sind ${minAge}.` },
    );
  }

  // Doppelte Anträge
  if (sameOpen.length) {
    checks.push({
      tone: "warning",
      title: "Weiterer offener Antrag derselben Leistung",
      detail: sameOpen.map((s) => s.reference).join(", "),
      href: `/verwaltung/antraege/${referenceSlug(sameOpen[0].reference)}`,
    });
  }

  // Bestehendes Dokument gleicher Art wird ersetzt
  if (service.issuesDocument && service.issuesDocument !== "bescheid" && service.issuesDocument !== "bescheinigung" && service.issuesDocument !== "genehmigung") {
    const existing = hasValid(service.issuesDocument);

    if (existing) {
      checks.push({
        tone: "info",
        title: `Gültiges Dokument vorhanden: ${DOCUMENT_TYPES[existing.type].label}`,
        detail: `${existing.number}, gültig bis ${existing.validUntil ? formatDate(existing.validUntil) : "unbefristet"}. Wird beim Ausstellen automatisch ersetzt.`,
        href: `/verwaltung/dokumente/${existing.number}`,
      });
    }
  }

  // Leistungsspezifische Prüfungen
  switch (service.slug) {
    case "reisepass":
      checks.push(
        hasValid("personalausweis")
          ? { tone: "ok", title: "Gültiger Personalausweis vorhanden" }
          : { tone: "warning", title: "Kein gültiger Personalausweis", detail: "Für den Reisepass wird ein gültiger Personalausweis vorausgesetzt." },
      );
      break;
    case "personalausweis":
      if (!citizen.heightCm || !citizen.eyeColor) {
        const fromForm = data.groesse && data.augenfarbe;

        checks.push(fromForm ? { tone: "ok", title: "Größe und Augenfarbe im Antrag angegeben" } : { tone: "warning", title: "Größe oder Augenfarbe fehlen" });
      }
      break;
    case "waffenschein":
      checks.push(
        hasValid("waffenbesitzkarte")
          ? { tone: "ok", title: "Gültige Waffenbesitzkarte vorhanden", detail: hasValid("waffenbesitzkarte")!.number }
          : { tone: "danger", title: "Keine gültige Waffenbesitzkarte", detail: "Ein Waffenschein setzt eine Waffenbesitzkarte voraus." },
      );
      break;
    case "waffenbesitzkarte":
      if (data.vorstrafen === "Ja") checks.push({ tone: "danger", title: "Vorstrafen angegeben", detail: String(data.vorstrafen_details ?? "Keine Details angegeben.") });
      else checks.push({ tone: "ok", title: "Keine Vorstrafen angegeben" });
      if (!data.aufbewahrung) checks.push({ tone: "danger", title: "Sichere Aufbewahrung nicht bestätigt" });
      break;
    case "kfz-zulassung":
    case "wunschkennzeichen": {
      const plate = String(data.wunschkennzeichen ?? data.kennzeichen ?? "").trim().toUpperCase();

      if (plate) {
        const taken = await db
          .select({ number: documents.number, citizenId: documents.citizenId })
          .from(documents)
          .where(and(eq(documents.type, "fahrzeugschein"), isNull(documents.revokedAt), sql`upper(${documents.details}->>'Kennzeichen') = ${plate}`))
          .limit(1);

        checks.push(
          taken.length && taken[0].citizenId !== citizen.id
            ? { tone: "danger", title: `Kennzeichen ${plate} ist bereits vergeben`, href: `/verwaltung/dokumente/${taken[0].number}` }
            : { tone: "ok", title: `Kennzeichen ${plate} ist frei` },
        );
      }
      if (service.slug === "kfz-zulassung") {
        checks.push(
          hasValid("fuehrerschein")
            ? { tone: "ok", title: "Halter besitzt einen gültigen Führerschein" }
            : { tone: "info", title: "Halter hat keinen Führerschein", detail: "Für die Zulassung nicht nötig, aber zum Fahren." },
        );
      }
      break;
    }
    case "eheschliessung": {
      if (citizen.maritalStatus === "verheiratet") checks.push({ tone: "danger", title: "Antragsteller/in ist bereits verheiratet" });
      const nr = String(data.partner_buergernummer ?? "").trim().toUpperCase();

      if (nr) {
        const [partner] = await db.select().from(citizens).where(eq(citizens.citizenNumber, nr)).limit(1);

        if (!partner) checks.push({ tone: "danger", title: `Bürgernummer ${nr} existiert nicht` });
        else {
          checks.push({ tone: "ok", title: `Partner/in gefunden: ${partner.firstName} ${partner.lastName}`, href: `/verwaltung/buerger/${partner.citizenNumber}` });
          if (partner.maritalStatus === "verheiratet") checks.push({ tone: "danger", title: "Partner/in ist bereits verheiratet" });
          if (age(partner.birthDate) < 18) checks.push({ tone: "danger", title: "Partner/in ist nicht volljährig" });
        }
      }
      break;
    }
    case "gewerbe-ummelden":
    case "gewerbe-abmelden":
    case "steuernummer":
      if (!hasValid("gewerbeschein") && service.slug !== "steuernummer") checks.push({ tone: "warning", title: "Kein eingetragenes Gewerbe gefunden" });
      break;
    case "gaststaettenkonzession":
      checks.push(hasValid("gewerbeschein") ? { tone: "ok", title: "Gewerbe ist angemeldet" } : { tone: "danger", title: "Kein angemeldetes Gewerbe", detail: "Die Konzession setzt eine Gewerbeanmeldung voraus." });
      break;
  }

  // Gebühr und Termin
  if (app.feeCents > 0) {
    checks.push(app.feePaidAt ? { tone: "ok", title: "Gebühr bezahlt" } : { tone: "warning", title: "Gebühr noch offen" });
  }
  if (service.needsAppointment) {
    checks.push(
      booked.length
        ? { tone: "ok", title: `Abholtermin gebucht: ${formatDate(booked[0].startsAt)}` }
        : { tone: "info", title: "Noch kein Abholtermin gebucht" },
    );
  }

  return checks;
}

export type NextStep = { title: string; detail: string } | null;

/** Was ist als Nächstes zu tun? */
export function nextStep(app: Application, service: Service, issuedCount: number, lastEvent: string | null): NextStep {
  switch (app.status) {
    case "eingereicht":
      return { title: "Bearbeitung übernehmen", detail: "Übernehmen Sie den Antrag und prüfen Sie die Angaben." };
    case "rueckfrage":
      return { title: "Auf Antwort warten", detail: "Der Bürger wurde um weitere Angaben gebeten." };
    case "in_bearbeitung":
      return lastEvent === "antwort"
        ? { title: "Antwort prüfen", detail: "Der Bürger hat auf Ihre Rückfrage geantwortet." }
        : { title: "Entscheiden", detail: "Genehmigen, Rückfrage stellen oder ablehnen." };
    case "genehmigt":
      if (app.feeCents > 0 && !app.feePaidAt) return { title: "Gebühr kassieren", detail: "Markieren Sie die Gebühr als bezahlt, sobald sie im Spiel entrichtet wurde." };
      if (service.issuesDocument && issuedCount === 0) return { title: "Dokument ausstellen", detail: "Prüfen Sie die Vorschau und stellen Sie das Dokument aus." };

      return null;
    default:
      return null;
  }
}

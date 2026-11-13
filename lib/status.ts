import type { ApplicationStatus, DocumentType, PostKind } from "@/db/schema";

type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

export const STATUS: Record<ApplicationStatus, { label: string; color: ChipColor; step: number; hint: string }> = {
  eingereicht: { label: "Eingereicht", color: "default", step: 1, hint: "Ihr Antrag ist eingegangen und wartet auf Bearbeitung." },
  in_bearbeitung: { label: "In Bearbeitung", color: "accent", step: 2, hint: "Ihr Antrag wird gerade geprüft." },
  rueckfrage: { label: "Rückfrage", color: "warning", step: 2, hint: "Das Amt benötigt weitere Angaben von Ihnen." },
  genehmigt: { label: "Genehmigt", color: "success", step: 4, hint: "Ihr Antrag wurde genehmigt." },
  abgelehnt: { label: "Abgelehnt", color: "danger", step: 4, hint: "Ihr Antrag wurde abgelehnt." },
  zurueckgezogen: { label: "Zurückgezogen", color: "default", step: 4, hint: "Sie haben den Antrag zurückgezogen." },
};

export const OPEN_STATUSES: ApplicationStatus[] = ["eingereicht", "in_bearbeitung", "rueckfrage"];

export const DOCUMENT_TYPES: Record<DocumentType, { label: string; prefix: string }> = {
  personalausweis: { label: "Personalausweis", prefix: "ID" },
  reisepass: { label: "Reisepass", prefix: "RP" },
  fuehrerschein: { label: "Führerschein", prefix: "FS" },
  fahrzeugschein: { label: "Fahrzeugschein", prefix: "FZ" },
  gewerbeschein: { label: "Gewerbeschein", prefix: "GW" },
  waffenschein: { label: "Waffenschein", prefix: "WS" },
  waffenbesitzkarte: { label: "Waffenbesitzkarte", prefix: "WK" },
  jagdschein: { label: "Jagdschein", prefix: "JS" },
  fischereischein: { label: "Fischereischein", prefix: "FI" },
  urkunde: { label: "Urkunde", prefix: "UR" },
  bescheinigung: { label: "Bescheinigung", prefix: "BS" },
  genehmigung: { label: "Genehmigung", prefix: "GE" },
  bescheid: { label: "Bescheid", prefix: "BE" },
};

export const POST_KINDS: Record<PostKind, { label: string; plural: string }> = {
  pressemitteilung: { label: "Pressemitteilung", plural: "Pressemitteilungen" },
  bekanntmachung: { label: "Bekanntmachung", plural: "Amtliche Bekanntmachungen" },
  verkehr: { label: "Verkehr", plural: "Verkehr" },
  stadtleben: { label: "Stadtleben", plural: "Stadtleben" },
};

export const LIFE_EVENTS: Record<string, { label: string; icon: string }> = {
  ausweise: { label: "Ausweise & Dokumente", icon: "Persons" },
  umzug: { label: "Umziehen & Wohnen", icon: "House" },
  familie: { label: "Familie & Partnerschaft", icon: "HeartPulse" },
  fahrzeug: { label: "Fahrzeug & Führerschein", icon: "Car" },
  gewerbe: { label: "Gewerbe & Veranstaltungen", icon: "Briefcase" },
  bauen: { label: "Bauen & Grundstücke", icon: "Hammer" },
  sicherheit: { label: "Waffen, Jagd & Fischerei", icon: "ShieldCheck" },
  soziales: { label: "Soziale Hilfen", icon: "Hand" },
  anliegen: { label: "Anliegen & Bewerbung", icon: "Megaphone" },
};

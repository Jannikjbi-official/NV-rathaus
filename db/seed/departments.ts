import type { OpeningHours } from "@/db/schema";

const weekdays = (open: string, close: string, extra: OpeningHours["days"] = []): OpeningHours => ({
  days: [1, 2, 3, 4, 5].map((day) => ({ day, open, close })).concat(extra),
});

export const DEPARTMENTS = [
  {
    slug: "buergeramt",
    name: "Bürgeramt",
    icon: "Persons",
    summary: "Ausweise, Pässe, Meldewesen und Führungszeugnisse.",
    description:
      "Das Bürgeramt ist die erste Anlaufstelle für alle Bürgerinnen und Bürger. Hier werden Personalausweise und Reisepässe ausgestellt, Wohnsitze an- und umgemeldet sowie Melde- und Führungszeugnisse erteilt.",
    address: "Rathausmarkt 1, Erdgeschoss",
    phone: "115-100",
    email: "buergeramt@rathaus.nv",
    openingHours: weekdays("16:00", "23:00", [{ day: 6, open: "14:00", close: "23:00" }]),
    sortOrder: 1,
  },
  {
    slug: "standesamt",
    name: "Standesamt",
    icon: "HeartPulse",
    summary: "Eheschließungen, Scheidungen und Personenstandsurkunden.",
    description:
      "Das Standesamt beurkundet Geburten, Eheschließungen und Sterbefälle. Trauungen finden im Trauzimmer des Rathauses, im Festsaal oder nach Absprache an einem Ort Ihrer Wahl statt.",
    address: "Rathausmarkt 1, 1. Obergeschoss",
    phone: "115-200",
    email: "standesamt@rathaus.nv",
    openingHours: weekdays("17:00", "22:00", [{ day: 6, open: "14:00", close: "20:00" }]),
    sortOrder: 2,
  },
  {
    slug: "strassenverkehrsamt",
    name: "Straßenverkehrsamt",
    icon: "Car",
    summary: "Führerscheine, Fahrzeugzulassung und Kennzeichen.",
    description:
      "Das Straßenverkehrsamt stellt Führerscheine aus, lässt Fahrzeuge zu und vergibt Kennzeichen. Halterauskünfte erhalten nur Personen mit berechtigtem Interesse.",
    address: "Ausschläger Weg 100",
    phone: "115-300",
    email: "verkehr@rathaus.nv",
    openingHours: weekdays("16:00", "23:00"),
    sortOrder: 3,
  },
  {
    slug: "ordnungsamt",
    name: "Ordnungsamt",
    icon: "ShieldCheck",
    summary: "Waffenrecht, Veranstaltungen, Jagd und Fischerei.",
    description:
      "Das Ordnungsamt sorgt für Sicherheit und Ordnung in der Stadt. Es ist zuständig für waffenrechtliche Erlaubnisse, die Genehmigung von Veranstaltungen und die Sondernutzung öffentlicher Flächen.",
    address: "Rathausmarkt 1, 2. Obergeschoss",
    phone: "115-400",
    email: "ordnungsamt@rathaus.nv",
    openingHours: weekdays("16:00", "23:00"),
    sortOrder: 4,
  },
  {
    slug: "gewerbeamt",
    name: "Gewerbeamt",
    icon: "Briefcase",
    summary: "Gewerbe an-, um- und abmelden, Gaststättenkonzessionen.",
    description:
      "Wer in Nordverkehr ein Gewerbe betreibt, muss es beim Gewerbeamt anmelden. Für Gaststätten mit Alkoholausschank ist zusätzlich eine Konzession erforderlich.",
    address: "Rathausmarkt 1, 2. Obergeschoss",
    phone: "115-500",
    email: "gewerbe@rathaus.nv",
    openingHours: { days: [1, 3, 5].map((day) => ({ day, open: "18:00", close: "22:00" })), note: "Persönliche Vorsprache nur mit Termin" },
    sortOrder: 5,
  },
  {
    slug: "bauamt",
    name: "Bauamt",
    icon: "Hammer",
    summary: "Bauanträge, Grundstücke, Abriss und Nutzungsänderungen.",
    description:
      "Das Bauamt prüft Bauvorhaben, genehmigt Abrisse und Nutzungsänderungen und führt das Grundstücksregister der Stadt.",
    address: "Stadthausbrücke 8",
    phone: "115-600",
    email: "bauamt@rathaus.nv",
    openingHours: { days: [2, 4].map((day) => ({ day, open: "18:00", close: "22:00" })), note: "Persönliche Vorsprache nur mit Termin" },
    sortOrder: 6,
  },
  {
    slug: "finanzamt",
    name: "Finanzamt",
    icon: "Receipt",
    summary: "Steuernummern, Steuererklärungen und Bescheinigungen.",
    description:
      "Das Finanzamt vergibt Steuernummern, bearbeitet Steuererklärungen und stellt steuerliche Bescheinigungen für Gewerbetreibende aus.",
    address: "Gänsemarkt 10",
    phone: "115-700",
    email: "finanzamt@rathaus.nv",
    openingHours: weekdays("16:00", "21:00"),
    sortOrder: 7,
  },
  {
    slug: "sozialamt",
    name: "Sozialamt",
    icon: "Hand",
    summary: "Bürgergeld, Wohngeld und Hilfe in Notlagen.",
    description:
      "Das Sozialamt unterstützt Menschen, die ihren Lebensunterhalt nicht aus eigener Kraft bestreiten können, mit Bürgergeld, Wohngeld und Hilfen in besonderen Härtefällen.",
    address: "Hamburger Straße 37",
    phone: "115-800",
    email: "sozialamt@rathaus.nv",
    openingHours: weekdays("16:00", "21:00"),
    sortOrder: 8,
  },
  {
    slug: "buergermeisterbuero",
    name: "Bürgermeisterbüro",
    icon: "Megaphone",
    summary: "Anliegen an den Bürgermeister, Beschwerden und Personal.",
    description:
      "Das Büro des Bürgermeisters nimmt Anliegen und Beschwerden aus der Bürgerschaft entgegen und ist für Stellenbesetzungen bei der Stadt zuständig.",
    address: "Rathausmarkt 1, 3. Obergeschoss",
    phone: "115-900",
    email: "buergermeister@rathaus.nv",
    openingHours: { days: [2, 4].map((day) => ({ day, open: "18:00", close: "21:00" })) },
    sortOrder: 9,
  },
] as const;

export type DepartmentSlug = (typeof DEPARTMENTS)[number]["slug"];

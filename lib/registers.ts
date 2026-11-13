import "server-only";

import { and, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { applications, citizens, documents, services, type DocumentType } from "@/db/schema";

import { documentState } from "./documents";
import { formatDate } from "./format";
import { DOCUMENT_TYPES } from "./status";

export type RegisterRow = {
  number: string;
  type: DocumentType;
  title: string;
  details: Record<string, string>;
  data: Record<string, unknown>;
  issuedAt: Date;
  validUntil: string | null;
  state: ReturnType<typeof documentState>;
  holder: string;
  citizenNumber: string;
  address: string;
  reference: string | null;
  serviceSlug: string | null;
};

type Column = { label: string; value: (r: RegisterRow) => string; mono?: boolean; strong?: boolean };

export type RegisterDef = {
  id: string;
  title: string;
  description: string;
  /** Kennzahl auf dem Dashboard, z. B. "Zugelassene Fahrzeuge" */
  countLabel: string;
  types?: DocumentType[];
  services?: string[];
  searchHint: string;
  columns: Column[];
};

const v = (s: unknown) => (s === null || s === undefined || s === "" ? "–" : Array.isArray(s) ? s.join(", ") : String(s));
const d = (r: RegisterRow, key: string, dataKey?: string) => v(r.details[key] ?? (dataKey ? r.data[dataKey] : undefined));
const date = (iso: string | null | undefined) => (iso ? formatDate(iso) : "–");

const holder: Column = { label: "Inhaber/in", value: (r) => r.holder, strong: true };
const number: Column = { label: "Nummer", value: (r) => r.number, mono: true };
const issued: Column = { label: "Ausgestellt", value: (r) => formatDate(r.issuedAt) };
const valid: Column = { label: "Gültig bis", value: (r) => (r.validUntil ? date(r.validUntil) : "unbefristet") };

export const REGISTERS: Record<string, RegisterDef[]> = {
  buergeramt: [
    {
      id: "ausweise",
      title: "Ausweis- und Passregister",
      description: "Alle ausgestellten Personalausweise und Reisepässe.",
      countLabel: "Gültige Ausweise & Pässe",
      types: ["personalausweis", "reisepass"],
      searchHint: "Name, Bürgernummer oder Ausweisnummer",
      columns: [{ label: "Dokument", value: (r) => DOCUMENT_TYPES[r.type].label }, number, holder, issued, valid],
    },
    {
      id: "meldebescheinigungen",
      title: "Meldebescheinigungen",
      description: "Bescheinigungen aus dem Melderegister, auch nach Umzügen.",
      countLabel: "Meldebescheinigungen",
      services: ["meldebescheinigung", "wohnsitz-anmelden", "wohnsitz-ummelden", "fuehrungszeugnis"],
      searchHint: "Name, Anschrift oder Nummer",
      columns: [{ label: "Art", value: (r) => r.title }, number, holder, { label: "Anschrift", value: (r) => r.address }, issued],
    },
  ],
  standesamt: [
    {
      id: "personenstand",
      title: "Personenstandsregister",
      description: "Eheschließungen, Geburten, Sterbefälle und Scheidungen.",
      countLabel: "Beurkundungen",
      types: ["urkunde"],
      searchHint: "Name oder Urkundennummer",
      columns: [
        { label: "Urkunde", value: (r) => r.title, strong: true },
        number,
        { label: "Beteiligte", value: (r) => [r.holder, v(r.details["Ehepartner/in"] ?? r.data.partner_name ?? r.data.ehepartner ?? r.data.verstorbene ?? r.data.kind_vorname)].filter((x) => x !== "–").join(" · ") },
        { label: "Datum", value: (r) => (typeof r.data.wunschdatum === "string" ? date(r.data.wunschdatum) : formatDate(r.issuedAt)) },
      ],
    },
  ],
  strassenverkehrsamt: [
    {
      id: "fahrzeuge",
      title: "Fahrzeugregister",
      description: "Zugelassene Fahrzeuge mit Halter. Suche nach Kennzeichen = Halterabfrage.",
      countLabel: "Zugelassene Fahrzeuge",
      types: ["fahrzeugschein"],
      searchHint: "Kennzeichen, FIN, Halter oder Fahrzeug",
      columns: [
        { label: "Kennzeichen", value: (r) => d(r, "Kennzeichen", "wunschkennzeichen"), mono: true, strong: true },
        { label: "Fahrzeug", value: (r) => d(r, "Fahrzeug", "hersteller_modell") },
        { label: "Art / Farbe", value: (r) => [v(r.data.art), v(r.data.farbe)].filter((x) => x !== "–").join(" · ") || "–" },
        { label: "FIN", value: (r) => d(r, "FIN", "fin"), mono: true },
        { label: "Halter/in", value: (r) => r.holder },
        { label: "Zugelassen", value: (r) => formatDate(r.issuedAt) },
      ],
    },
    {
      id: "fuehrerscheine",
      title: "Führerscheinregister",
      description: "Erteilte Fahrerlaubnisse mit Klassen.",
      countLabel: "Gültige Führerscheine",
      types: ["fuehrerschein"],
      searchHint: "Name, Bürgernummer oder Führerscheinnummer",
      columns: [holder, number, { label: "Klassen", value: (r) => d(r, "Klassen"), strong: true }, issued, valid],
    },
  ],
  ordnungsamt: [
    {
      id: "waffen",
      title: "Waffenregister",
      description: "Waffenbesitzkarten und Waffenscheine.",
      countLabel: "Waffenrechtliche Erlaubnisse",
      types: ["waffenbesitzkarte", "waffenschein"],
      searchHint: "Name, Bürgernummer oder Kartennummer",
      columns: [
        { label: "Erlaubnis", value: (r) => DOCUMENT_TYPES[r.type].label },
        holder,
        { label: "Bedürfnis", value: (r) => d(r, "Bedürfnis", "beduerfnis") },
        { label: "Waffenart", value: (r) => d(r, "Waffenart", "waffenart") },
        number,
        valid,
      ],
    },
    {
      id: "jagd-fischerei",
      title: "Jagd- und Fischereischeine",
      description: "Erteilte Jagd- und Fischereischeine.",
      countLabel: "Jagd- & Fischereischeine",
      types: ["jagdschein", "fischereischein"],
      searchHint: "Name oder Nummer",
      columns: [{ label: "Schein", value: (r) => DOCUMENT_TYPES[r.type].label }, holder, number, issued, valid],
    },
    {
      id: "veranstaltungen",
      title: "Veranstaltungen & Sondernutzungen",
      description: "Genehmigte Veranstaltungen und Nutzungen öffentlicher Flächen.",
      countLabel: "Genehmigte Veranstaltungen",
      services: ["veranstaltung", "sondernutzung"],
      searchHint: "Titel, Ort oder Veranstalter",
      columns: [
        { label: "Veranstaltung", value: (r) => r.title, strong: true },
        { label: "Datum", value: (r) => (typeof r.data.datum === "string" ? date(r.data.datum) : d(r, "Datum")) },
        { label: "Ort", value: (r) => d(r, "Ort", "ort") },
        { label: "Veranstalter/in", value: (r) => r.holder },
        number,
      ],
    },
  ],
  gewerbeamt: [
    {
      id: "gewerbe",
      title: "Gewerberegister",
      description: "Angemeldete Gewerbebetriebe in Nordverkehr.",
      countLabel: "Eingetragene Gewerbe",
      types: ["gewerbeschein"],
      searchHint: "Betrieb, Inhaber oder Branche",
      columns: [
        { label: "Betrieb", value: (r) => d(r, "Betrieb", "firma"), strong: true },
        { label: "Rechtsform", value: (r) => d(r, "Rechtsform", "rechtsform") },
        { label: "Branche", value: (r) => d(r, "Branche", "branche") },
        { label: "Betriebsstätte", value: (r) => v(r.data.betriebsstaette) },
        { label: "Inhaber/in", value: (r) => r.holder },
        { label: "Seit", value: (r) => formatDate(r.issuedAt) },
      ],
    },
    {
      id: "konzessionen",
      title: "Gaststättenkonzessionen",
      description: "Erlaubnisse für Gaststätten, Bars und Clubs.",
      countLabel: "Konzessionen",
      services: ["gaststaettenkonzession"],
      searchHint: "Betrieb oder Inhaber",
      columns: [{ label: "Betrieb", value: (r) => v(r.data.betrieb), strong: true }, { label: "Art", value: (r) => v(r.data.art) }, { label: "Anschrift", value: (r) => v(r.data.adresse) }, holder, issued],
    },
  ],
  bauamt: [
    {
      id: "bau",
      title: "Bau- und Grundstücksregister",
      description: "Baugenehmigungen, Abrisse, Nutzungsänderungen und Eigentümerwechsel.",
      countLabel: "Einträge",
      services: ["bauantrag", "grundstueck", "abriss", "nutzungsaenderung"],
      searchHint: "Adresse, Name oder Nummer",
      columns: [
        { label: "Vorgang", value: (r) => r.title, strong: true },
        { label: "Grundstück", value: (r) => v(r.data.grundstueck ?? r.data.adresse) },
        { label: "Antragsteller/in", value: (r) => r.holder },
        number,
        issued,
      ],
    },
  ],
  finanzamt: [
    {
      id: "steuer",
      title: "Steuerregister",
      description: "Steuernummern, Bescheide und Bescheinigungen.",
      countLabel: "Steuerakten",
      services: ["steuernummer", "steuererklaerung", "unbedenklichkeit"],
      searchHint: "Name oder Nummer",
      columns: [{ label: "Vorgang", value: (r) => r.title, strong: true }, holder, number, issued],
    },
  ],
  sozialamt: [
    {
      id: "leistungen",
      title: "Leistungsbescheide",
      description: "Bewilligte Sozialleistungen.",
      countLabel: "Bewilligte Leistungen",
      services: ["buergergeld", "wohngeld", "haertefallhilfe"],
      searchHint: "Name oder Nummer",
      columns: [
        { label: "Leistung", value: (r) => d(r, "Leistung") === "–" ? r.title : d(r, "Leistung"), strong: true },
        { label: "Zeitraum", value: (r) => d(r, "Zeitraum") },
        { label: "Empfänger/in", value: (r) => r.holder },
        number,
        issued,
      ],
    },
  ],
  buergermeisterbuero: [],
};

function where(departmentId: string, reg: RegisterDef, q?: string, onlyValid?: boolean) {
  const parts: SQL[] = [eq(documents.departmentId, departmentId)];

  if (reg.types) parts.push(inArray(documents.type, reg.types));
  if (reg.services) parts.push(inArray(services.slug, reg.services));
  if (onlyValid) parts.push(isNull(documents.revokedAt));
  if (q?.trim()) {
    const t = `%${q.trim()}%`;

    parts.push(
      or(
        ilike(documents.number, t),
        ilike(documents.title, t),
        ilike(citizens.firstName, t),
        ilike(citizens.lastName, t),
        ilike(citizens.citizenNumber, t),
        sql`${documents.details}::text ilike ${t}`,
        sql`${applications.data}::text ilike ${t}`,
      )!,
    );
  }

  return and(...parts);
}

export async function getRegisterRows(departmentId: string, reg: RegisterDef, q?: string): Promise<RegisterRow[]> {
  const rows = await db
    .select({ doc: documents, citizen: citizens, data: applications.data, reference: applications.reference, serviceSlug: services.slug })
    .from(documents)
    .innerJoin(citizens, eq(documents.citizenId, citizens.id))
    .leftJoin(applications, eq(documents.applicationId, applications.id))
    .leftJoin(services, eq(applications.serviceId, services.id))
    .where(where(departmentId, reg, q))
    .orderBy(desc(documents.issuedAt))
    .limit(200);

  return rows.map(({ doc, citizen, data, reference, serviceSlug }) => ({
    number: doc.number,
    type: doc.type,
    title: doc.title,
    details: doc.details,
    data: data ?? {},
    issuedAt: doc.issuedAt,
    validUntil: doc.validUntil,
    state: documentState(doc),
    holder: `${citizen.lastName}, ${citizen.firstName}`,
    citizenNumber: citizen.citizenNumber,
    address: `${citizen.street}, ${citizen.district}`,
    reference,
    serviceSlug,
  }));
}

export async function getRegisterCount(departmentId: string, reg: RegisterDef) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(documents)
    .leftJoin(applications, eq(documents.applicationId, applications.id))
    .leftJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(citizens, eq(documents.citizenId, citizens.id))
    .where(where(departmentId, reg, undefined, true));

  return n;
}

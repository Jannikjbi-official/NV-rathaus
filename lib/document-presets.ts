import type { Citizen, Service } from "@/db/schema";

import { DOCUMENT_TYPES } from "./status";

const s = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v));

/** Vorschlag für das auszustellende Dokument aus den Antragsdaten. */
export function documentPreset(service: Service, data: Record<string, unknown>, citizen: Citizen) {
  const type = service.issuesDocument;

  if (!type) return null;
  const valid = service.documentValidityYears
    ? new Date(Date.now() + service.documentValidityYears * 365.25 * 86400000).toISOString().slice(0, 10)
    : null;
  let title: string = DOCUMENT_TYPES[type].label;
  let details: Record<string, string> = {};

  switch (service.slug) {
    case "personalausweis":
      details = { Größe: data.groesse ? `${s(data.groesse)} cm` : "", Augen: s(data.augenfarbe), Staatsangeh: citizen.nationality };
      break;
    case "reisepass":
      details = { Staatsangeh: citizen.nationality };
      break;
    case "fuehrerschein":
    case "fuehrerschein-ersatz":
      details = { Klassen: s(data.klassen).replace(/ \([^)]*\)/g, "") };
      break;
    case "kfz-zulassung":
      title = "Zulassungsbescheinigung Teil I";
      details = { Kennzeichen: s(data.wunschkennzeichen) || "HH-NV ", Fahrzeug: s(data.hersteller_modell), FIN: s(data.fin) };
      break;
    case "gewerbe-anmelden":
    case "gewerbe-ummelden":
      title = `Gewerbeschein ${s(data.firma)}`.trim();
      details = { Betrieb: s(data.firma), Rechtsform: s(data.rechtsform), Branche: s(data.branche) };
      break;
    case "waffenbesitzkarte":
      details = { Bedürfnis: s(data.beduerfnis), Waffenart: s(data.waffenart) };
      break;
    case "eheschliessung":
      title = "Eheurkunde";
      details = { "Ehepartner/in": s(data.partner_name), Datum: s(data.wunschdatum) };
      break;
    case "scheidung":
      title = "Scheidungsurkunde";
      break;
    case "geburtsurkunde":
      title = `Geburtsurkunde ${s(data.kind_vorname)} ${s(data.kind_nachname)}`.trim();
      break;
    case "sterbeurkunde":
      title = `Sterbeurkunde ${s(data.verstorbene)}`.trim();
      break;
    case "wohnsitz-anmelden":
    case "wohnsitz-ummelden":
    case "meldebescheinigung":
      title = "Meldebescheinigung";
      details = { Anschrift: s(data.strasse) || citizen.street, Stadtteil: s(data.stadtteil) || citizen.district };
      break;
    case "veranstaltung":
      title = `Veranstaltungsgenehmigung ${s(data.name)}`.trim();
      details = { Datum: s(data.datum), Ort: s(data.ort) };
      break;
    default:
      title = `${DOCUMENT_TYPES[type].label}: ${service.title}`;
  }

  return { title, validUntil: valid, details: Object.fromEntries(Object.entries(details).filter(([, v]) => v)) };
}

import type { DocRender } from "../types";

import { Qr, Rosette, SealMark, Signature, Stamp } from "./primitives";

import { formatEuro, formatLongDate } from "@/lib/format";

export const A4_W = 794;
export const A4_H = 1123;
export const A4_MM: [number, number] = [210, 297];
const MM = A4_W / 210;

const str = (v: unknown) => (v === null || v === undefined || v === "" ? "" : Array.isArray(v) ? v.join(", ") : String(v));
const isoDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatLongDate(v) : str(v));
const fullName = (doc: DocRender) => `${doc.holder.firstName} ${doc.holder.lastName}`;

/* ------------------------------------ Urkunde ----------------------------------- */

function certificateContent(doc: DocRender): { heading: string; intro: string; rows: [string, string][] } {
  const a = doc.application?.data ?? {};
  const h = doc.holder;
  const name = fullName(doc);

  switch (doc.application?.serviceSlug) {
    case "eheschliessung":
      return {
        heading: "Eheurkunde",
        intro: `${name} und ${str(a.partner_name) || doc.details["Ehepartner/in"] || "–"} haben vor dem Standesamt Nordverkehr die Ehe miteinander geschlossen.`,
        rows: [
          ["Ehegatte 1", name],
          ["Geboren", `${formatLongDate(h.birthDate)} in ${h.birthPlace}`],
          ["Ehegatte 2", str(a.partner_name) || doc.details["Ehepartner/in"] || "–"],
          ["Tag der Eheschließung", isoDate(a.wunschdatum) || formatLongDate(doc.issuedAt)],
          ["Ort der Eheschließung", str(a.ort) || "Rathaus Nordverkehr"],
          ["Familienname in der Ehe", str(a.familienname) || "–"],
          ["Trauzeugen", str(a.trauzeugen) || "–"],
        ],
      };
    case "geburtsurkunde":
      return {
        heading: "Geburtsurkunde",
        intro: "Im Geburtenregister der Stadt Nordverkehr ist folgende Geburt beurkundet:",
        rows: [
          ["Vorname(n)", str(a.kind_vorname)],
          ["Familienname", str(a.kind_nachname)],
          ["Geburtstag", isoDate(a.geburtsdatum)],
          ["Geburtsort", str(a.geburtsort)],
          ["Eltern", [name, str(a.elternteil_2)].filter(Boolean).join(" und ")],
        ],
      };
    case "sterbeurkunde":
      return {
        heading: "Sterbeurkunde",
        intro: "Im Sterberegister der Stadt Nordverkehr ist folgender Sterbefall beurkundet:",
        rows: [
          ["Verstorbene Person", str(a.verstorbene)],
          ["Bürgernummer", str(a.buergernummer) || "–"],
          ["Sterbetag", isoDate(a.sterbedatum)],
          ["Sterbeort", str(a.sterbeort)],
          ["Angezeigt von", `${name} (${str(a.verhaeltnis)})`],
        ],
      };
    case "scheidung":
      return {
        heading: "Scheidungsurkunde",
        intro: `Die Ehe zwischen ${name} und ${str(a.ehepartner) || "–"} ist geschieden.`,
        rows: [
          ["Tag der Eheschließung", isoDate(a.heiratsdatum)],
          ["Rechtskräftig geschieden am", formatLongDate(doc.issuedAt)],
          ["Art der Scheidung", str(a.art)],
          ["Familienname nach der Scheidung", str(a.name)],
        ],
      };
    default:
      return {
        heading: doc.title,
        intro: `Für ${name}, geboren am ${formatLongDate(h.birthDate)} in ${h.birthPlace}, wird beurkundet:`,
        rows: Object.entries(doc.details),
      };
  }
}

function OrnamentBorder() {
  return (
    <svg aria-hidden className="absolute inset-0" height={A4_H} width={A4_W}>
      <defs>
        <pattern height="16" id="orn" patternUnits="userSpaceOnUse" width="16">
          <path d="M0 8 Q4 0 8 8 T16 8" fill="none" stroke="#a88a4a" strokeWidth="1" />
          <path d="M0 8 Q4 16 8 8 T16 8" fill="none" stroke="#c41e1e" strokeOpacity=".35" strokeWidth=".8" />
        </pattern>
      </defs>
      <rect fill="none" height={A4_H - 56} stroke="#a88a4a" strokeWidth="2" width={A4_W - 56} x="28" y="28" />
      <rect fill="url(#orn)" height={A4_H - 76} width="16" x="38" y="38" />
      <rect fill="url(#orn)" height={A4_H - 76} width="16" x={A4_W - 54} y="38" />
      <rect fill="url(#orn)" height="16" width={A4_W - 76} x="38" y="38" />
      <rect fill="url(#orn)" height="16" width={A4_W - 76} x="38" y={A4_H - 54} />
      <rect fill="none" height={A4_H - 124} stroke="#a88a4a" strokeWidth="1" width={A4_W - 124} x="62" y="62" />
      {[
        [62, 62],
        [A4_W - 62, 62],
        [62, A4_H - 62],
        [A4_W - 62, A4_H - 62],
      ].map(([x, y]) => (
        <Rosette key={`${x}-${y}`} color="#a88a4a" cx={x} cy={y} opacity={0.55} size={24} strokeWidth={0.45} />
      ))}
      <Rosette color="#c9b27a" cx={A4_W / 2} cy={A4_H / 2 + 40} opacity={0.18} size={300} />
    </svg>
  );
}

export function Certificate({ doc }: { doc: DocRender }) {
  const c = certificateContent(doc);

  return (
    <div className="relative overflow-hidden text-[#2a2420]" style={{ width: A4_W, height: A4_H, background: "linear-gradient(170deg,#fffdf7 0%,#f7f0e1 100%)", fontFamily: "var(--font-serif), Georgia, serif" }}>
      <OrnamentBorder />
      <div className="absolute inset-x-[90px] top-[96px] flex flex-col items-center text-center">
        <SealMark color="#c41e1e" size={92} />
        <div className="mt-3 text-[15px] font-semibold tracking-[0.42em] text-[#7a5a2a]">STADT NORDVERKEHR</div>
        <div className="text-[13px] tracking-[0.2em] text-[#7a5a2a]">{doc.authority.name.toUpperCase()}</div>
        <div className="mt-6 text-[64px] font-semibold leading-none tracking-[0.04em]">{c.heading}</div>
        <div className="mt-3 text-[14px] tracking-[0.12em] text-[#7a5a2a]">Nr. {doc.number}</div>
        <p className="mt-7 max-w-[560px] text-[20px] italic leading-relaxed">{c.intro}</p>
      </div>
      <div className="absolute inset-x-[110px] top-[500px] flex flex-col gap-[10px]">
        {c.rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[210px_1fr] items-end gap-4">
              <span className="text-[15px] text-[#7a5a2a]">{k}</span>
              <span className="truncate border-b border-dotted border-[#a88a4a] pb-1 text-[20px] font-semibold">{v}</span>
            </div>
          ))}
      </div>
      <div className="absolute bottom-[96px] left-[110px] text-[17px]">
        Nordverkehr, den {formatLongDate(doc.issuedAt)}
        <div className="mt-8">
          <Signature name={doc.issuer ?? "Standesbeamter"} size={42} />
          <div className="mt-1 w-[260px] border-t border-[#2a2420] pt-1 text-[14px] text-[#7a5a2a]">Der Standesbeamte / Die Standesbeamtin</div>
        </div>
      </div>
      <div className="absolute bottom-[86px] left-[400px]">
        <Stamp authority={doc.authority.name} color="#a3242b" size={140} />
      </div>
      <div className="absolute bottom-[96px] right-[100px] flex flex-col items-center gap-1 text-[10px] text-[#7a5a2a]" style={{ fontFamily: "var(--font-inter), Arial" }}>
        <Qr size={84} svg={doc.qrSvg} />
        Echtheit prüfen
      </div>
    </div>
  );
}

/* ---------------------------------- Amtsschreiben --------------------------------- */

function letterContent(doc: DocRender) {
  const a = doc.application;
  const data = a?.data ?? {};
  const h = doc.holder;
  const since = a ? formatLongDate(a.submittedAt) : formatLongDate(doc.issuedAt);
  const ref = a ? ` (Az. ${a.reference})` : "";
  const rows: [string, string][] = [];
  const paragraphs: string[] = [];
  const conditions: string[] = [];
  let legal = false;
  let subject = doc.title;

  switch (doc.type) {
    case "gewerbeschein":
      subject = `Gewerbeanmeldung – Bescheinigung (${doc.title})`;
      paragraphs.push(`die Anzeige über den Beginn Ihres Gewerbebetriebes vom ${since}${ref} ist eingegangen. Ihr Gewerbe ist im Gewerberegister der Stadt Nordverkehr eingetragen.`);
      rows.push(
        ["Betrieb", str(data.firma) || doc.details.Betrieb],
        ["Rechtsform", str(data.rechtsform) || doc.details.Rechtsform],
        ["Branche", str(data.branche) || doc.details.Branche],
        ["Betriebsstätte", str(data.betriebsstaette)],
        ["Beginn der Tätigkeit", isoDate(data.beginn)],
        ["Tätigkeit", str(data.taetigkeit)],
      );
      conditions.push("Diese Bescheinigung berechtigt nicht zur Ausübung erlaubnispflichtiger Tätigkeiten (z. B. Gaststätte, Bewachung).", "Änderungen und die Aufgabe des Gewerbes sind innerhalb eines Monats anzuzeigen.");
      break;
    case "genehmigung":
      paragraphs.push(`auf Ihren Antrag vom ${since}${ref} erteilen wir Ihnen hiermit die nachstehende Genehmigung: ${doc.title}.`);
      conditions.push("Die Genehmigung ist nicht übertragbar.", "Sie kann bei Verstößen gegen die Auflagen jederzeit widerrufen werden.", "Den Anordnungen von Polizei und Ordnungsdienst ist Folge zu leisten.");
      legal = true;
      break;
    case "bescheid":
      paragraphs.push(`auf Ihren Antrag vom ${since}${ref}${a ? ` – ${a.serviceTitle} –` : ""} ergeht folgender Bescheid:`);
      paragraphs.push("1. Dem Antrag wird stattgegeben.");
      if (a && a.feeCents > 0) paragraphs.push(`2. Für diesen Bescheid wird eine Gebühr in Höhe von ${formatEuro(a.feeCents)} erhoben.${a.feePaid ? " Die Gebühr wurde bereits entrichtet." : ""}`);
      paragraphs.push("Begründung: Die Prüfung Ihres Antrags hat ergeben, dass die Voraussetzungen vorliegen.");
      legal = true;
      break;
    default:
      paragraphs.push(
        a?.serviceSlug?.startsWith("wohnsitz") || a?.serviceSlug === "meldebescheinigung"
          ? "hiermit wird bescheinigt, dass die nachstehend genannte Person im Melderegister der Stadt Nordverkehr mit der folgenden Anschrift gemeldet ist."
          : `hiermit wird auf Ihren Antrag vom ${since}${ref} Folgendes bescheinigt: ${doc.title}.`,
      );
  }

  rows.unshift(["Name", `${h.lastName}, ${h.firstName}`], ["Geburtsdatum, -ort", `${formatLongDate(h.birthDate)}, ${h.birthPlace}`], ["Anschrift", `${h.street}, ${h.postalCode} Nordverkehr`]);
  for (const [k, v] of Object.entries(doc.details)) if (!rows.some(([rk]) => rk === k)) rows.push([k, v]);
  if (doc.validUntil) rows.push(["Gültig bis", formatLongDate(doc.validUntil)]);

  return { subject, paragraphs, rows: rows.filter(([, v]) => v), conditions, legal };
}

export function OfficialLetter({ doc }: { doc: DocRender }) {
  const c = letterContent(doc);
  const h = doc.holder;
  const salutation = h.gender === "weiblich" ? `Sehr geehrte Frau ${h.lastName},` : h.gender === "männlich" ? `Sehr geehrter Herr ${h.lastName},` : `Guten Tag ${h.firstName} ${h.lastName},`;

  return (
    <div className="relative overflow-hidden bg-white text-[#1d1a1f]" style={{ width: A4_W, height: A4_H, fontFamily: "var(--font-inter), Arial, sans-serif" }}>
      {/* Falz- und Lochmarken nach DIN 5008 */}
      <div className="absolute left-0 h-px w-[18px] bg-[#9aa0a6]" style={{ top: 105 * MM }} />
      <div className="absolute left-0 h-px w-[26px] bg-[#9aa0a6]" style={{ top: 148.5 * MM }} />
      <div className="absolute left-0 h-px w-[18px] bg-[#9aa0a6]" style={{ top: 210 * MM }} />

      <div className="absolute flex items-center gap-3" style={{ left: 25 * MM, top: 14 * MM }}>
        <SealMark size={58} />
        <div className="leading-tight">
          <div className="text-[19px] font-bold tracking-[0.02em]">Stadt Nordverkehr</div>
          <div className="text-[14px] text-[#5c6470]">{doc.authority.name}</div>
        </div>
      </div>
      <div className="absolute text-right text-[10.5px] leading-[1.5] text-[#5c6470]" style={{ right: 20 * MM, top: 15 * MM }}>
        {doc.authority.address}
        <br />
        Telefon {doc.authority.phone} · Behördennummer 115
        <br />
        rathaus.nordverkehr.xyz
      </div>

      {/* Anschriftfeld */}
      <div className="absolute" style={{ left: 25 * MM, top: 45 * MM, width: 85 * MM }}>
        <div className="mb-2 border-b border-[#c9cdd2] pb-[2px] text-[8.5px] text-[#5c6470]">Stadt Nordverkehr · {doc.authority.name} · {doc.authority.address}</div>
        <div className="text-[13px] leading-[1.5]">
          {h.gender === "weiblich" ? "Frau" : h.gender === "männlich" ? "Herrn" : ""}
          <br />
          {h.firstName} {h.lastName}
          <br />
          {h.street}
          <br />
          {h.postalCode} Nordverkehr
        </div>
      </div>

      {/* Infoblock */}
      <div className="absolute grid grid-cols-[auto_1fr] gap-x-4 gap-y-[3px] text-[10.5px]" style={{ left: 125 * MM, top: 50 * MM }}>
        {[
          ["Ihr Antrag", doc.application ? formatLongDate(doc.application.submittedAt) : "–"],
          ["Aktenzeichen", doc.application?.reference ?? "–"],
          ["Dokument-Nr.", doc.number],
          ["Bürgernummer", h.citizenNumber],
          ["Bearbeitung", doc.issuer ?? doc.authority.name],
          ["Datum", formatLongDate(doc.issuedAt)],
        ].map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-[#5c6470]">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>

      <div className="absolute" style={{ left: 25 * MM, right: 20 * MM, top: 98 * MM }}>
        <div className="text-[15px] font-bold">{c.subject}</div>
        <p className="mt-5 text-[13px]">{salutation}</p>
        {c.paragraphs.map((p, i) => (
          <p key={i} className="mt-3 text-[13px] leading-[1.6]">{p}</p>
        ))}
        <div className="mt-4 overflow-hidden rounded-[6px] border border-[#d9dde2]">
          {c.rows.map(([k, v], i) => (
            <div key={k} className={`grid grid-cols-[170px_1fr] gap-3 px-3 py-[6px] text-[12.5px] ${i % 2 ? "bg-[#f6f7f9]" : ""}`}>
              <span className="text-[#5c6470]">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
        {c.conditions.length ? (
          <ul className="mt-4 list-disc pl-5 text-[12px] leading-[1.55] text-[#3a3f47]">
            {c.conditions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-5 text-[13px]">Mit freundlichen Grüßen</p>
        <p className="text-[12px] text-[#5c6470]">Im Auftrag</p>
        <div className="mt-1 flex items-end gap-6">
          <div>
            <Signature name={doc.issuer ?? "Sachbearbeitung"} size={38} />
            <div className="w-[220px] border-t border-[#1d1a1f] pt-1 text-[11px] text-[#5c6470]">{doc.issuer ?? doc.authority.name}</div>
          </div>
          <Stamp authority={doc.authority.name} size={120} />
        </div>
      </div>

      {c.legal ? (
        <div className="absolute text-[9.5px] leading-[1.5] text-[#5c6470]" style={{ left: 25 * MM, right: 48 * MM, bottom: 22 * MM }}>
          <b>Rechtsbehelfsbelehrung:</b> Gegen diesen Bescheid kann innerhalb eines Monats nach Bekanntgabe Widerspruch erhoben werden. Der Widerspruch ist schriftlich oder über das Bürgerkonto beim {doc.authority.name} der Stadt Nordverkehr einzulegen.
        </div>
      ) : null}
      <div className="absolute flex flex-col items-center gap-1 text-[8.5px] text-[#5c6470]" style={{ right: 20 * MM, bottom: 14 * MM }}>
        <Qr size={72} svg={doc.qrSvg} />
        Echtheit prüfen
      </div>
      <div className="absolute border-t border-[#d9dde2] pt-2 text-[8.5px] text-[#9aa0a6]" style={{ left: 25 * MM, right: 48 * MM, bottom: 10 * MM }}>
        Stadt Nordverkehr · Rathausmarkt 1 · Behördennummer 115 · Prüfung unter rathaus.nordverkehr.xyz/pruefen · Fiktives Dokument im Roleplay-Projekt Nordverkehr
      </div>
    </div>
  );
}

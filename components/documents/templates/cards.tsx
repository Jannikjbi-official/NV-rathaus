import type { DocRender } from "../types";

import { Field, Hologram, MicroText, Photo, Rosette, SealMark, SecurityBackground, Signature, Waves } from "./primitives";

import { formatDate } from "@/lib/format";
import { mrzTD1 } from "@/lib/mrz";
import { DOCUMENT_TYPES } from "@/lib/status";

export const CARD_W = 856;
export const CARD_H = 540;
export const CARD_MM: [number, number] = [85.6, 54];

const d = (iso: string | null | undefined) => (iso ? formatDate(iso) : "–");
const up = (s: string) => s.toLocaleUpperCase("de-DE");

/** Rahmen einer Karte im Scheckkartenformat. */
function CardFrame({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="relative overflow-hidden text-[#1d1a1f]" style={{ width: CARD_W, height: CARD_H, borderRadius: 32, background: bg ?? "#f6f1ee", fontFamily: "var(--font-inter), Arial, sans-serif" }}>
      {children}
    </div>
  );
}

/** Zugangsnummer (CAN), sechsstellig, aus der Dokumentnummer abgeleitet. */
function can(number: string) {
  let h = 0;

  for (const c of number) h = (h * 31 + c.charCodeAt(0)) % 1_000_000;

  return String(h).padStart(6, "0");
}

function Header({ title, subtitle, accent = "#c41e1e", number }: { title: string; subtitle: string; accent?: string; number: string }) {
  return (
    <div className="absolute left-[34px] right-[34px] top-[26px] flex items-start justify-between">
      <div className="flex items-center gap-3">
        <SealMark color={accent} size={58} />
        <div className="leading-none">
          <div className="text-[13px] font-bold tracking-[0.32em]" style={{ color: accent }}>STADT NORDVERKEHR</div>
          <div className="mt-[6px] text-[27px] font-extrabold tracking-[0.02em]">{title}</div>
          <div className="mt-[3px] text-[11px] italic text-[#5c6470]">{subtitle}</div>
        </div>
      </div>
      <div className="text-right leading-none">
        <div className="text-[34px] font-black tracking-[0.08em]" style={{ color: accent }}>NVK</div>
        <div className="mt-2 text-[17px] font-semibold tracking-[0.12em]" style={{ fontFamily: "var(--font-mrz)", color: accent }}>{number}</div>
      </div>
    </div>
  );
}

/* ------------------------------ Personalausweis ------------------------------ */

export function IdCardFront({ doc }: { doc: DocRender }) {
  const h = doc.holder;

  return (
    <CardFrame>
      <SecurityBackground from="#fbf2ef" height={CARD_H} line="#c86b7a" rosette={{ cx: 640, cy: 300, size: 230 }} to="#e7f0f2" width={CARD_W} />
      <MicroText text="Stadt Nordverkehr Personalausweis" top={104} width={CARD_W} />
      <Header number={doc.number} subtitle="Identity Card · Carte d'identité" title="PERSONALAUSWEIS" />

      <div className="absolute left-[34px] top-[124px]">
        <Photo height={300} src={h.photoUrl} width={232} />
      </div>
      <Hologram size={120} style={{ left: 200, top: 340 }} />

      <div className="absolute left-[292px] right-[34px] top-[122px] grid grid-cols-2 gap-x-6 gap-y-[14px]">
        <Field className="col-span-2" en="Surname" label="Name" size={30} value={up(h.lastName)} />
        {h.birthName ? <Field className="col-span-2" en="Name at birth" label="Geburtsname" value={up(h.birthName)} /> : null}
        <Field className="col-span-2" en="Given names" label="Vornamen" size={26} value={h.firstName} />
        <Field en="Date of birth" label="Geburtstag" value={d(h.birthDate)} />
        <Field en="Nationality" label="Staatsangehörigkeit" value={up(h.nationality === "deutsch" ? "nordverkehrisch" : h.nationality)} />
        <Field en="Place of birth" label="Geburtsort" value={h.birthPlace} />
        <Field en="Date of expiry" label="Gültig bis" value={d(doc.validUntil)} />
      </div>

      <div className="absolute bottom-[26px] left-[34px] flex items-end gap-8">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#5c6470]">Unterschrift / Signature</div>
          <Signature name={`${h.firstName} ${h.lastName}`} size={40} />
        </div>
      </div>
      <div className="absolute bottom-[96px] right-[150px]">
        <Photo ghost height={110} radius={6} src={h.photoUrl} width={86} />
      </div>
      <div className="absolute bottom-[26px] right-[34px] text-right">
        <div className="text-[10px] uppercase tracking-[0.08em] text-[#5c6470]">Zugangsnr. / CAN</div>
        <div className="text-[28px] tracking-[0.18em]" style={{ fontFamily: "var(--font-mrz)" }}>{can(doc.number)}</div>
      </div>
    </CardFrame>
  );
}

export function IdCardBack({ doc }: { doc: DocRender }) {
  const h = doc.holder;
  const mrz = mrzTD1({ number: doc.number, lastName: h.lastName, firstName: h.firstName, birthDate: h.birthDate, expiry: doc.validUntil, gender: h.gender });

  return (
    <CardFrame>
      <SecurityBackground from="#eef4f2" height={CARD_H} line="#5a8f9a" rosette={{ cx: 700, cy: 150, size: 170 }} to="#f8efee" width={CARD_W} />
      <div className="absolute left-[34px] right-[34px] top-[30px] grid grid-cols-[1.4fr_1fr] gap-x-8 gap-y-[14px]">
        <Field className="col-span-2" en="Address" label="Anschrift" size={22} value={<>{h.street}<br />{h.postalCode} NORDVERKEHR-{up(h.district)}</>} />
        <Field en="Height" label="Größe" value={h.heightCm ? `${h.heightCm} cm` : "–"} />
        <Field en="Colour of eyes" label="Augenfarbe" value={h.eyeColor ? up(h.eyeColor) : "–"} />
        <Field en="Authority" label="Behörde" value={`STADT NORDVERKEHR, ${up(doc.authority.name)}`} />
        <Field en="Date of issue" label="Datum" value={d(doc.issuedAt)} />
        <Field en="Citizen no." label="Bürgernummer" mono value={h.citizenNumber} />
      </div>
      <SealMark className="absolute opacity-80" color="#5a8f9a" size={92} style={{ right: 40, top: 168 }} />
      <MicroText color="#3d6f79" text="Nordverkehr · Hansestadt · Rathaus" top={300} width={CARD_W} />
      <div className="absolute inset-x-0 bottom-0 bg-white/80 px-[34px] pb-[22px] pt-[16px]">
        {mrz.map((line) => (
          <div key={line} className="leading-[1.18]" style={{ fontFamily: "var(--font-mrz)", fontSize: 40, letterSpacing: "0.105em" }}>
            {line}
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

/* --------------------------------- Führerschein -------------------------------- */

const CLASSES: { code: string; label: string }[] = [
  { code: "AM", label: "Kleinkraftrad" },
  { code: "A1", label: "Leichtkraftrad" },
  { code: "A2", label: "Motorrad bis 35 kW" },
  { code: "A", label: "Motorrad" },
  { code: "B", label: "PKW" },
  { code: "BE", label: "PKW mit Anhänger" },
  { code: "C", label: "LKW" },
  { code: "CE", label: "LKW mit Anhänger" },
  { code: "D", label: "Bus" },
];

function grantedClasses(doc: DocRender) {
  const raw = doc.details.Klassen ?? "";

  return raw.split(/[,;\s]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
}

export function LicenseFront({ doc }: { doc: DocRender }) {
  const h = doc.holder;
  const classes = grantedClasses(doc);

  return (
    <CardFrame bg="#f7e4e8">
      <svg aria-hidden className="absolute inset-0" height={CARD_H} width={CARD_W}>
        <rect fill="#f7e4e8" height={CARD_H} width={CARD_W} />
        <Waves color="#c96a86" height={CARD_H} opacity={0.25} width={CARD_W} />
        <Rosette color="#c96a86" cx={160} cy={300} size={170} />
      </svg>
      <div className="absolute left-[34px] top-[26px] flex size-[92px] flex-col items-center justify-center rounded-full" style={{ background: "#1e3a7a" }}>
        <SealMark color="#f5d36b" size={52} />
        <span className="mt-[2px] text-[15px] font-black tracking-[0.12em] text-white">NVK</span>
      </div>
      <div className="absolute left-[148px] top-[30px] leading-none">
        <div className="text-[34px] font-extrabold tracking-[0.04em] text-[#8a1c3a]">FÜHRERSCHEIN</div>
        <div className="mt-[6px] text-[13px] font-semibold tracking-[0.28em] text-[#8a1c3a]">STADT NORDVERKEHR</div>
        <div className="mt-[3px] text-[11px] italic text-[#6b4a55]">Driving licence · Permis de conduire</div>
      </div>
      <div className="absolute left-[34px] top-[150px]">
        <Photo height={290} src={h.photoUrl} width={224} />
      </div>
      <div className="absolute left-[290px] right-[30px] top-[146px] flex flex-col gap-[9px] text-[21px]">
        <Row n="1." v={up(h.lastName)} big />
        <Row n="2." v={h.firstName} />
        <Row n="3." v={`${d(h.birthDate)}  ${up(h.birthPlace)}`} />
        <div className="flex gap-8">
          <Row n="4a." v={d(doc.issuedAt)} />
          <Row n="4b." v={d(doc.validUntil)} />
        </div>
        <Row n="4c." v={`Stadt Nordverkehr, ${doc.authority.name}`} small />
        <Row n="5." v={doc.number} mono />
        <div className="flex items-end gap-3">
          <span className="text-[15px] font-semibold text-[#8a1c3a]">7.</span>
          <Signature name={`${h.firstName} ${h.lastName}`} size={38} />
        </div>
        <Row n="9." v={classes.join(" ") || "–"} big />
      </div>
      <Hologram size={110} style={{ left: 175, top: 395 }} />
    </CardFrame>
  );
}

function Row({ n, v, big, small, mono }: { n: string; v: string; big?: boolean; small?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 leading-tight">
      <span className="w-9 shrink-0 text-[15px] font-semibold text-[#8a1c3a]">{n}</span>
      <span className="truncate font-semibold" style={{ fontSize: big ? 26 : small ? 16 : 21, fontFamily: mono ? "var(--font-mrz)" : undefined, letterSpacing: mono ? "0.1em" : undefined }}>{v}</span>
    </div>
  );
}

export function LicenseBack({ doc }: { doc: DocRender }) {
  const classes = grantedClasses(doc);

  return (
    <CardFrame bg="#f7e4e8">
      <svg aria-hidden className="absolute inset-0" height={CARD_H} width={CARD_W}>
        <rect fill="#f9ecef" height={CARD_H} width={CARD_W} />
        <Waves color="#c96a86" height={CARD_H} opacity={0.18} width={CARD_W} />
      </svg>
      <table className="absolute left-[28px] top-[24px] table-fixed border-collapse text-[17px]" style={{ width: CARD_W - 56 }}>
        <colgroup>
          <col style={{ width: 70 }} />
          <col />
          <col style={{ width: 170 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 60 }} />
        </colgroup>
        <thead>
          <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a1c3a]">
            <th className="pb-2 pl-2">9.</th>
            <th className="pb-2" />
            <th className="pb-2">10. Erteilt</th>
            <th className="pb-2">11. Gültig bis</th>
            <th className="pb-2">12.</th>
          </tr>
        </thead>
        <tbody>
          {CLASSES.map((c) => {
            const on = classes.includes(c.code);

            return (
              <tr key={c.code} className="border-t border-[#d9a9b6]" style={{ opacity: on ? 1 : 0.45 }}>
                <td className="py-[7px] pl-2 font-black">{c.code}</td>
                <td className="text-[14px] text-[#6b4a55]">{c.label}</td>
                <td className="font-semibold">{on ? d(doc.issuedAt) : ""}</td>
                <td className="font-semibold">{on ? d(doc.validUntil) : ""}</td>
                <td className="text-[13px]">{on && c.code.startsWith("C") ? "95" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="absolute bottom-[18px] left-[30px] right-[30px] flex items-center justify-between text-[11px] text-[#6b4a55]">
        <span>13. Stadt Nordverkehr · {doc.authority.name} · {doc.authority.address}</span>
        <span style={{ fontFamily: "var(--font-mrz)" }}>{doc.number}</span>
      </div>
    </CardFrame>
  );
}

/* ------------------- Waffen-, Jagd- und Fischereischein (Karte) ------------------- */

const PERMIT_THEMES: Record<string, { from: string; to: string; line: string; accent: string }> = {
  waffenbesitzkarte: { from: "#eef1ea", to: "#dfe7dc", line: "#5d7a55", accent: "#2f4a2a" },
  waffenschein: { from: "#e9efe9", to: "#d6e2db", line: "#3f6b5a", accent: "#1f4637" },
  jagdschein: { from: "#f1eee3", to: "#e4dcc6", line: "#8b7a4a", accent: "#5b4a1c" },
  fischereischein: { from: "#eaf1f8", to: "#d7e6f2", line: "#4f7ea6", accent: "#1f4a73" },
};

export function PermitFront({ doc }: { doc: DocRender }) {
  const h = doc.holder;
  const t = PERMIT_THEMES[doc.type] ?? PERMIT_THEMES.waffenbesitzkarte;

  return (
    <CardFrame>
      <SecurityBackground from={t.from} height={CARD_H} line={t.line} rosette={{ cx: 680, cy: 330, size: 210 }} to={t.to} width={CARD_W} />
      <Header accent={t.accent} number={doc.number} subtitle={doc.title !== DOCUMENT_TYPES[doc.type].label ? doc.title : "Amtliche Erlaubnis"} title={up(DOCUMENT_TYPES[doc.type].label)} />
      <div className="absolute left-[34px] top-[128px]">
        <Photo height={290} src={h.photoUrl} width={224} />
      </div>
      <div className="absolute left-[290px] right-[34px] top-[128px] grid grid-cols-2 gap-x-6 gap-y-[16px]">
        <Field className="col-span-2" label="Name, Vorname" size={28} value={`${up(h.lastName)}, ${h.firstName}`} />
        <Field label="Geburtsdatum" value={d(h.birthDate)} />
        <Field label="Geburtsort" value={h.birthPlace} />
        <Field label="Ausgestellt" value={d(doc.issuedAt)} />
        <Field label="Gültig bis" value={d(doc.validUntil)} />
        <Field className="col-span-2" label="Bürgernummer" mono value={h.citizenNumber} />
      </div>
      <div className="absolute bottom-[24px] left-[34px]">
        <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#5c6470]">Unterschrift</div>
        <Signature name={`${h.firstName} ${h.lastName}`} size={38} />
      </div>
      <Hologram size={104} style={{ right: 40, bottom: 30 }} />
    </CardFrame>
  );
}

export function PermitBack({ doc }: { doc: DocRender }) {
  const t = PERMIT_THEMES[doc.type] ?? PERMIT_THEMES.waffenbesitzkarte;
  const entries = Object.entries(doc.details);
  const note: Record<string, string> = {
    waffenbesitzkarte: "Berechtigt zum Erwerb und Besitz der eingetragenen Waffen. Nicht zum Führen in der Öffentlichkeit.",
    waffenschein: "Berechtigt zum Führen der eingetragenen Schusswaffe. Mitführpflicht zusammen mit der Waffenbesitzkarte.",
    jagdschein: "Berechtigt zur Ausübung der Jagd in den zugelassenen Revieren der Stadt Nordverkehr.",
    fischereischein: "Berechtigt zum Fischfang in den Gewässern der Stadt Nordverkehr nach Maßgabe der Fischereiordnung.",
  };

  return (
    <CardFrame>
      <SecurityBackground from={t.to} height={CARD_H} line={t.line} to={t.from} width={CARD_W} />
      <div className="absolute left-[34px] right-[34px] top-[30px]">
        <div className="text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: t.accent }}>Eintragungen</div>
        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-[14px]">
          {entries.length ? entries.map(([k, v]) => <Field key={k} label={k} value={v} />) : <Field label="Eintragungen" value="keine" />}
        </div>
      </div>
      <p className="absolute bottom-[86px] left-[34px] right-[34px] text-[15px] leading-snug text-[#3a3f47]">{note[doc.type] ?? ""}</p>
      <div className="absolute bottom-[26px] left-[34px] right-[34px] flex items-end justify-between text-[12px] text-[#5c6470]">
        <span>Stadt Nordverkehr · {doc.authority.name}<br />{doc.authority.address}</span>
        <span className="text-[16px] tracking-[0.12em]" style={{ fontFamily: "var(--font-mrz)", color: t.accent }}>{doc.number}</span>
      </div>
    </CardFrame>
  );
}

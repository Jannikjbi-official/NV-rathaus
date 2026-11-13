import type { DocRender } from "../types";

import { Field, Hologram, MicroText, Photo, Rosette, SealMark, Signature, Waves } from "./primitives";

import { formatDate } from "@/lib/format";
import { mrzSex, mrzTD3 } from "@/lib/mrz";

export const PASS_PAGE_W = 1250;
export const PASS_PAGE_H = 880;
export const PASS_PAGE_MM: [number, number] = [125, 88];
export const PASS_COVER_W = 880;
export const PASS_COVER_H = 1250;
export const PASS_COVER_MM: [number, number] = [88, 125];

const GOLD = "#d8b45a";
const up = (s: string) => s.toLocaleUpperCase("de-DE");
const d = (iso: string | null | undefined) => (iso ? formatDate(iso) : "–");

export function PassportCover() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: PASS_COVER_W,
        height: PASS_COVER_H,
        borderRadius: "10px 34px 34px 10px",
        background: "radial-gradient(120% 90% at 50% 40%, #6e1f28 0%, #4e141c 60%, #3a0e14 100%)",
        fontFamily: "var(--font-serif), Georgia, serif",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: "repeating-linear-gradient(35deg, rgba(0,0,0,.35) 0 2px, transparent 2px 5px), repeating-linear-gradient(-35deg, rgba(255,255,255,.08) 0 1px, transparent 1px 6px)" }}
      />
      <div aria-hidden className="absolute bottom-0 left-0 top-0 w-[26px]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.45), transparent)" }} />
      <div className="absolute inset-x-0 top-[120px] text-center" style={{ color: GOLD }}>
        <div className="text-[44px] font-semibold tracking-[0.34em]">STADT</div>
        <div className="text-[64px] font-bold tracking-[0.22em]">NORDVERKEHR</div>
      </div>
      <div className="absolute left-1/2 top-[380px] -translate-x-1/2" style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,.35))" }}>
        <SealMark color={GOLD} size={360} />
      </div>
      <div className="absolute inset-x-0 bottom-[230px] text-center" style={{ color: GOLD }}>
        <div className="text-[76px] font-bold tracking-[0.2em]">REISEPASS</div>
        <div className="mt-2 text-[30px] tracking-[0.3em]">PASSPORT · PASSEPORT</div>
      </div>
      <svg aria-hidden className="absolute bottom-[110px] left-1/2 -translate-x-1/2" height="62" viewBox="0 0 100 62" width="100">
        <rect fill="none" height="54" rx="4" stroke={GOLD} strokeWidth="4" width="92" x="4" y="4" />
        <circle cx="50" cy="31" fill="none" r="13" stroke={GOLD} strokeWidth="4" />
        <path d="M4 31h24M72 31h24" stroke={GOLD} strokeWidth="4" />
      </svg>
    </div>
  );
}

export function PassportDataPage({ doc }: { doc: DocRender }) {
  const h = doc.holder;
  const mrz = mrzTD3({ number: doc.number, lastName: h.lastName, firstName: h.firstName, birthDate: h.birthDate, expiry: doc.validUntil, gender: h.gender });
  const W = PASS_PAGE_W;
  const H = PASS_PAGE_H;

  return (
    <div className="relative overflow-hidden text-[#1d1a1f]" style={{ width: W, height: H, borderRadius: 18, background: "#f3eee6", fontFamily: "var(--font-inter), Arial, sans-serif" }}>
      <svg aria-hidden className="absolute inset-0" height={H} width={W}>
        <defs>
          <linearGradient id="pp-bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f6efe6" />
            <stop offset=".55" stopColor="#efe7ef" />
            <stop offset="1" stopColor="#e6eef0" />
          </linearGradient>
        </defs>
        <rect fill="url(#pp-bg)" height={H} width={W} />
        <Waves amplitude={18} color="#8f5a7a" height={H} lines={36} opacity={0.2} period={300} width={W} />
        <Rosette color="#8f5a7a" cx={930} cy={360} size={300} />
        <Rosette color="#5a8f9a" cx={930} cy={360} opacity={0.25} size={180} />
      </svg>
      <MicroText color="#7a3a5a" text="Reisepass Stadt Nordverkehr" top={128} width={W} />

      <div className="absolute left-[44px] right-[44px] top-[34px] flex items-start justify-between">
        <div className="flex items-center gap-4">
          <SealMark color="#6e1f28" size={70} />
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-[0.34em] text-[#6e1f28]">STADT NORDVERKEHR</div>
            <div className="mt-2 text-[34px] font-extrabold tracking-[0.04em]">REISEPASS</div>
            <div className="mt-1 text-[13px] italic text-[#5c6470]">Passport · Passeport</div>
          </div>
        </div>
        <div className="flex gap-10 text-right">
          <Field en="Type" label="Typ" size={26} value="P" />
          <Field en="Code" label="Kode" size={26} value="NVK" />
          <Field en="Passport No." label="Pass-Nr." mono size={26} value={doc.number.replace(/^NV-RP-/, "")} />
        </div>
      </div>

      <div className="absolute left-[44px] top-[156px]">
        <Photo height={430} src={h.photoUrl} width={332} />
      </div>
      <Hologram size={150} style={{ left: 300, top: 470 }} />

      <div className="absolute left-[420px] right-[44px] top-[150px] grid grid-cols-2 gap-x-10 gap-y-[18px]">
        <Field className="col-span-2" en="Surname" label="1. Name" size={36} value={up(h.lastName)} />
        <Field className="col-span-2" en="Given names" label="2. Vornamen" size={30} value={h.firstName} />
        <Field en="Nationality" label="3. Staatsangehörigkeit" size={24} value="NORDVERKEHRISCH" />
        <Field en="Date of birth" label="4. Geburtstag" size={24} value={d(h.birthDate)} />
        <Field en="Sex" label="5. Geschlecht" size={24} value={mrzSex(h.gender)} />
        <Field en="Place of birth" label="6. Geburtsort" size={24} value={up(h.birthPlace)} />
        <Field en="Date of issue" label="7. Ausstellungsdatum" size={24} value={d(doc.issuedAt)} />
        <Field en="Authority" label="8. Behörde" size={20} value={`Stadt Nordverkehr, ${doc.authority.name}`} />
        <Field en="Date of expiry" label="9. Gültig bis" size={24} value={d(doc.validUntil)} />
        <div>
          <div className="text-[11px] uppercase tracking-[0.06em] text-[#5c6470]">10. Unterschrift <span className="italic normal-case">/ Signature</span></div>
          <Signature name={`${h.firstName} ${h.lastName}`} size={44} />
        </div>
      </div>
      <div className="absolute bottom-[170px] right-[60px]">
        <Photo ghost height={130} radius={6} src={h.photoUrl} width={100} />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-white/80 px-[44px] pb-[30px] pt-[22px]">
        {mrz.map((line) => (
          <div key={line} className="leading-[1.2]" style={{ fontFamily: "var(--font-mrz)", fontSize: 44, letterSpacing: "0.06em" }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

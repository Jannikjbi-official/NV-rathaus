import type { DocRender } from "../types";

import { Rosette, SealMark, Stamp, Waves } from "./primitives";

import { formatDate } from "@/lib/format";

export const VEH_W = 1260;
export const VEH_H = 630;
export const VEH_MM: [number, number] = [210, 105];

const up = (s: string) => s.toLocaleUpperCase("de-DE");
const str = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));

function Box({ code, label, value, className, big }: { code: string; label: string; value: string; className?: string; big?: boolean }) {
  return (
    <div className={`border border-[#9fb39a] bg-white/40 px-3 py-[6px] ${className ?? ""}`}>
      <div className="flex gap-2 text-[11px] leading-tight text-[#4b6046]">
        <span className="font-bold">{code}</span>
        <span>{label}</span>
      </div>
      <div className="truncate font-semibold leading-tight" style={{ fontSize: big ? 26 : 19 }}>{value || "–"}</div>
    </div>
  );
}

export function Plate({ text, height = 70 }: { text: string; height?: number }) {
  const [prefix, ...rest] = text.trim().split(/\s+/);

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-[8px] border-[3px] border-[#111] bg-white" style={{ height }}>
      <div className="flex w-[38px] flex-col items-center justify-end bg-[#1e3a9a] pb-[6px] text-[15px] font-bold text-white" style={{ width: height * 0.55 }}>
        <SealMark color="#f5d36b" size={height * 0.36} />
        NV
      </div>
      <div className="flex items-center px-4 font-bold tracking-[0.06em]" style={{ fontSize: height * 0.62, fontFamily: "var(--font-mrz)" }}>
        {prefix} {rest.join(" ")}
      </div>
    </div>
  );
}

export function VehicleRegistration({ doc }: { doc: DocRender }) {
  const h = doc.holder;
  const data = doc.application?.data ?? {};
  const plate = doc.details.Kennzeichen || str(data.wunschkennzeichen) || "HH-NV";
  const vehicle = doc.details.Fahrzeug || str(data.hersteller_modell);
  const [make, ...model] = vehicle.split(/\s+/);

  return (
    <div className="relative overflow-hidden text-[#1d2a1b]" style={{ width: VEH_W, height: VEH_H, background: "#e8efe3", borderRadius: 6, fontFamily: "var(--font-inter), Arial, sans-serif" }}>
      <svg aria-hidden className="absolute inset-0" height={VEH_H} width={VEH_W}>
        <rect fill="#e9f0e4" height={VEH_H} width={VEH_W} />
        <Waves amplitude={10} color="#6e8f66" height={VEH_H} lines={40} opacity={0.2} period={180} width={VEH_W} />
        <Rosette color="#6e8f66" cx={1060} cy={330} size={190} />
      </svg>

      <div className="absolute left-[36px] right-[36px] top-[24px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SealMark color="#2f5a2a" size={54} />
          <div className="leading-none">
            <div className="text-[13px] font-bold tracking-[0.3em] text-[#2f5a2a]">STADT NORDVERKEHR</div>
            <div className="mt-1 text-[26px] font-extrabold">Zulassungsbescheinigung Teil I</div>
            <div className="text-[13px] italic text-[#4b6046]">Fahrzeugschein · Registration Certificate Part I</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#4b6046]">Dokumentnummer</div>
          <div className="text-[22px] font-bold tracking-[0.1em] text-[#a3242b]" style={{ fontFamily: "var(--font-mrz)" }}>{doc.number}</div>
        </div>
      </div>

      <div className="absolute left-[36px] top-[120px] grid w-[700px] grid-cols-2">
        <div className="col-span-2 flex items-center gap-5 border border-[#9fb39a] bg-white/40 px-3 py-3">
          <div className="text-[11px] text-[#4b6046]"><b>A</b> Amtliches Kennzeichen</div>
          <Plate text={plate} />
        </div>
        <Box code="B" label="Datum der Zulassung" value={formatDate(doc.issuedAt)} />
        <Box code="I" label="Datum dieser Zulassung" value={formatDate(doc.issuedAt)} />
        <Box className="col-span-2" code="E" label="Fahrzeug-Identifizierungsnummer" value={up(doc.details.FIN || str(data.fin))} />
        <Box code="D.1" label="Marke" value={up(make ?? "")} />
        <Box code="D.3" label="Handelsbezeichnung" value={model.join(" ")} />
        <Box code="J" label="Fahrzeugklasse" value={str(data.art)} />
        <Box code="R" label="Farbe des Fahrzeugs" value={str(data.farbe)} />
        <Box className="col-span-2" code="—" label="Haftpflichtversicherung" value={str(data.versicherung)} />
      </div>

      <div className="absolute left-[760px] right-[36px] top-[120px] flex flex-col">
        <Box big code="C.1.1" label="Name oder Firmenname" value={up(h.lastName)} />
        <Box code="C.1.2" label="Vorname(n)" value={h.firstName} />
        <Box code="C.1.3" label="Anschrift" value={`${h.street}, ${h.postalCode} Nordverkehr-${h.district}`} />
        <Box code="C.4c" label="Halter/in ist nicht Eigentümer/in" value="nein" />
      </div>

      <div className="absolute bottom-[26px] left-[36px] text-[12px] leading-snug text-[#4b6046]">
        Ausgestellt von der Stadt Nordverkehr, {doc.authority.name}, {doc.authority.address}
        <br />
        Mitführpflicht bei jeder Fahrt. Änderungen sind unverzüglich anzuzeigen.
      </div>
      <div className="absolute bottom-[20px] right-[60px]">
        <Stamp authority={doc.authority.name} color="#2d4f9e" size={150} />
      </div>
    </div>
  );
}

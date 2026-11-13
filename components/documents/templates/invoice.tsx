import { A4_H, A4_W } from "./paper";
import { Qr, SealMark, Signature } from "./primitives";

import { formatEuro, formatLongDate } from "@/lib/format";
import { NORDPAY, STADTKASSE } from "@/lib/nordpay";

const MM = A4_W / 210;

/** Rechnungsdaten (serialisierbar, für Server und Browser). */
export type InvoiceData = {
  number: string;
  reference: string;
  issuedAt: string;
  dueAt: string;
  serviceTitle: string;
  tariff: string;
  department: { name: string; address: string; phone: string };
  holder: { firstName: string; lastName: string; gender: string; street: string; postalCode: string; citizenNumber: string };
  amountCents: number;
  paid: { at: string; method: "nordpay" | "kasse"; last4: string | null; transactionId: string | null; by: string | null } | null;
  cancelled: boolean;
  payUrl: string;
  qrSvg: string;
};

const time = (iso: string) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(iso));

/** Rechteckiger Kassenstempel. */
function KassenStamp({ title, lines, color }: { title: string; lines: string[]; color: string }) {
  return (
    <svg aria-hidden height={150} style={{ transform: "rotate(-11deg)", opacity: 0.82, mixBlendMode: "multiply" }} viewBox="0 0 300 150" width={300}>
      <defs>
        <filter id={`ink-${title}`}>
          <feTurbulence baseFrequency="0.85" numOctaves="2" result="noise" type="fractalNoise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
        </filter>
      </defs>
      <g fill="none" filter={`url(#ink-${title})`} stroke={color}>
        <rect height="138" rx="10" strokeWidth="5" width="288" x="6" y="6" />
        <rect height="122" rx="6" strokeWidth="1.6" width="272" x="14" y="14" />
        <text fill={color} fontFamily="Inter, Arial, sans-serif" fontSize="46" fontWeight="900" letterSpacing="7" stroke="none" textAnchor="middle" x="150" y="70">
          {title}
        </text>
        {lines.map((l, i) => (
          <text key={l} fill={color} fontFamily="Inter, Arial, sans-serif" fontSize="14" fontWeight="700" letterSpacing="1.5" stroke="none" textAnchor="middle" x="150" y={96 + i * 19}>
            {l}
          </text>
        ))}
      </g>
    </svg>
  );
}

export function Invoice({ inv }: { inv: InvoiceData }) {
  const h = inv.holder;
  const salutation = h.gender === "weiblich" ? `Sehr geehrte Frau ${h.lastName},` : h.gender === "männlich" ? `Sehr geehrter Herr ${h.lastName},` : `Guten Tag ${h.firstName} ${h.lastName},`;
  const payPath = inv.payUrl.replace(/^https?:\/\//, "");

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
          <div className="text-[14px] text-[#5c6470]">Stadtkasse · für das {inv.department.name}</div>
        </div>
      </div>
      <div className="absolute text-right text-[10.5px] leading-[1.5] text-[#5c6470]" style={{ right: 20 * MM, top: 15 * MM }}>
        Rathausmarkt 1 · Nordverkehr
        <br />
        Telefon {inv.department.phone} · Behördennummer 115
        <br />
        rathaus.nordverkehr.xyz
      </div>

      {/* Anschriftfeld */}
      <div className="absolute" style={{ left: 25 * MM, top: 45 * MM, width: 85 * MM }}>
        <div className="mb-2 border-b border-[#c9cdd2] pb-[2px] text-[8.5px] text-[#5c6470]">Stadt Nordverkehr · Stadtkasse · Rathausmarkt 1</div>
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
      <div className="absolute grid grid-cols-[auto_1fr] gap-x-4 gap-y-[3px] text-[10.5px]" style={{ left: 125 * MM, top: 48 * MM }}>
        {[
          ["Rechnungsnummer", inv.number],
          ["Rechnungsdatum", formatLongDate(inv.issuedAt)],
          ["Aktenzeichen", inv.reference],
          ["Bürgernummer", h.citizenNumber],
          ["Fachbereich", inv.department.name],
          ["Fällig am", formatLongDate(inv.dueAt)],
        ].map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-[#5c6470]">{k}</span>
            <span className={`font-medium ${k === "Rechnungsnummer" ? "font-mono" : ""}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="absolute" style={{ left: 25 * MM, right: 20 * MM, top: 98 * MM }}>
        <div className="flex items-baseline justify-between">
          <div className="text-[24px] font-bold tracking-tight">Gebührenrechnung</div>
          <div className="font-mono text-[12px] text-[#5c6470]">{inv.number}</div>
        </div>
        <div className="mt-1 text-[13px] text-[#3a3f47]">{inv.serviceTitle} · {inv.reference}</div>
        <p className="mt-5 text-[13px]">{salutation}</p>
        <p className="mt-3 text-[13px] leading-[1.6]">
          für die nachstehende Amtshandlung erheben wir nach der Gebührenordnung der Stadt Nordverkehr (GebO NV) folgende Verwaltungsgebühr:
        </p>

        <div className="mt-4 overflow-hidden rounded-[6px] border border-[#d9dde2] text-[12.5px]">
          <div className="grid grid-cols-[40px_1fr_90px_60px_110px] gap-2 bg-[#1d1a1f] px-3 py-[7px] text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
            <span>Pos.</span>
            <span>Leistung</span>
            <span>Tarif-Nr.</span>
            <span className="text-right">Menge</span>
            <span className="text-right">Betrag</span>
          </div>
          <div className="grid grid-cols-[40px_1fr_90px_60px_110px] gap-2 px-3 py-[9px]">
            <span>1</span>
            <span>
              <span className="font-medium">{inv.serviceTitle}</span>
              <span className="block text-[11px] text-[#5c6470]">Amtshandlung zu {inv.reference}, beantragt am {formatLongDate(inv.issuedAt)}</span>
            </span>
            <span className="font-mono text-[11.5px]">{inv.tariff}</span>
            <span className="text-right">1</span>
            <span className="text-right font-medium">{formatEuro(inv.amountCents)}</span>
          </div>
          <div className="border-t border-[#d9dde2] bg-[#f6f7f9] px-3 py-[7px]">
            <div className="ml-auto grid w-[300px] grid-cols-[1fr_auto] gap-y-[3px] text-[12px]">
              <span className="text-[#5c6470]">Summe Gebühren</span>
              <span className="text-right">{formatEuro(inv.amountCents)}</span>
              <span className="text-[#5c6470]">Auslagen</span>
              <span className="text-right">{formatEuro(0)}</span>
              <span className="text-[#5c6470]">Umsatzsteuer (hoheitlich, entfällt)</span>
              <span className="text-right">–</span>
              <span className="mt-1 border-t border-[#1d1a1f] pt-1 text-[14px] font-bold">Rechnungsbetrag</span>
              <span className="mt-1 border-t border-[#1d1a1f] pt-1 text-right text-[14px] font-bold">{formatEuro(inv.amountCents)}</span>
            </div>
          </div>
        </div>

        {inv.paid ? (
          <div className="mt-5 rounded-[6px] border border-[#9fd3b0] bg-[#eef8f1] px-4 py-3 text-[12.5px] leading-[1.6]">
            <div className="font-semibold text-[#17633a]">Zahlungseingang verbucht</div>
            {inv.paid.method === "nordpay" ? (
              <>
                {formatEuro(inv.amountCents)} erhalten am {formatLongDate(inv.paid.at)} um {time(inv.paid.at)} Uhr per {NORDPAY.name}-Karte ···· {inv.paid.last4}.
                <br />
                Transaktion <span className="font-mono">{inv.paid.transactionId}</span> · authentifiziert mit {NORDPAY.secure}
              </>
            ) : (
              <>
                {formatEuro(inv.amountCents)} bar an der Kasse erhalten am {formatLongDate(inv.paid.at)}
                {inv.paid.by ? `, quittiert von ${inv.paid.by}` : ""}.
              </>
            )}
            <br />
            Diese Rechnung ist damit vollständig beglichen.
          </div>
        ) : inv.cancelled ? (
          <p className="mt-5 text-[13px] leading-[1.6]">Der zugrunde liegende Antrag wurde abgelehnt oder zurückgezogen. Die Gebühr wird nicht erhoben, diese Rechnung ist gegenstandslos.</p>
        ) : (
          <>
            <p className="mt-5 text-[13px] leading-[1.6]">
              Bitte begleichen Sie den Betrag bis zum <b>{formatLongDate(inv.dueAt)}</b>. Am schnellsten geht es online im Bürgerkonto mit {NORDPAY.name}. Alternativ zahlen Sie bar bei
              Abholung im {inv.department.name}.
            </p>
            <div className="mt-4 grid grid-cols-[1fr_1fr] overflow-hidden rounded-[6px] border border-[#d9dde2]">
              <div className="flex gap-4 border-r border-[#d9dde2] p-4">
                <Qr size={86} svg={inv.qrSvg} />
                <div className="text-[11.5px] leading-[1.55]">
                  <div className="text-[12.5px] font-semibold">Online bezahlen</div>
                  QR-Code scannen oder aufrufen:
                  <div className="mt-1 break-all font-mono text-[10.5px]">{payPath}</div>
                  <div className="mt-1 text-[#5c6470]">mit {NORDPAY.name} und {NORDPAY.secure}</div>
                </div>
              </div>
              <div className="p-4 text-[11.5px] leading-[1.55]">
                <div className="text-[12.5px] font-semibold">Überweisung</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3">
                  <span className="text-[#5c6470]">Empfänger</span>
                  <span>{STADTKASSE.name}</span>
                  <span className="text-[#5c6470]">IBAN</span>
                  <span className="font-mono">{STADTKASSE.iban}</span>
                  <span className="text-[#5c6470]">BIC</span>
                  <span className="font-mono">{STADTKASSE.bic}</span>
                  <span className="text-[#5c6470]">Zweck</span>
                  <span className="font-mono">{inv.number}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <p className="mt-5 text-[13px]">Mit freundlichen Grüßen</p>
        <p className="text-[12px] text-[#5c6470]">Im Auftrag</p>
        <div className="mt-1">
          <Signature name="Stadtkasse" size={34} />
          <div className="w-[220px] border-t border-[#1d1a1f] pt-1 text-[11px] text-[#5c6470]">Stadtkasse Nordverkehr</div>
        </div>
      </div>

      {inv.paid ? (
        <div className="absolute" style={{ right: 18 * MM, top: 196 * MM }}>
          <KassenStamp color="#17803d" lines={[`${formatLongDate(inv.paid.at).toUpperCase()}`, "STADTKASSE NORDVERKEHR"]} title="BEZAHLT" />
        </div>
      ) : inv.cancelled ? (
        <div className="absolute" style={{ right: 18 * MM, top: 150 * MM }}>
          <KassenStamp color="#8a8f98" lines={["GEGENSTANDSLOS", "STADTKASSE NORDVERKEHR"]} title="STORNIERT" />
        </div>
      ) : null}

      <div className="absolute text-[9.5px] leading-[1.5] text-[#5c6470]" style={{ left: 25 * MM, right: 20 * MM, bottom: 18 * MM }}>
        <b>Hinweis:</b> Die Gebühr wird mit Bekanntgabe fällig. Gegen die Gebührenfestsetzung kann innerhalb eines Monats Widerspruch beim {inv.department.name} erhoben werden.
        Verwaltungsgebühren sind hoheitliche Leistungen und unterliegen nicht der Umsatzsteuer.
      </div>
      <div className="absolute border-t border-[#d9dde2] pt-2 text-[8.5px] text-[#9aa0a6]" style={{ left: 25 * MM, right: 20 * MM, bottom: 10 * MM }}>
        {STADTKASSE.name} · {STADTKASSE.bank} · IBAN {STADTKASSE.iban} · Fiktive Rechnung im Roleplay-Projekt Nordverkehr – keine echte Zahlungsaufforderung
      </div>
    </div>
  );
}

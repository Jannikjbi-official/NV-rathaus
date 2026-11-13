import { Seal } from "@/components/brand/seal";
import type { DocumentType } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";

export type DocumentCardData = {
  number: string;
  type: DocumentType;
  title: string;
  holder: { firstName: string; lastName: string; birthDate: string; birthPlace: string };
  department: string;
  issuedAt: Date;
  validUntil: string | null;
  details: Record<string, string>;
  state: { label: string; tone: "success" | "warning" | "danger" };
};

const ID_LIKE: DocumentType[] = ["personalausweis", "reisepass", "fuehrerschein", "waffenschein", "waffenbesitzkarte", "jagdschein", "fischereischein"];

/** Dokument im Stil einer amtlichen Karte (Ausweisformat) bzw. Urkunde. */
export function DocumentCard({ doc, size = "md" }: { doc: DocumentCardData; size?: "sm" | "md" }) {
  const isCard = ID_LIKE.includes(doc.type);
  const small = size === "sm";
  const extra = Object.entries(doc.details).slice(0, small ? 1 : 4);
  const invalid = doc.state.tone !== "success";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-black/5 text-[#1d1a1f] shadow-overlay ${
        isCard ? "aspect-[1.586]" : "aspect-[1.414]"
      } ${small ? "p-4" : "p-5 sm:p-6"}`}
      style={{
        background: isCard
          ? "linear-gradient(135deg,#fdf7f4 0%,#f4e1dd 48%,#eceff4 100%)"
          : "linear-gradient(160deg,#fffdf8 0%,#f6efe3 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: "repeating-linear-gradient(115deg,transparent 0 9px,rgba(196,30,30,.04) 9px 10px)" }}
      />
      <Seal className="pointer-events-none absolute -bottom-8 -right-8 size-44 text-[#c41e1e] opacity-10" title="" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Seal className={`${small ? "size-6" : "size-8"} text-[#c41e1e]`} title="" />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c41e1e]">Nordverkehr</p>
              <p className={`${small ? "text-xs" : "text-sm"} font-semibold`}>{DOCUMENT_TYPES[doc.type].label}</p>
            </div>
          </div>
          <p className="font-mono text-[11px] tracking-wider">{doc.number}</p>
        </div>

        <div className={`mt-auto grid gap-x-4 gap-y-1.5 ${small ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
          <Field big label="Name" value={`${doc.holder.lastName.toUpperCase()}, ${doc.holder.firstName}`} wide={!small} />
          <Field label="Geburtsdatum" value={formatDate(doc.holder.birthDate)} />
          {!small ? <Field label="Geburtsort" value={doc.holder.birthPlace} /> : null}
          {!isCard && !small ? <Field label="Inhalt" value={doc.title} wide /> : null}
          {extra.map(([k, v]) => (
            <Field key={k} label={k} value={v} />
          ))}
          <Field label="Ausgestellt" value={formatDate(doc.issuedAt)} />
          <Field label="Gültig bis" value={doc.validUntil ? formatDate(doc.validUntil) : "unbefristet"} />
        </div>
      </div>

      {invalid ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <span className="-rotate-12 rounded-lg border-2 border-[#c41e1e] px-4 py-1 text-lg font-bold uppercase tracking-widest text-[#c41e1e]">
            {doc.state.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, big, wide }: { label: string; value: string; big?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7b6f72]">{label}</p>
      <p className={`${big ? "text-base font-semibold" : "text-xs font-medium"} truncate`}>{value}</p>
    </div>
  );
}

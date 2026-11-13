import {
  ArrowRotateLeft,
  CircleCheckFill,
  CircleInfo,
  CircleXmark,
  Comment,
  FileText,
  PaperPlane,
  Person,
  Receipt,
} from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import type { ApplicationEvent, ApplicationStatus } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { DISPLAY_ONLY, type FormField } from "@/lib/forms/types";
import { displayValue } from "@/lib/forms/validate";
import { STATUS } from "@/lib/status";

export function StatusChip({ status, size = "sm" }: { status: ApplicationStatus; size?: "sm" | "md" | "lg" }) {
  const s = STATUS[status];

  return (
    <Chip color={s.color} size={size} variant="soft">
      {s.label}
    </Chip>
  );
}

const STEPS = ["Eingereicht", "In Prüfung", "Entscheidung"];

export function StatusSteps({ status }: { status: ApplicationStatus }) {
  const step = STATUS[status].step;
  const done = step >= 4;
  const failed = status === "abgelehnt" || status === "zurueckgezogen";

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Bearbeitungsstand">
      {STEPS.map((label, i) => {
        const index = i + 1;
        const reached = done || step >= index;
        const current = !done && step === index;
        const last = index === 3;

        return (
          <li key={label} className="flex flex-col gap-2">
            <span
              className={`h-1.5 rounded-full ${
                reached ? (last && failed ? "bg-danger" : last && done ? "bg-success" : "bg-accent") : "bg-default"
              }`}
            />
            <span className={`text-xs ${current || (last && done) ? "font-semibold text-foreground" : "text-muted"}`}>
              {last && done ? STATUS[status].label : label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ApplicationData({ fields, data }: { fields: FormField[]; data: Record<string, unknown> }) {
  const visible = fields.filter((f) => !DISPLAY_ONLY.includes(f.type) && f.id !== "wahrheit");

  if (visible.length === 0) return <p className="text-sm text-muted">Keine weiteren Angaben.</p>;

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {visible.map((f) => (
        <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
          <dt className="text-xs text-muted">{f.label}</dt>
          <dd className="m-0 whitespace-pre-line text-sm font-medium">{displayValue(f, data[f.id])}</dd>
        </div>
      ))}
    </dl>
  );
}

type TimelineEvent = Pick<ApplicationEvent, "id" | "type" | "message" | "toStatus" | "isInternal" | "createdAt"> & {
  authorName?: string | null;
  byCitizen?: boolean;
};

function eventInfo(e: TimelineEvent) {
  switch (e.type) {
    case "eingereicht":
      return { icon: PaperPlane, title: "Antrag eingereicht" };
    case "antwort":
      return { icon: Person, title: "Antwort des Antragstellers" };
    case "nachricht":
      return { icon: Comment, title: e.isInternal ? "Interne Notiz" : "Nachricht vom Amt" };
    case "gebuehr":
      return { icon: Receipt, title: "Gebühr bezahlt" };
    case "dokument":
      return { icon: FileText, title: "Dokument ausgestellt" };
    case "zuweisung":
      return { icon: Person, title: "Sachbearbeitung zugewiesen" };
    case "status": {
      const to = e.toStatus;

      if (to === "genehmigt") return { icon: CircleCheckFill, title: "Antrag genehmigt" };
      if (to === "abgelehnt") return { icon: CircleXmark, title: "Antrag abgelehnt" };
      if (to === "zurueckgezogen") return { icon: ArrowRotateLeft, title: "Antrag zurückgezogen" };
      if (to === "rueckfrage") return { icon: CircleInfo, title: "Rückfrage vom Amt" };

      return { icon: CircleInfo, title: `Status: ${to ? STATUS[to].label : "geändert"}` };
    }
  }
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const { icon: Icon, title } = eventInfo(e);

        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < events.length - 1 ? <span aria-hidden className="absolute left-4 top-9 bottom-0 w-px bg-separator" /> : null}
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                e.isInternal ? "bg-warning-soft text-warning-soft-foreground" : e.byCitizen ? "bg-default" : "bg-accent-soft text-accent"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium">{title}</p>
                <time className="text-xs text-muted">{formatDateTime(e.createdAt)}</time>
                {e.authorName ? <span className="text-xs text-muted">· {e.authorName}</span> : null}
              </div>
              {e.message ? (
                <Card className="mt-2 p-3" variant={e.isInternal ? "tertiary" : "secondary"}>
                  <p className="whitespace-pre-line text-sm">{e.message}</p>
                </Card>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

import NextLink from "next/link";
import { ChevronRight, CircleCheckFill, CircleExclamationFill, Clock } from "@gravity-ui/icons";
import { Card, Chip, Separator } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { referenceSlug } from "@/lib/applications";
import type { QueueItem } from "@/lib/admin-stats";
import { formatRelative, formatTime } from "@/lib/format";
import { STATUS } from "@/lib/status";

export function KpiTile({
  label,
  value,
  hint,
  href,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "danger" | "success" | "warning";
  icon?: React.ReactNode;
}) {
  const body = (
    <Card className="h-full gap-1 transition-shadow group-hover:shadow-overlay">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        {icon ? <span className={`[&>svg]:size-4 ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-muted"}`}>{icon}</span> : null}
      </div>
      <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </Card>
  );

  return href ? (
    <NextLink className="group rounded-3xl" href={href}>
      {body}
    </NextLink>
  ) : (
    body
  );
}

export function QueueList({ items, empty = "Nichts zu tun." }: { items: QueueItem[]; empty?: string }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted">
        <CircleCheckFill className="size-4 text-success" />
        {empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((q, i) => (
        <div key={q.reference}>
          {i > 0 ? <Separator /> : null}
          <NextLink className="flex items-center gap-3 py-3" href={`/verwaltung/antraege/${referenceSlug(q.reference)}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{q.service}</p>
              <p className="truncate text-xs text-muted">
                {q.citizen} · {q.reference} · eingegangen {formatRelative(q.submittedAt)}
                {q.assignee ? ` · ${q.assignee}` : ""}
              </p>
            </div>
            {q.overdue ? (
              <Chip color="danger" size="sm" variant="soft">
                <CircleExclamationFill width={10} />
                <Chip.Label>überfällig</Chip.Label>
              </Chip>
            ) : null}
            <StatusChip status={q.status} />
            <ChevronRight className="size-4 shrink-0 text-muted" />
          </NextLink>
        </div>
      ))}
    </div>
  );
}

export function AppointmentList({
  items,
}: {
  items: { id: string; startsAt: Date; purpose: string; status: string; department: string; firstName: string; lastName: string; citizenNumber: string }[];
}) {
  if (items.length === 0) return <p className="py-4 text-sm text-muted">Heute keine Termine.</p>;

  return (
    <div className="flex flex-col">
      {items.map((a, i) => (
        <div key={a.id}>
          {i > 0 ? <Separator /> : null}
          <NextLink className="flex items-center gap-3 py-2.5" href={`/verwaltung/buerger/${a.citizenNumber}`}>
            <span className="w-12 text-sm font-semibold tabular-nums">{formatTime(a.startsAt)}</span>
            <span className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.firstName} {a.lastName}</p>
              <p className="truncate text-xs text-muted">{a.purpose} · {a.department}</p>
            </span>
            {a.status === "erschienen" ? <Chip color="success" size="sm" variant="soft">erschienen</Chip> : <Clock className="size-4 text-muted" />}
          </NextLink>
        </div>
      ))}
    </div>
  );
}

const EVENT_LABEL: Record<string, string> = {
  eingereicht: "neuer Antrag",
  antwort: "Antwort des Bürgers",
  nachricht: "Nachricht",
  gebuehr: "Gebühr bezahlt",
  dokument: "Dokument ausgestellt",
  zuweisung: "zugewiesen",
};

export function ActivityFeed({
  items,
}: {
  items: { type: string; toStatus: string | null; createdAt: Date; author: string | null; reference: string; service: string }[];
}) {
  if (items.length === 0) return <p className="py-4 text-sm text-muted">Noch keine Aktivität.</p>;

  return (
    <ol className="flex flex-col gap-3">
      {items.map((e, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
          <div className="min-w-0">
            <NextLink className="font-medium hover:underline" href={`/verwaltung/antraege/${referenceSlug(e.reference)}`}>
              {e.service}
            </NextLink>
            <p className="text-xs text-muted">
              {e.type === "status" && e.toStatus ? `Status: ${STATUS[e.toStatus as keyof typeof STATUS]?.label ?? e.toStatus}` : EVENT_LABEL[e.type] ?? e.type}
              {e.author ? ` · ${e.author}` : ""} · {formatRelative(e.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

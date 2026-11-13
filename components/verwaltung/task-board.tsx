"use client";

import { useState } from "react";
import NextLink from "next/link";
import { ChevronRight, CircleCheckFill, CircleExclamationFill, Comment, FileText, Receipt } from "@gravity-ui/icons";
import { Card, Separator, Tabs } from "@heroui/react";

import type { TaskItem } from "@/lib/admin-stats";
import { formatRelative } from "@/lib/format";

const KINDS = {
  ueberfaellig: { label: "Überfällig", hint: "fällig seit", icon: CircleExclamationFill, cls: "text-danger" },
  antwort: { label: "Antwort eingegangen", hint: "geantwortet", icon: Comment, cls: "text-accent" },
  dokument: { label: "Dokument ausstellen", hint: "genehmigt", icon: FileText, cls: "text-success" },
  gebuehr: { label: "Gebühr offen", hint: "genehmigt", icon: Receipt, cls: "text-warning" },
} as const;

type Kind = keyof typeof KINDS;

export function TaskBoard({ tasks }: { tasks: TaskItem[] }) {
  const [filter, setFilter] = useState<"alle" | Kind>("alle");
  const count = (k: Kind) => tasks.filter((t) => t.kind === k).length;
  const visible = (filter === "alle" ? tasks : tasks.filter((t) => t.kind === filter)).slice(0, 12);

  return (
    <Card>
      <Card.Header className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Card.Title className="text-base">Handlungsbedarf</Card.Title>
          <Card.Description>{tasks.length ? `${tasks.length} Vorgänge brauchen Aufmerksamkeit` : "Nichts liegt an."}</Card.Description>
        </div>
        {tasks.length ? (
          <Tabs selectedKey={filter} onSelectionChange={(k) => setFilter(k as typeof filter)}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Art des Handlungsbedarfs">
                <Tabs.Tab className="whitespace-nowrap" id="alle">Alle {tasks.length}<Tabs.Indicator /></Tabs.Tab>
                {(Object.keys(KINDS) as Kind[]).filter((k) => count(k)).map((k) => (
                  <Tabs.Tab key={k} className="whitespace-nowrap" id={k}>
                    {KINDS[k].label} {count(k)}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        ) : null}
      </Card.Header>
      <Card.Content className="gap-0">
        {tasks.length === 0 ? (
          <p className="flex items-center gap-2 py-3 text-sm text-muted">
            <CircleCheckFill className="size-4 text-success" />
            Alles erledigt. Gute Arbeit.
          </p>
        ) : null}
        {visible.map((t, i) => {
          const k = KINDS[t.kind];
          const Icon = k.icon;

          return (
            <div key={`${t.kind}-${t.reference}`}>
              {i > 0 ? <Separator /> : null}
              <NextLink className="flex items-center gap-3 py-3" href={`/verwaltung/antraege/${t.reference.replace(/^AZ\s*/, "")}`}>
                <Icon className={`size-4 shrink-0 ${k.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.service}</p>
                  <p className="truncate text-xs text-muted">
                    {k.label} · {t.citizen} · {t.reference} · {k.hint} {formatRelative(t.since)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </NextLink>
            </div>
          );
        })}
      </Card.Content>
    </Card>
  );
}

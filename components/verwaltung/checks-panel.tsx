import NextLink from "next/link";
import { CircleCheckFill, CircleInfoFill, CircleXmarkFill, TriangleExclamationFill } from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import type { Check, NextStep } from "@/lib/application-checks";

const ICON = {
  ok: <CircleCheckFill className="size-4 text-success" />,
  warning: <TriangleExclamationFill className="size-4 text-warning" />,
  danger: <CircleXmarkFill className="size-4 text-danger" />,
  info: <CircleInfoFill className="size-4 text-muted" />,
};

export function ChecksPanel({ checks }: { checks: Check[] }) {
  if (checks.length === 0) return null;
  const problems = checks.filter((c) => c.tone === "danger").length;
  const warnings = checks.filter((c) => c.tone === "warning").length;
  const sorted = [...checks].sort((a, b) => ["danger", "warning", "info", "ok"].indexOf(a.tone) - ["danger", "warning", "info", "ok"].indexOf(b.tone));

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between gap-3">
        <div>
          <Card.Title className="text-base">Prüfhilfe</Card.Title>
          <Card.Description>Automatisch geprüft. Die Entscheidung liegt bei Ihnen.</Card.Description>
        </div>
        {problems ? (
          <Chip color="danger" size="sm" variant="soft">{problems} {problems === 1 ? "Problem" : "Probleme"}</Chip>
        ) : warnings ? (
          <Chip color="warning" size="sm" variant="soft">{warnings} {warnings === 1 ? "Hinweis" : "Hinweise"}</Chip>
        ) : (
          <Chip color="success" size="sm" variant="soft">alles in Ordnung</Chip>
        )}
      </Card.Header>
      <Card.Content className="gap-2.5">
        {sorted.map((c, i) => {
          const body = (
            <div className="flex gap-2.5">
              <span className="mt-0.5 shrink-0">{ICON[c.tone]}</span>
              <span className="min-w-0">
                <span className={`block text-sm ${c.tone === "ok" ? "" : "font-medium"}`}>{c.title}</span>
                {c.detail ? <span className="block text-xs text-muted">{c.detail}</span> : null}
              </span>
            </div>
          );

          return c.href ? (
            <NextLink key={i} className="rounded-lg hover:bg-default/60" href={c.href}>{body}</NextLink>
          ) : (
            <div key={i}>{body}</div>
          );
        })}
      </Card.Content>
    </Card>
  );
}

export function NextStepBanner({ step }: { step: NextStep }) {
  if (!step) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">→</span>
      <div>
        <p className="text-sm font-semibold text-accent-soft-foreground">Nächster Schritt: {step.title}</p>
        <p className="text-xs text-accent-soft-foreground/80">{step.detail}</p>
      </div>
    </div>
  );
}

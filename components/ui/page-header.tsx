"use client";

import { Breadcrumbs } from "@heroui/react";

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  crumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      {crumbs.length > 0 ? (
        <Breadcrumbs>
          <Breadcrumbs.Item href="/">Startseite</Breadcrumbs.Item>
          {crumbs.map((c) => (
            <Breadcrumbs.Item key={c.label} href={c.href}>
              {c.label}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          {description ? <p className="text-base text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

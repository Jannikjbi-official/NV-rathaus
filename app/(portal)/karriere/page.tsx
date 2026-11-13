import type { Metadata } from "next";
import NextLink from "next/link";
import { Briefcase, ChevronRight, Clock } from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { formatLongDate } from "@/lib/format";
import { getOpenJobs } from "@/lib/queries";

export const metadata: Metadata = { title: "Karriere" };

export default async function JobsPage() {
  const jobs = await getOpenJobs();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Karriere" }]}
        description="Arbeiten für Nordverkehr: bei der Stadtverwaltung, der Polizei, der Feuerwehr oder dem Rettungsdienst."
        title="Stellenangebote"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {jobs.map((j) => (
          <NextLink key={j.id} className="group rounded-3xl" href={`/karriere/${j.slug}`}>
            <Card className="h-full transition-shadow group-hover:shadow-overlay">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Briefcase className="size-5" />
                </span>
                <Chip color={j.deadline ? "warning" : "success"} size="sm" variant="soft">
                  <Clock width={10} />
                  <Chip.Label>{j.deadline ? `bis ${formatLongDate(j.deadline)}` : "laufende Bewerbung"}</Chip.Label>
                </Chip>
              </div>
              <Card.Header className="gap-1">
                <Card.Description>{j.organization} · {j.employment}</Card.Description>
                <Card.Title className="text-base">{j.title}</Card.Title>
              </Card.Header>
              <Card.Content className="text-sm text-muted">{j.summary}</Card.Content>
              <Card.Footer className="justify-end">
                <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
              </Card.Footer>
            </Card>
          </NextLink>
        ))}
        {jobs.length === 0 ? <p className="text-muted">Derzeit sind keine Stellen ausgeschrieben.</p> : null}
      </div>
    </>
  );
}

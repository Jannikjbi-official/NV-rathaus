import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Briefcase, Person } from "@gravity-ui/icons";
import { Card, Link } from "@heroui/react";

import { ApplicationForm } from "@/components/konto/application-form";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, jobs, services } from "@/db/schema";
import { formatEuro, formatLongDate } from "@/lib/format";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Antrag stellen" };

export default async function NewApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ stelle?: string }>;
}) {
  const [{ slug }, { stelle }] = await Promise.all([params, searchParams]);
  const viewer = await requireResident(`/konto/antraege/neu/${slug}${stelle ? `?stelle=${stelle}` : ""}`);
  const [row] = await db
    .select({ service: services, department: departments.name })
    .from(services)
    .innerJoin(departments, eq(services.departmentId, departments.id))
    .where(and(eq(services.slug, slug), eq(services.isActive, true)))
    .limit(1);

  if (!row) notFound();

  let job: typeof jobs.$inferSelect | undefined;

  if (slug === "bewerbung") {
    if (!stelle) redirect("/karriere");
    [job] = await db.select().from(jobs).where(and(eq(jobs.slug, stelle), eq(jobs.isOpen, true))).limit(1);
    if (!job) redirect("/karriere");
  }

  const c = viewer.citizen;
  const s = row.service;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Bürgerkonto", href: "/konto" }, { label: s.title, href: `/leistungen/${s.slug}` }, { label: "Antrag" }]}
        description={`${row.department} · Bearbeitung ca. ${s.processingDays} ${s.processingDays === 1 ? "Tag" : "Tage"}`}
        title={job ? `Bewerbung: ${job.title}` : s.title}
      />
      <div className="flex flex-col gap-6">
        <Card variant="secondary">
          <Card.Header className="flex-row items-center gap-2">
            <Person className="size-4 text-muted" />
            <Card.Title className="text-base">Antragsteller/in</Card.Title>
          </Card.Header>
          <Card.Content className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Info label="Name" value={`${c.firstName} ${c.lastName}`} />
            <Info label="Geburtsdatum" value={formatLongDate(c.birthDate)} />
            <Info label="Bürgernummer" value={c.citizenNumber} />
            <Info label="Anschrift" value={`${c.street}, ${c.postalCode} ${c.district}`} />
            <Info label="Telefon" value={c.phone ?? "–"} />
          </Card.Content>
          <Card.Footer>
            <Link className="text-xs" href="/konto/meldedaten">Meldedaten ansehen</Link>
          </Card.Footer>
        </Card>
        {job ? (
          <Card variant="secondary">
            <Card.Header className="flex-row items-center gap-2">
              <Briefcase className="size-4 text-muted" />
              <Card.Title className="text-base">{job.title}</Card.Title>
            </Card.Header>
            <Card.Content className="text-sm text-muted">{job.organization} · {job.employment}</Card.Content>
          </Card>
        ) : null}
        <ApplicationForm feeLabel={formatEuro(s.feeCents)} fields={s.fields} hidden={job ? { stelle: job.slug } : undefined} slug={s.slug} />
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

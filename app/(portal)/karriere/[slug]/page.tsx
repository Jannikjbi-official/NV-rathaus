import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, Check } from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { formatLongDate } from "@/lib/format";

async function load(slug: string) {
  const [j] = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);

  return j;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const j = await load((await params).slug);

  return j ? { title: j.title, description: j.summary } : {};
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const j = await load((await params).slug);

  if (!j) notFound();

  return (
    <>
      <PageHeader crumbs={[{ label: "Karriere", href: "/karriere" }, { label: j.title }]} description={j.summary} title={j.title} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <Card.Content className="gap-5 text-[15px] leading-relaxed">
            <p>{j.description}</p>
            <List items={j.tasks} title="Ihre Aufgaben" />
            <List items={j.requirements} title="Das bringen Sie mit" />
          </Card.Content>
        </Card>
        <Card className="lg:sticky lg:top-36">
          <Card.Content className="gap-3 text-sm">
            <Row label="Arbeitgeber" value={j.organization} />
            <Row label="Umfang" value={j.employment} />
            <Row label="Bewerbungsschluss" value={j.deadline ? formatLongDate(j.deadline) : "laufend"} />
            {!j.isOpen ? <Chip color="danger" size="sm" variant="soft">Bewerbung geschlossen</Chip> : null}
          </Card.Content>
          {j.isOpen ? (
            <Card.Footer>
              <ButtonLink fullWidth href={`/konto/antraege/neu/bewerbung?stelle=${j.slug}`} size="lg">
                Jetzt bewerben
                <ArrowRight />
              </ButtonLink>
            </Card.Footer>
          ) : null}
        </Card>
      </div>
    </>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-success" />{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

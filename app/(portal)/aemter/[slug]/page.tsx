import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { ChevronRight, Envelope, Handset, MapPin } from "@gravity-ui/icons";
import { Card, Chip, Separator, Table } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, services } from "@/db/schema";
import { formatEuro, openingStatus, WEEKDAYS } from "@/lib/format";

async function load(slug: string) {
  const [d] = await db.select().from(departments).where(eq(departments.slug, slug)).limit(1);

  return d;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug);

  return d ? { title: d.name, description: d.summary } : {};
}

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug);

  if (!d) notFound();
  const list = await db
    .select({ slug: services.slug, title: services.title, summary: services.summary, feeCents: services.feeCents })
    .from(services)
    .where(and(eq(services.departmentId, d.id), eq(services.isActive, true)))
    .orderBy(asc(services.sortOrder));
  const status = openingStatus(d.openingHours);
  const week = [1, 2, 3, 4, 5, 6, 0].map((day) => ({ day, slot: d.openingHours.days.find((x) => x.day === day) }));

  return (
    <>
      <PageHeader crumbs={[{ label: "Ämter & Kontakt", href: "/aemter" }, { label: d.name }]} description={d.description} title={d.name} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Leistungen ({list.length})</h2>
          {list.map((s) => (
            <NextLink key={s.slug} className="group rounded-3xl" href={`/leistungen/${s.slug}`}>
              <Card className="flex-row items-center gap-4 transition-shadow group-hover:shadow-overlay">
                <div className="min-w-0 flex-1">
                  <Card.Title>{s.title}</Card.Title>
                  <Card.Description>{s.summary}</Card.Description>
                </div>
                <Chip size="sm" variant="soft">{formatEuro(s.feeCents)}</Chip>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Card>
            </NextLink>
          ))}
        </section>
        <aside className="flex flex-col gap-4">
          <Card>
            <Card.Header className="flex-row items-center justify-between">
              <Card.Title>Kontakt</Card.Title>
              <Chip color={status.tone} size="sm" variant="soft">{status.label}</Chip>
            </Card.Header>
            <Card.Content className="gap-2 text-sm">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-muted" />{d.address}</span>
              <span className="flex items-center gap-2"><Handset className="size-4 text-muted" />{d.phone}</span>
              {d.email ? <span className="flex items-center gap-2"><Envelope className="size-4 text-muted" />{d.email}</span> : null}
            </Card.Content>
            <Separator />
            <Table variant="secondary">
              <Table.ScrollContainer>
                <Table.Content aria-label="Öffnungszeiten">
                  <Table.Header>
                    <Table.Column isRowHeader>Tag</Table.Column>
                    <Table.Column>Öffnungszeit</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {week.map(({ day, slot }) => (
                      <Table.Row key={day} id={String(day)}>
                        <Table.Cell>{WEEKDAYS[day]}</Table.Cell>
                        <Table.Cell>
                          <span className={slot ? "tabular-nums" : "text-muted"}>{slot ? `${slot.open}–${slot.close} Uhr` : "geschlossen"}</span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
            {d.openingHours.note ? <p className="text-xs text-muted">{d.openingHours.note}</p> : null}
          </Card>
        </aside>
      </div>
    </>
  );
}

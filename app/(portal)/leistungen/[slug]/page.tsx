import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  FileText,
  Handset,
  MapPin,
  Receipt,
  SealCheck,
} from "@gravity-ui/icons";
import { Accordion, Card, Chip, Link, Separator } from "@heroui/react";
import NextLink from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, services } from "@/db/schema";
import { DISPLAY_ONLY, FIELD_TYPE_LABELS } from "@/lib/forms/types";
import { formatEuro } from "@/lib/format";
import { DOCUMENT_TYPES, LIFE_EVENTS } from "@/lib/status";

async function load(slug: string) {
  const [row] = await db
    .select({ service: services, department: departments })
    .from(services)
    .innerJoin(departments, eq(services.departmentId, departments.id))
    .where(and(eq(services.slug, slug), eq(services.isActive, true)))
    .limit(1);

  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const row = await load((await params).slug);

  return row ? { title: row.service.title, description: row.service.summary } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const row = await load((await params).slug);

  if (!row) notFound();
  const { service: s, department: d } = row;
  const related = await db
    .select({ slug: services.slug, title: services.title })
    .from(services)
    .where(and(eq(services.departmentId, d.id), ne(services.id, s.id), eq(services.isActive, true)))
    .limit(5);
  const inputFields = s.fields.filter((f) => !DISPLAY_ONLY.includes(f.type));
  const applyHref = s.slug === "bewerbung" ? "/karriere" : `/konto/antraege/neu/${s.slug}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Leistungen A–Z", href: "/leistungen" }, { label: s.title }]}
        description={s.summary}
        title={s.title}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <Card.Content className="gap-4 text-[15px] leading-relaxed">
              <p>{s.description}</p>
              {s.requirements.length > 0 ? (
                <div>
                  <h2 className="mb-2 text-base font-semibold">Voraussetzungen</h2>
                  <ul className="flex flex-col gap-1.5">
                    {s.requirements.map((r) => (
                      <li key={r} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-success" />{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {s.documentsNeeded.length > 0 ? (
                <div>
                  <h2 className="mb-2 text-base font-semibold">Benötigte Unterlagen</h2>
                  <ul className="flex flex-col gap-1.5">
                    {s.documentsNeeded.map((r) => (
                      <li key={r} className="flex gap-2"><FileText className="mt-1 size-4 shrink-0 text-muted" />{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card.Content>
          </Card>

          {inputFields.length > 0 ? (
            <Accordion variant="surface">
              <Accordion.Item id="felder">
                <Accordion.Heading>
                  <Accordion.Trigger>
                    Welche Angaben im Antrag abgefragt werden ({inputFields.length})
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <ul className="flex flex-col gap-2 text-sm">
                      {inputFields.map((f) => (
                        <li key={f.id} className="flex items-center justify-between gap-3">
                          <span>{f.label}{f.required ? "" : " (optional)"}</span>
                          <Chip size="sm" variant="soft">{FIELD_TYPE_LABELS[f.type]}</Chip>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted">Name, Geburtsdatum und Anschrift werden aus Ihren Meldedaten übernommen.</p>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-36">
          <Card>
            <Card.Content className="gap-3 text-sm">
              <Fact icon={<Receipt />} label="Gebühr" value={formatEuro(s.feeCents)} note={s.feeNote} />
              <Fact icon={<Clock />} label="Bearbeitungszeit" value={`ca. ${s.processingDays} ${s.processingDays === 1 ? "Tag" : "Tage"}`} />
              {s.issuesDocument ? (
                <Fact
                  icon={<SealCheck />}
                  label="Sie erhalten"
                  value={DOCUMENT_TYPES[s.issuesDocument].label}
                  note={s.documentValidityYears ? `gültig ${s.documentValidityYears} Jahre` : undefined}
                />
              ) : null}
              {s.needsAppointment ? <Fact icon={<Calendar />} label="Termin" value="Persönliche Abholung im Amt" /> : null}
            </Card.Content>
            <Card.Footer className="flex-col items-stretch gap-2">
              <ButtonLink fullWidth href={applyHref} size="lg">
                {s.slug === "bewerbung" ? "Zu den Stellen" : "Online beantragen"}
                <ArrowRight />
              </ButtonLink>
              <span className="text-center text-xs text-muted">Anmeldung mit Discord erforderlich</span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Header>
              <Card.Description>Zuständig</Card.Description>
              <Card.Title>
                <NextLink className="hover:underline" href={`/aemter/${d.slug}`}>{d.name}</NextLink>
              </Card.Title>
            </Card.Header>
            <Card.Content className="gap-2 text-sm text-muted">
              <span className="flex items-center gap-2"><MapPin className="size-4" />{d.address}</span>
              <span className="flex items-center gap-2"><Handset className="size-4" />{d.phone}</span>
            </Card.Content>
            {related.length > 0 ? (
              <>
                <Separator />
                <Card.Content className="gap-1.5">
                  <p className="text-xs font-medium text-muted">Weitere Leistungen des Amts</p>
                  {related.map((r) => (
                    <Link key={r.slug} className="text-sm" href={`/leistungen/${r.slug}`}>{r.title}</Link>
                  ))}
                </Card.Content>
              </>
            ) : null}
          </Card>
          <Chip className="self-start" size="sm" variant="soft">Lebenslage: {LIFE_EVENTS[s.lifeEvent]?.label ?? s.lifeEvent}</Chip>
        </aside>
      </div>
    </>
  );
}

function Fact({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent [&>svg]:size-4">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium">{value}</p>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
    </div>
  );
}

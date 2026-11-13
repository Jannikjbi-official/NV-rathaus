import { redirect } from "next/navigation";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Card, Chip, Table } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { applications, citizens, departments, documents, services } from "@/db/schema";
import { referenceSlug } from "@/lib/applications";
import { documentState } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { requireStaff } from "@/lib/viewer";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [viewer, { q: raw = "" }] = await Promise.all([requireStaff("/verwaltung/suche"), searchParams]);
  const q = raw.trim();
  const upper = q.toUpperCase();

  // Eindeutige Kennungen: direkt öffnen
  if (/^NV-[A-Z]{2}-[A-Z0-9]{6}$/.test(upper)) {
    const [d] = await db.select({ n: documents.number }).from(documents).where(eq(documents.number, upper)).limit(1);

    if (d) redirect(`/verwaltung/dokumente/${d.n}`);
  }
  if (/^NV-\d{4}-\d{4}$/.test(upper)) {
    const [c] = await db.select({ n: citizens.citizenNumber }).from(citizens).where(eq(citizens.citizenNumber, upper)).limit(1);

    if (c) redirect(`/verwaltung/buerger/${c.n}`);
  }
  const az = upper.replace(/^AZ\s*/, "");

  if (/^\d{4}-\d{6}$/.test(az)) {
    const [a] = await db.select({ r: applications.reference }).from(applications).where(eq(applications.reference, `AZ ${az}`)).limit(1);

    if (a) redirect(`/verwaltung/antraege/${referenceSlug(a.r)}`);
  }

  const t = `%${q}%`;
  const ids = viewer.staffDepartments.map((d) => d.id);
  const [people, docs, apps] = q.length < 2
    ? [[], [], []]
    : await Promise.all([
        db
          .select()
          .from(citizens)
          .where(or(ilike(citizens.firstName, t), ilike(citizens.lastName, t), ilike(citizens.citizenNumber, t), ilike(citizens.street, t), sql`(${citizens.firstName} || ' ' || ${citizens.lastName}) ilike ${t}`))
          .limit(20),
        db
          .select({ d: documents, c: citizens, dept: departments.name })
          .from(documents)
          .innerJoin(citizens, eq(documents.citizenId, citizens.id))
          .innerJoin(departments, eq(documents.departmentId, departments.id))
          .where(or(ilike(documents.number, t), ilike(documents.title, t), sql`${documents.details}::text ilike ${t}`))
          .orderBy(desc(documents.issuedAt))
          .limit(20),
        db
          .select({ a: applications, title: services.title, c: citizens })
          .from(applications)
          .innerJoin(services, eq(applications.serviceId, services.id))
          .innerJoin(citizens, eq(applications.citizenId, citizens.id))
          .where(
            and(
              inArray(applications.departmentId, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
              or(ilike(applications.reference, t), ilike(services.title, t), sql`${applications.data}::text ilike ${t}`, sql`(${citizens.firstName} || ' ' || ${citizens.lastName}) ilike ${t}`),
            ),
          )
          .orderBy(desc(applications.updatedAt))
          .limit(20),
      ]);
  const total = people.length + docs.length + apps.length;

  return (
    <>
      <PageHeader
        description={q ? `${total} Treffer für „${q}“` : "Suchen Sie nach Namen, Bürgernummern, Kennzeichen, Dokumentnummern oder Aktenzeichen."}
        root={{ label: "Verwaltung", href: "/verwaltung" }}
        crumbs={[{ label: "Suche" }]}
        title="Suche"
      />
      {q && total === 0 ? (
        <Card className="py-10 text-center"><Card.Description>Nichts gefunden. Prüfen Sie die Schreibweise.</Card.Description></Card>
      ) : null}
      <div className="flex flex-col gap-6">
        {people.length ? (
          <Section title={`Bürgerinnen und Bürger (${people.length})`}>
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Bürger" className="min-w-[600px]">
                  <Table.Header>
                    <Table.Column isRowHeader>Name</Table.Column>
                    <Table.Column>Bürgernummer</Table.Column>
                    <Table.Column>Geboren</Table.Column>
                    <Table.Column>Anschrift</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {people.map((c) => (
                      <Table.Row key={c.id} href={`/verwaltung/buerger/${c.citizenNumber}`} id={c.id}>
                        <Table.Cell><span className="font-medium">{c.lastName}, {c.firstName}</span></Table.Cell>
                        <Table.Cell><span className="font-mono text-xs">{c.citizenNumber}</span></Table.Cell>
                        <Table.Cell><span className="text-muted">{formatDate(c.birthDate)}</span></Table.Cell>
                        <Table.Cell><span className="text-muted">{c.street}, {c.district}</span></Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Section>
        ) : null}
        {docs.length ? (
          <Section title={`Dokumente (${docs.length})`}>
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Dokumente" className="min-w-[700px]">
                  <Table.Header>
                    <Table.Column isRowHeader>Dokument</Table.Column>
                    <Table.Column>Nummer</Table.Column>
                    <Table.Column>Inhaber/in</Table.Column>
                    <Table.Column>Angaben</Table.Column>
                    <Table.Column>Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {docs.map(({ d, c }) => {
                      const s = documentState(d);

                      return (
                        <Table.Row key={d.id} href={`/verwaltung/dokumente/${d.number}`} id={d.id}>
                          <Table.Cell><span className="font-medium">{d.title}</span><span className="block text-xs text-muted">{DOCUMENT_TYPES[d.type].label}</span></Table.Cell>
                          <Table.Cell><span className="font-mono text-xs">{d.number}</span></Table.Cell>
                          <Table.Cell>{c.lastName}, {c.firstName}</Table.Cell>
                          <Table.Cell><span className="text-xs text-muted">{Object.entries(d.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ") || "–"}</span></Table.Cell>
                          <Table.Cell><Chip color={s.tone} size="sm" variant="soft">{s.label}</Chip></Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Section>
        ) : null}
        {apps.length ? (
          <Section title={`Anträge (${apps.length})`}>
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Anträge" className="min-w-[640px]">
                  <Table.Header>
                    <Table.Column isRowHeader>Leistung</Table.Column>
                    <Table.Column>Aktenzeichen</Table.Column>
                    <Table.Column>Antragsteller/in</Table.Column>
                    <Table.Column>Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {apps.map(({ a, title, c }) => (
                      <Table.Row key={a.id} href={`/verwaltung/antraege/${referenceSlug(a.reference)}`} id={a.id}>
                        <Table.Cell><span className="font-medium">{title}</span></Table.Cell>
                        <Table.Cell><span className="font-mono text-xs">{a.reference}</span></Table.Cell>
                        <Table.Cell>{c.firstName} {c.lastName}</Table.Cell>
                        <Table.Cell><StatusChip status={a.status} /></Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Section>
        ) : null}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

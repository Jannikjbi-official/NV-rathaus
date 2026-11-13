import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card, Chip, Separator, Table } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { PageHeader } from "@/components/ui/page-header";
import { RevokeDocumentButton } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { applications, citizens, departments, documents, services, users } from "@/db/schema";
import { referenceSlug } from "@/lib/applications";
import { documentState } from "@/lib/documents";
import { formatDate, formatLongDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { canHandle, requireStaff } from "@/lib/viewer";

export default async function CitizenRecordPage({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  const viewer = await requireStaff(`/verwaltung/buerger/${nr}`);
  const [row] = await db
    .select({ c: citizens, discord: users.username })
    .from(citizens)
    .innerJoin(users, eq(citizens.userId, users.id))
    .where(eq(citizens.citizenNumber, decodeURIComponent(nr)))
    .limit(1);

  if (!row) notFound();
  const { c, discord } = row;
  const [apps, docs] = await Promise.all([
    db
      .select({ a: applications, title: services.title })
      .from(applications)
      .innerJoin(services, eq(applications.serviceId, services.id))
      .where(eq(applications.citizenId, c.id))
      .orderBy(desc(applications.submittedAt)),
    db
      .select({ d: documents, department: departments.name })
      .from(documents)
      .innerJoin(departments, eq(documents.departmentId, departments.id))
      .where(eq(documents.citizenId, c.id))
      .orderBy(desc(documents.issuedAt)),
  ]);

  return (
    <>
      <PageHeader root={{ label: "Verwaltung", href: "/verwaltung" }} crumbs={[{ label: "Melderegister", href: "/verwaltung/buerger" }, { label: c.citizenNumber }]} description={`Bürgernummer ${c.citizenNumber} · Discord: ${discord}`} title={`${c.firstName} ${c.lastName}`} />
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Content className="grid gap-4 text-sm sm:grid-cols-3">
            <Info label="Geburtsdatum" value={`${formatLongDate(c.birthDate)}, ${c.birthPlace}`} />
            <Info label="Geburtsname" value={c.birthName ?? "–"} />
            <Info label="Geschlecht / Staatsangehörigkeit" value={`${c.gender} / ${c.nationality}`} />
            <Info label="Anschrift" value={`${c.street}, ${c.postalCode} ${c.district}`} />
            <Info label="Telefon" value={c.phone ?? "–"} />
            <Info label="Familienstand / Beruf" value={`${c.maritalStatus} / ${c.occupation ?? "–"}`} />
            <Info label="Größe / Augen" value={`${c.heightCm ? `${c.heightCm} cm` : "–"} / ${c.eyeColor ?? "–"}`} />
            <Info label="Gemeldet seit" value={formatLongDate(c.createdAt)} />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><Card.Title className="text-base">Dokumente</Card.Title></Card.Header>
          <Card.Content className="gap-0">
            {docs.length === 0 ? <p className="text-sm text-muted">Keine Dokumente.</p> : null}
            {docs.map(({ d, department }, i) => {
              const state = documentState(d);

              return (
                <div key={d.id}>
                  {i > 0 ? <Separator /> : null}
                  <div className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{d.title} <span className="text-muted">({DOCUMENT_TYPES[d.type].label})</span></p>
                      <p className="text-xs text-muted">
                        <span className="font-mono">{d.number}</span> · {department} · {formatDate(d.issuedAt)}
                        {d.revokedReason ? ` · ${d.revokedReason}` : ""}
                      </p>
                    </div>
                    <Chip color={state.tone} size="sm" variant="soft">{state.label}</Chip>
                    {!d.revokedAt && canHandle(viewer, d.departmentId) ? <RevokeDocumentButton id={d.id} number={d.number} /> : null}
                  </div>
                </div>
              );
            })}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><Card.Title className="text-base">Anträge</Card.Title>{apps.length === 0 ? <Card.Description>Keine Anträge.</Card.Description> : null}</Card.Header>
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Anträge">
                <Table.Header>
                  <Table.Column isRowHeader>Leistung</Table.Column>
                  <Table.Column>Aktenzeichen</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Eingang</Table.Column>
                </Table.Header>
                <Table.Body>
                  {apps.map(({ a, title }) => (
                    <Table.Row key={a.id} href={canHandle(viewer, a.departmentId) ? `/verwaltung/antraege/${referenceSlug(a.reference)}` : undefined} id={a.id}>
                      <Table.Cell>{title}</Table.Cell>
                      <Table.Cell><span className="font-mono text-xs">{a.reference}</span></Table.Cell>
                      <Table.Cell><StatusChip status={a.status} /></Table.Cell>
                      <Table.Cell><span className="tabular-nums text-muted">{formatDate(a.submittedAt)}</span></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card>
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

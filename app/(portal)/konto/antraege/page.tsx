import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Plus } from "@gravity-ui/icons";
import { Card, Table } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { applications, departments, services } from "@/db/schema";
import { referenceSlug } from "@/lib/applications";
import { formatDate, formatEuro } from "@/lib/format";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Meine Anträge" };

export default async function ApplicationsPage() {
  const viewer = await requireResident("/konto/antraege");
  const rows = await db
    .select({
      reference: applications.reference,
      status: applications.status,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      feeCents: applications.feeCents,
      feePaidAt: applications.feePaidAt,
      title: services.title,
      department: departments.name,
    })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(departments, eq(applications.departmentId, departments.id))
    .where(eq(applications.citizenId, viewer.citizen.id))
    .orderBy(desc(applications.updatedAt));

  return (
    <>
      <PageHeader
        actions={<ButtonLink href="/leistungen"><Plus />Neuer Antrag</ButtonLink>}
        description="Alle Anträge, die Sie gestellt haben, mit aktuellem Stand."
        title="Meine Anträge"
      />
      {rows.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <Card.Title>Noch keine Anträge</Card.Title>
          <Card.Description>Wählen Sie eine Leistung aus dem Verzeichnis, um Ihren ersten Antrag zu stellen.</Card.Description>
          <ButtonLink href="/leistungen" variant="tertiary">Zu den Leistungen</ButtonLink>
        </Card>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Meine Anträge" className="min-w-[640px]">
              <Table.Header>
                <Table.Column isRowHeader>Leistung</Table.Column>
                <Table.Column>Aktenzeichen</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Gebühr</Table.Column>
                <Table.Column>Eingereicht</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((r) => (
                  <Table.Row key={r.reference} href={`/konto/antraege/${referenceSlug(r.reference)}`} id={r.reference}>
                    <Table.Cell>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted">{r.department}</p>
                    </Table.Cell>
                    <Table.Cell><span className="whitespace-nowrap font-mono text-xs">{r.reference}</span></Table.Cell>
                    <Table.Cell><StatusChip status={r.status} /></Table.Cell>
                    <Table.Cell>
                      <span className="whitespace-nowrap text-sm">
                        {formatEuro(r.feeCents)}
                        {r.feeCents > 0 ? <span className="text-muted">{r.feePaidAt ? " · bezahlt" : " · offen"}</span> : null}
                      </span>
                    </Table.Cell>
                    <Table.Cell><span className="tabular-nums text-muted">{formatDate(r.submittedAt)}</span></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </>
  );
}

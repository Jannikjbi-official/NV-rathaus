import { asc, eq, inArray } from "drizzle-orm";
import { Plus } from "@gravity-ui/icons";
import { Chip, Table } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, services } from "@/db/schema";
import { formatEuro } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { requireStaff } from "@/lib/viewer";

export default async function AdminServicesPage() {
  const viewer = await requireStaff("/verwaltung/leistungen");
  const ids = viewer.staffDepartments.map((d) => d.id);
  const rows = await db
    .select({ s: services, department: departments.name })
    .from(services)
    .innerJoin(departments, eq(services.departmentId, departments.id))
    .where(inArray(services.departmentId, ids))
    .orderBy(asc(departments.sortOrder), asc(services.sortOrder));

  return (
    <>
      <PageHeader
        actions={<ButtonLink href="/verwaltung/leistungen/neu"><Plus />Neue Leistung</ButtonLink>}
        description="Leistungen Ihrer Ämter und ihre Antragsformulare. Änderungen am Formular gelten für neue Anträge; bestehende Anträge behalten ihre Fassung."
        title="Leistungen & Formulare"
      />
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Leistungen" className="min-w-[760px]">
            <Table.Header>
              <Table.Column isRowHeader>Leistung</Table.Column>
              <Table.Column>Amt</Table.Column>
              <Table.Column>Felder</Table.Column>
              <Table.Column>Gebühr</Table.Column>
              <Table.Column>Dokument</Table.Column>
              <Table.Column>Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map(({ s, department }) => (
                <Table.Row key={s.id} href={`/verwaltung/leistungen/${s.slug}`} id={s.id}>
                  <Table.Cell>
                    <p className="font-medium">{s.title}</p>
                    <p className="font-mono text-xs text-muted">{s.slug} · v{s.version}</p>
                  </Table.Cell>
                  <Table.Cell>{department}</Table.Cell>
                  <Table.Cell><span className="tabular-nums">{s.fields.length}</span></Table.Cell>
                  <Table.Cell>{formatEuro(s.feeCents)}</Table.Cell>
                  <Table.Cell><span className="text-muted">{s.issuesDocument ? DOCUMENT_TYPES[s.issuesDocument].label : "–"}</span></Table.Cell>
                  <Table.Cell>
                    <Chip color={s.isActive ? "success" : "default"} size="sm" variant="soft">{s.isActive ? "online" : "deaktiviert"}</Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}

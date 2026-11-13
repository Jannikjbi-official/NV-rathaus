import { asc, count, eq } from "drizzle-orm";
import { Plus } from "@gravity-ui/icons";
import { Chip, Table } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { requireStaff } from "@/lib/viewer";

export default async function AdminJobsPage() {
  await requireStaff("/verwaltung/stellen");
  const rows = await db
    .select({ j: jobs, n: count(applications.id) })
    .from(jobs)
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .groupBy(jobs.id)
    .orderBy(asc(jobs.title));

  return (
    <>
      <PageHeader
        actions={<ButtonLink href="/verwaltung/stellen/neu"><Plus />Neue Stelle</ButtonLink>}
        description="Bewerbungen landen als Antrag „Bewerbung bei der Stadt“ im Posteingang des Bürgermeisterbüros."
        title="Stellenangebote"
      />
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Stellen" className="min-w-[640px]">
            <Table.Header>
              <Table.Column isRowHeader>Stelle</Table.Column>
              <Table.Column>Arbeitgeber</Table.Column>
              <Table.Column>Bewerbungen</Table.Column>
              <Table.Column>Frist</Table.Column>
              <Table.Column>Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map(({ j, n }) => (
                <Table.Row key={j.id} href={`/verwaltung/stellen/${j.id}`} id={j.id}>
                  <Table.Cell><span className="font-medium">{j.title}</span></Table.Cell>
                  <Table.Cell><span className="text-muted">{j.organization}</span></Table.Cell>
                  <Table.Cell><span className="tabular-nums">{n}</span></Table.Cell>
                  <Table.Cell><span className="tabular-nums text-muted">{j.deadline ? formatDate(j.deadline) : "laufend"}</span></Table.Cell>
                  <Table.Cell><Chip color={j.isOpen ? "success" : "default"} size="sm" variant="soft">{j.isOpen ? "ausgeschrieben" : "geschlossen"}</Chip></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}

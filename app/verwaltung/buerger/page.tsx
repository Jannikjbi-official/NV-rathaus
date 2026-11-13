import { desc, ilike, or } from "drizzle-orm";
import { SearchField, Table } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { citizens } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { requireStaff } from "@/lib/viewer";

export default async function RegistryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [, { q = "" }] = await Promise.all([requireStaff("/verwaltung/buerger"), searchParams]);
  const term = q.trim();
  const rows = await db
    .select()
    .from(citizens)
    .where(
      term
        ? or(ilike(citizens.lastName, `%${term}%`), ilike(citizens.firstName, `%${term}%`), ilike(citizens.citizenNumber, `%${term}%`), ilike(citizens.street, `%${term}%`))
        : undefined,
    )
    .orderBy(desc(citizens.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader description="Alle gemeldeten Bürgerinnen und Bürger. Zugriffe sind nur für dienstliche Zwecke zulässig." title="Melderegister" />
      <form action="/verwaltung/buerger" className="mb-5">
        <SearchField aria-label="Melderegister durchsuchen" defaultValue={term} name="q">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Name, Bürgernummer oder Straße" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </form>
      {rows.length === 0 ? <p className="mb-4 text-sm text-muted">Keine Einträge gefunden.</p> : null}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Melderegister" className="min-w-[680px]">
            <Table.Header>
              <Table.Column isRowHeader>Name</Table.Column>
              <Table.Column>Bürgernummer</Table.Column>
              <Table.Column>Geboren</Table.Column>
              <Table.Column>Anschrift</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((c) => (
                <Table.Row key={c.id} href={`/verwaltung/buerger/${c.citizenNumber}`} id={c.id}>
                  <Table.Cell><span className="font-medium">{c.lastName}, {c.firstName}</span></Table.Cell>
                  <Table.Cell><span className="font-mono text-xs">{c.citizenNumber}</span></Table.Cell>
                  <Table.Cell><span className="tabular-nums text-muted">{formatDate(c.birthDate)}</span></Table.Cell>
                  <Table.Cell><span className="text-muted">{c.street}, {c.district}</span></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}

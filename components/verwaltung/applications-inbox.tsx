import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { Card, Chip, SearchField, Table, Tabs } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { DepartmentFilter } from "@/components/verwaltung/department-filter";
import { db } from "@/db";
import { applications, citizens, departments, services, users, type ApplicationStatus } from "@/db/schema";
import { referenceSlug } from "@/lib/applications";
import { formatEuro, formatRelative } from "@/lib/format";
import { OPEN_STATUSES as OPEN } from "@/lib/status";
import type { Viewer } from "@/lib/viewer";

const TABS: { id: string; label: string; statuses: ApplicationStatus[] | null; mine?: boolean }[] = [
  { id: "neu", label: "Neu", statuses: ["eingereicht"] },
  { id: "meine", label: "Mir zugewiesen", statuses: ["eingereicht", "in_bearbeitung", "rueckfrage"], mine: true },
  { id: "bearbeitung", label: "In Bearbeitung", statuses: ["in_bearbeitung"] },
  { id: "rueckfrage", label: "Rückfrage", statuses: ["rueckfrage"] },
  { id: "offen", label: "Alle offenen", statuses: ["eingereicht", "in_bearbeitung", "rueckfrage"] },
  { id: "erledigt", label: "Erledigt", statuses: ["genehmigt", "abgelehnt", "zurueckgezogen"] },
  { id: "alle", label: "Alle", statuses: null },
];

export async function ApplicationsInbox({
  viewer,
  basePath,
  params,
  defaultTab,
}: {
  viewer: Viewer;
  basePath: string;
  params: { status?: string; amt?: string; q?: string };
  defaultTab: string;
}) {
  const tab = TABS.find((t) => t.id === params.status) ?? TABS.find((t) => t.id === defaultTab)!;
  const myDepts = viewer.staffDepartments;
  const deptFilter = myDepts.find((d) => d.slug === params.amt);
  const deptIds = deptFilter ? [deptFilter.id] : myDepts.map((d) => d.id);
  const q = params.q?.trim() ?? "";

  const scope: SQL[] = [inArray(applications.departmentId, deptIds.length ? deptIds : ["00000000-0000-0000-0000-000000000000"])];

  if (q) {
    scope.push(
      or(
        ilike(applications.reference, `%${q}%`),
        ilike(citizens.lastName, `%${q}%`),
        ilike(citizens.firstName, `%${q}%`),
        ilike(citizens.citizenNumber, `%${q}%`),
        ilike(services.title, `%${q}%`),
      )!,
    );
  }

  const where = and(
    ...scope,
    tab.statuses ? inArray(applications.status, tab.statuses) : undefined,
    tab.mine ? eq(applications.assigneeId, viewer.user.id) : undefined,
  );

  const [rows, counts] = await Promise.all([
    db
      .select({
        reference: applications.reference,
        status: applications.status,
        submittedAt: applications.submittedAt,
        updatedAt: applications.updatedAt,
        feeCents: applications.feeCents,
        feePaidAt: applications.feePaidAt,
        service: services.title,
        processingDays: services.processingDays,
        department: departments.name,
        firstName: citizens.firstName,
        lastName: citizens.lastName,
        assignee: users.displayName,
      })
      .from(applications)
      .innerJoin(services, eq(applications.serviceId, services.id))
      .innerJoin(departments, eq(applications.departmentId, departments.id))
      .innerJoin(citizens, eq(applications.citizenId, citizens.id))
      .leftJoin(users, eq(applications.assigneeId, users.id))
      .where(where)
      .orderBy(desc(applications.updatedAt))
      .limit(200),
    db
      .select({ status: applications.status, n: count() })
      .from(applications)
      .innerJoin(citizens, eq(applications.citizenId, citizens.id))
      .innerJoin(services, eq(applications.serviceId, services.id))
      .where(and(...scope))
      .groupBy(applications.status),
  ]);

  const [{ n: mineCount }] = await db
    .select({ n: count() })
    .from(applications)
    .innerJoin(citizens, eq(applications.citizenId, citizens.id))
    .innerJoin(services, eq(applications.serviceId, services.id))
    .where(and(...scope, eq(applications.assigneeId, viewer.user.id), inArray(applications.status, OPEN)));
  const countFor = (t: (typeof TABS)[number]) =>
    t.mine ? mineCount : counts.filter((c) => !t.statuses || t.statuses.includes(c.status)).reduce((a, c) => a + c.n, 0);
  const isOverdue = (r: (typeof rows)[number]) =>
    OPEN.includes(r.status) && r.status !== "rueckfrage" && r.submittedAt.getTime() + Math.max(1, r.processingDays) * 86400000 < Date.now();
  const href = (status: string) => {
    const sp = new URLSearchParams();

    sp.set("status", status);
    if (params.amt) sp.set("amt", params.amt);
    if (q) sp.set("q", q);

    return `${basePath}?${sp}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <form action={basePath} className="flex-1">
          <input name="status" type="hidden" value={tab.id} />
          {params.amt ? <input name="amt" type="hidden" value={params.amt} /> : null}
          <SearchField aria-label="Anträge durchsuchen" defaultValue={q} name="q">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Aktenzeichen, Name, Bürgernummer oder Leistung" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </form>
        {myDepts.length > 1 ? <DepartmentFilter departments={myDepts.map((d) => ({ slug: d.slug, name: d.name }))} value={params.amt ?? ""} /> : null}
      </div>

      <Tabs selectedKey={tab.id}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Status" className="w-fit">
            {TABS.map((t) => (
              <Tabs.Tab key={t.id} className="gap-2 whitespace-nowrap" href={href(t.id)} id={t.id}>
                {t.label}
                <span className="text-xs tabular-nums text-muted">{countFor(t)}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {rows.length === 0 ? (
        <Card className="items-center py-14 text-center">
          <Card.Title>Keine Anträge</Card.Title>
          <Card.Description>{q ? "Keine Treffer für Ihre Suche." : "In dieser Ansicht liegt nichts vor."}</Card.Description>
        </Card>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Anträge" className="min-w-[860px]">
              <Table.Header>
                <Table.Column isRowHeader>Leistung</Table.Column>
                <Table.Column>Antragsteller/in</Table.Column>
                <Table.Column>Aktenzeichen</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Gebühr</Table.Column>
                <Table.Column>Bearbeitung</Table.Column>
                <Table.Column>Aktualisiert</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((r) => (
                  <Table.Row key={r.reference} href={`/verwaltung/antraege/${referenceSlug(r.reference)}`} id={r.reference}>
                    <Table.Cell>
                      <p className="font-medium">{r.service}</p>
                      <p className="text-xs text-muted">{r.department}</p>
                    </Table.Cell>
                    <Table.Cell>{r.firstName} {r.lastName}</Table.Cell>
                    <Table.Cell><span className="whitespace-nowrap font-mono text-xs">{r.reference}</span></Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap items-center gap-1">
                        <StatusChip status={r.status} />
                        {isOverdue(r) ? <Chip color="danger" size="sm" variant="soft">überfällig</Chip> : null}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {r.feeCents > 0 ? (
                        <Chip color={r.feePaidAt ? "success" : "warning"} size="sm" variant="soft">{formatEuro(r.feeCents)}</Chip>
                      ) : (
                        <span className="text-xs text-muted">–</span>
                      )}
                    </Table.Cell>
                    <Table.Cell><span className="text-sm text-muted">{r.assignee ?? "offen"}</span></Table.Cell>
                    <Table.Cell><span className="whitespace-nowrap text-sm text-muted">{formatRelative(r.updatedAt)}</span></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { ArrowRight, Calendar, CircleExclamationFill, FileText, Persons, Tray } from "@gravity-ui/icons";
import { Card, Chip, Link, SearchField, Table, Tabs } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityChart } from "@/components/verwaltung/activity-chart";
import { AppointmentList, KpiTile, QueueList } from "@/components/verwaltung/dashboard-parts";
import { db } from "@/db";
import { citizens, departments } from "@/db/schema";
import { getDaily, getKpis, getQueue, getTodayAppointments, getTopServices } from "@/lib/admin-stats";
import { formatDuration, openingStatus } from "@/lib/format";
import { getRegisterCount, getRegisterRows, REGISTERS } from "@/lib/registers";
import { canHandle, requireStaff } from "@/lib/viewer";

export default async function DepartmentDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ register?: string; q?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const viewer = await requireStaff(`/verwaltung/amt/${slug}`);
  const [dept] = await db.select().from(departments).where(eq(departments.slug, slug)).limit(1);

  if (!dept || !canHandle(viewer, dept.id)) notFound();

  const registers = REGISTERS[slug] ?? [];
  const active = registers.find((r) => r.id === sp.register) ?? registers[0];
  const q = sp.q?.trim() ?? "";

  const [kpis, daily, queue, today, top, counts, rows, [{ n: citizenCount }]] = await Promise.all([
    getKpis([dept.id]),
    getDaily([dept.id]),
    getQueue([dept.id], { limit: 6 }),
    getTodayAppointments([dept.id]),
    getTopServices([dept.id]),
    Promise.all(registers.map((r) => getRegisterCount(dept.id, r))),
    active ? getRegisterRows(dept.id, active, q) : Promise.resolve([]),
    slug === "buergeramt" ? db.select({ n: count() }).from(citizens) : Promise.resolve([{ n: 0 }]),
  ]);
  const status = openingStatus(dept.openingHours);
  const registerHref = (id: string, query = "") => `/verwaltung/amt/${slug}?register=${id}${query ? `&q=${encodeURIComponent(query)}` : ""}#register`;

  return (
    <>
      <PageHeader
        actions={
          <>
            <ButtonLink href={`/verwaltung/posteingang?amt=${slug}&status=offen`} variant="tertiary"><Tray />Posteingang</ButtonLink>
            <ButtonLink href="/verwaltung/leistungen" variant="tertiary"><FileText />Formulare</ButtonLink>
          </>
        }
        crumbs={[{ label: dept.name }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Chip color={status.tone} size="sm" variant="soft">{status.label}</Chip>
            <span>{dept.address} · {dept.phone}</span>
            {!dept.discordRoleId ? <Chip color="warning" size="sm" variant="soft">keine Discord-Rolle zugeordnet</Chip> : null}
          </span>
        }
        root={{ label: "Verwaltung", href: "/verwaltung" }}
        title={dept.name}
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-6">
          <KpiTile hint={`${kpis.fresh} neu · ${kpis.waiting} Rückfrage`} href={`/verwaltung/posteingang?amt=${slug}&status=offen`} icon={<Tray />} label="Offene Anträge" value={kpis.open} />
          <KpiTile hint="Bearbeitungszeit überschritten" icon={<CircleExclamationFill />} label="Überfällig" tone={kpis.overdue ? "danger" : "success"} value={kpis.overdue} />
          <KpiTile hint="vom Eingang bis zur Entscheidung" label="Ø Bearbeitungszeit" value={formatDuration(kpis.avgDays)} />
          <KpiTile href="/verwaltung/termine" icon={<Calendar />} label="Termine heute" value={kpis.appointmentsToday} />
          {slug === "buergeramt" ? <KpiTile href="/verwaltung/buerger" icon={<Persons />} label="Gemeldete Bürger" value={citizenCount} /> : null}
          {registers.map((r, i) => (
            <KpiTile key={r.id} hint={r.title} href={registerHref(r.id)} label={r.countLabel} value={counts[i]} />
          ))}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <ActivityChart data={daily} title={`Anträge im ${dept.name}, letzte 14 Tage`} />
          </Card>
          <div className="flex flex-col gap-6">
            <Card>
              <Card.Header><Card.Title className="text-base">Termine heute</Card.Title></Card.Header>
              <Card.Content><AppointmentList items={today} /></Card.Content>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Meistgenutzte Leistungen</Card.Title>
                <Card.Description>letzte 30 Tage</Card.Description>
              </Card.Header>
              <Card.Content className="gap-2">
                {top.length === 0 ? <p className="text-sm text-muted">Noch keine Anträge.</p> : null}
                {top.map((t) => (
                  <div key={t.slug} className="flex items-center gap-3 text-sm">
                    <Link className="min-w-0 flex-1 truncate" href={`/verwaltung/leistungen/${t.slug}`}>{t.title}</Link>
                    <span className="font-medium tabular-nums">{t.n}</span>
                  </div>
                ))}
              </Card.Content>
            </Card>
          </div>
        </div>

        <Card>
          <Card.Header className="flex-row items-center justify-between">
            <div>
              <Card.Title className="text-base">Zu bearbeiten</Card.Title>
              <Card.Description>Älteste offene Anträge zuerst</Card.Description>
            </div>
            <Link className="text-sm" href={`/verwaltung/posteingang?amt=${slug}&status=offen`}>Alle<Link.Icon><ArrowRight /></Link.Icon></Link>
          </Card.Header>
          <Card.Content><QueueList empty="Alle Anträge dieses Amts sind bearbeitet." items={queue} /></Card.Content>
        </Card>

        {active ? (
          <section className="flex flex-col gap-4 scroll-mt-6" id="register">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Register</h2>
                <p className="text-sm text-muted">{active.description}</p>
              </div>
              {registers.length > 1 ? (
                <Tabs selectedKey={active.id}>
                  <Tabs.ListContainer>
                    <Tabs.List aria-label="Register">
                      {registers.map((r) => (
                        <Tabs.Tab key={r.id} className="whitespace-nowrap" href={registerHref(r.id)} id={r.id}>
                          {r.title}
                          <Tabs.Indicator />
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
              ) : null}
            </div>
            <form action={`/verwaltung/amt/${slug}#register`}>
              <input name="register" type="hidden" value={active.id} />
              <SearchField aria-label={`${active.title} durchsuchen`} defaultValue={q} name="q">
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder={active.searchHint} />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </form>
            {rows.length === 0 ? (
              <Card className="py-10 text-center">
                <Card.Description>{q ? `Kein Eintrag für „${q}“.` : "Noch keine Einträge im Register."}</Card.Description>
              </Card>
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label={active.title} className="min-w-[760px]">
                    <Table.Header>
                      {[...active.columns.map((c) => c.label), "Status"].map((label, i) => (
                        <Table.Column key={label} isRowHeader={i === 0}>{label}</Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {rows.map((r) => (
                        <Table.Row key={r.number} href={`/verwaltung/dokumente/${r.number}`} id={r.number}>
                          {[
                            ...active.columns.map((c) => (
                              <Table.Cell key={c.label}>
                                <span className={`${c.mono ? "font-mono text-xs" : ""} ${c.strong ? "font-medium" : "text-muted"}`}>{c.value(r)}</span>
                              </Table.Cell>
                            )),
                            <Table.Cell key="status">
                              <Chip color={r.state.tone} size="sm" variant="soft">{r.state.label}</Chip>
                            </Table.Cell>,
                          ]}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}

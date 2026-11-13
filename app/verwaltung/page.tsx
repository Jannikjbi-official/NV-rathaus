import NextLink from "next/link";
import { ArrowRight, Calendar, ChevronRight, CircleExclamationFill, FileText, Tray } from "@gravity-ui/icons";
import { Alert, Card, Chip, Link } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { ActivityChart } from "@/components/verwaltung/activity-chart";
import { ActivityFeed, AppointmentList, KpiTile, QueueList } from "@/components/verwaltung/dashboard-parts";
import { getDaily, getKpis, getQueue, getRecentActivity, getTodayAppointments } from "@/lib/admin-stats";
import { formatDuration } from "@/lib/format";
import { getDepartments } from "@/lib/queries";
import { requireStaff } from "@/lib/viewer";

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ hinweis?: string }> }) {
  const [viewer, { hinweis }] = await Promise.all([requireStaff(), searchParams]);
  const ids = viewer.staffDepartments.map((d) => d.id);

  const [kpis, daily, queue, mine, today, activity, departments, perDept] = await Promise.all([
    getKpis(ids),
    getDaily(ids),
    getQueue(ids, { limit: 6 }),
    getQueue(ids, { limit: 5, assigneeId: viewer.user.id }),
    getTodayAppointments(ids),
    getRecentActivity(ids),
    getDepartments(),
    Promise.all(viewer.staffDepartments.map(async (d) => ({ id: d.id, k: await getKpis([d.id]) }))),
  ]);
  const deptCards = departments.filter((d) => ids.includes(d.id));
  const hour = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", timeZone: "Europe/Berlin" }).format(new Date()));
  const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <>
      <PageHeader
        description={`${viewer.isAdmin ? "Alle Ämter" : viewer.staffDepartments.map((d) => d.name).join(", ")} · Stand ${new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date())}`}
        title={`${greeting}, ${viewer.name.split(" ")[0]}`}
      />
      <div className="flex flex-col gap-6">
        {hinweis === "nur-admin" ? (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content><Alert.Title>Dieser Bereich ist nur für Admins.</Alert.Title></Alert.Content>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-6">
          <KpiTile hint={`${kpis.fresh} neu · ${kpis.waiting} mit Rückfrage`} href="/verwaltung/posteingang?status=offen" icon={<Tray />} label="Offene Anträge" value={kpis.open} />
          <KpiTile hint="Bearbeitungszeit überschritten" href="/verwaltung/posteingang?status=offen" icon={<CircleExclamationFill />} label="Überfällig" tone={kpis.overdue ? "danger" : "success"} value={kpis.overdue} />
          <KpiTile hint="letzte 30 Tage" label="Entschieden" value={kpis.decided30} />
          <KpiTile hint="vom Eingang bis zur Entscheidung" label="Ø Bearbeitungszeit" value={formatDuration(kpis.avgDays)} />
          <KpiTile hint="letzte 30 Tage" icon={<FileText />} label="Dokumente ausgestellt" value={kpis.documents30} />
          <KpiTile href="/verwaltung/termine" icon={<Calendar />} label="Termine heute" value={kpis.appointmentsToday} />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <ActivityChart data={daily} title="Anträge der letzten 14 Tage" />
          </Card>
          <Card>
            <Card.Header className="flex-row items-center justify-between">
              <Card.Title className="text-base">Heute im Rathaus</Card.Title>
              <Link className="text-sm" href="/verwaltung/termine">Alle Termine<Link.Icon><ArrowRight /></Link.Icon></Link>
            </Card.Header>
            <Card.Content>
              <AppointmentList items={today} />
            </Card.Content>
          </Card>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Meine Ämter</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deptCards.map((d) => {
              const k = perDept.find((p) => p.id === d.id)!.k;

              return (
                <NextLink key={d.id} className="group rounded-3xl" href={`/verwaltung/amt/${d.slug}`}>
                  <Card className="h-full flex-row items-center gap-4 transition-shadow group-hover:shadow-overlay">
                    <div className="min-w-0 flex-1">
                      <Card.Title>{d.name}</Card.Title>
                      <Card.Description className="text-xs">
                        {k.open} offen · {k.decided30} entschieden (30 T) · {k.appointmentsToday} Termine heute
                      </Card.Description>
                    </div>
                    {k.overdue ? <Chip color="danger" size="sm" variant="soft">{k.overdue} überfällig</Chip> : k.fresh ? <Chip color="accent" size="sm" variant="soft">{k.fresh} neu</Chip> : null}
                    <ChevronRight className="size-4 text-muted" />
                  </Card>
                </NextLink>
              );
            })}
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <Card.Header className="flex-row items-center justify-between">
                <div>
                  <Card.Title className="text-base">Als Nächstes</Card.Title>
                  <Card.Description>Älteste offene Anträge zuerst</Card.Description>
                </div>
                <Link className="text-sm" href="/verwaltung/posteingang?status=offen">Posteingang<Link.Icon><ArrowRight /></Link.Icon></Link>
              </Card.Header>
              <Card.Content>
                <QueueList empty="Alle Anträge sind bearbeitet." items={queue} />
              </Card.Content>
            </Card>
            <Card>
              <Card.Header className="flex-row items-center justify-between">
                <Card.Title className="text-base">Mir zugewiesen</Card.Title>
                <Link className="text-sm" href="/verwaltung/posteingang?status=meine">Alle<Link.Icon><ArrowRight /></Link.Icon></Link>
              </Card.Header>
              <Card.Content>
                <QueueList empty="Ihnen ist gerade nichts zugewiesen." items={mine} />
              </Card.Content>
            </Card>
          </div>
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Letzte Aktivität</Card.Title>
            </Card.Header>
            <Card.Content>
              <ActivityFeed items={activity} />
            </Card.Content>
          </Card>
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Card, Link } from "@heroui/react";

import { ApplicationData, StatusChip, StatusSteps, Timeline } from "@/components/applications/parts";
import { PageHeader } from "@/components/ui/page-header";
import { Workbench } from "@/components/verwaltung/workbench";
import { db } from "@/db";
import { applicationEvents, applications, citizens, departments, documents, jobs, services, users } from "@/db/schema";
import { referenceFromSlug } from "@/lib/applications";
import { documentPreset } from "@/lib/document-presets";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { canHandle, requireStaff } from "@/lib/viewer";

export default async function AdminApplicationPage({ params }: { params: Promise<{ az: string }> }) {
  const { az } = await params;
  const viewer = await requireStaff(`/verwaltung/antraege/${az}`);
  const [row] = await db
    .select({ app: applications, service: services, department: departments, citizen: citizens, job: jobs })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(departments, eq(applications.departmentId, departments.id))
    .innerJoin(citizens, eq(applications.citizenId, citizens.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.reference, referenceFromSlug(az)))
    .limit(1);

  if (!row || !canHandle(viewer, row.app.departmentId)) notFound();
  const { app, service, department, citizen, job } = row;

  const [events, docs] = await Promise.all([
    db
      .select({ event: applicationEvents, authorName: users.displayName, authorUser: users.username })
      .from(applicationEvents)
      .leftJoin(users, eq(applicationEvents.authorId, users.id))
      .where(eq(applicationEvents.applicationId, app.id))
      .orderBy(asc(applicationEvents.createdAt)),
    db.select().from(documents).where(eq(documents.applicationId, app.id)),
  ]);

  return (
    <>
      <PageHeader
        actions={<StatusChip size="lg" status={app.status} />}
        description={`${department.name} · ${app.reference} · eingegangen ${formatDateTime(app.submittedAt)}`}
        title={job ? `Bewerbung: ${job.title}` : service.title}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <Card.Content>
              <StatusSteps status={app.status} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="flex-row items-center justify-between">
              <Card.Title className="text-base">Antragsteller/in</Card.Title>
              <Link className="text-sm" href={`/verwaltung/buerger/${citizen.citizenNumber}`}>Im Melderegister öffnen</Link>
            </Card.Header>
            <Card.Content className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Info label="Name" value={`${citizen.firstName} ${citizen.lastName}`} />
              <Info label="Bürgernummer" value={citizen.citizenNumber} />
              <Info label="Geburtsdatum" value={`${formatLongDate(citizen.birthDate)}, ${citizen.birthPlace}`} />
              <Info label="Anschrift" value={`${citizen.street}, ${citizen.postalCode} ${citizen.district}`} />
              <Info label="Telefon" value={citizen.phone ?? "–"} />
              <Info label="Familienstand" value={citizen.maritalStatus} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-base">Angaben im Antrag</Card.Title>
            </Card.Header>
            <Card.Content>
              <ApplicationData data={app.data} fields={app.fieldsSnapshot} />
            </Card.Content>
          </Card>

          {docs.length > 0 ? (
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Ausgestellte Dokumente</Card.Title>
              </Card.Header>
              <Card.Content className="gap-2 text-sm">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3">
                    <Link href={`/verwaltung/dokumente/${d.number}`}>{d.title}</Link>
                    <Link className="font-mono text-xs" href={`/pruefen?nr=${d.number}`}>{d.number}</Link>
                  </div>
                ))}
              </Card.Content>
            </Card>
          ) : null}

          <Card>
            <Card.Header>
              <Card.Title className="text-base">Verlauf</Card.Title>
            </Card.Header>
            <Card.Content>
              <Timeline
                events={events.map(({ event, authorName, authorUser }) => ({
                  ...event,
                  authorName: authorName ?? authorUser,
                  byCitizen: event.authorId === citizen.userId,
                }))}
              />
            </Card.Content>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-8">
          <Workbench
            applicationId={app.id}
            feeCents={app.feeCents}
            feePaid={!!app.feePaidAt}
            issuedCount={docs.length}
            preset={documentPreset(service, app.data, citizen)}
            status={app.status}
          />
        </aside>
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

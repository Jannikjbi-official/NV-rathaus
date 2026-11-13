import { notFound } from "next/navigation";
import NextLink from "next/link";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { Card, Chip, Link, Separator } from "@heroui/react";

import { ApplicationData, StatusChip, StatusSteps, Timeline } from "@/components/applications/parts";
import { DocumentThumb } from "@/components/documents/document-viewer";
import { PageHeader } from "@/components/ui/page-header";
import { ChecksPanel, NextStepBanner } from "@/components/verwaltung/checks-panel";
import { Workbench } from "@/components/verwaltung/workbench";
import { db } from "@/db";
import { applicationEvents, applications, citizens, departments, documents, jobs, services, users } from "@/db/schema";
import { referenceFromSlug, referenceSlug } from "@/lib/applications";
import { nextStep, runChecks } from "@/lib/application-checks";
import { getDocumentsForApplication, getDraftDocument } from "@/lib/document-render";
import { documentState } from "@/lib/documents";
import { DOCUMENT_TYPES } from "@/lib/status";
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

  const preset = documentPreset(service, app.data, citizen);
  const [events, docs, checks, draft, otherApps, citizenDocs] = await Promise.all([
    db
      .select({ event: applicationEvents, authorName: users.displayName, authorUser: users.username })
      .from(applicationEvents)
      .leftJoin(users, eq(applicationEvents.authorId, users.id))
      .where(eq(applicationEvents.applicationId, app.id))
      .orderBy(asc(applicationEvents.createdAt)),
    getDocumentsForApplication(app.id),
    runChecks(app, service, citizen),
    preset && app.status === "genehmigt" ? getDraftDocument(app.id, preset) : Promise.resolve(null),
    db
      .select({ reference: applications.reference, status: applications.status, title: services.title, departmentId: applications.departmentId })
      .from(applications)
      .innerJoin(services, eq(applications.serviceId, services.id))
      .where(and(eq(applications.citizenId, citizen.id), ne(applications.id, app.id)))
      .orderBy(desc(applications.submittedAt))
      .limit(6),
    db.select().from(documents).where(eq(documents.citizenId, citizen.id)).orderBy(desc(documents.issuedAt)).limit(8),
  ]);
  const publicEvents = events.filter((e) => !e.event.isInternal);
  const step = nextStep(app, service, docs.length, publicEvents.at(-1)?.event.type ?? null);

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
            <Card.Content className="gap-4">
              <StatusSteps status={app.status} />
              <NextStepBanner step={step} />
            </Card.Content>
          </Card>

          <ChecksPanel checks={checks} />

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
                <Card.Description>Klicken für Vollansicht, Download und Widerruf.</Card.Description>
              </Card.Header>
              <Card.Content className="grid gap-4 sm:grid-cols-2">
                {docs.map((d) => (
                  <NextLink key={d.number} className="group flex flex-col gap-2 rounded-2xl" href={`/verwaltung/dokumente/${d.number}`}>
                    <div className="flex justify-center rounded-2xl bg-default/60 p-4 transition-colors group-hover:bg-default">
                      <div className="w-full" style={{ maxWidth: ["urkunde", "bescheid", "bescheinigung", "genehmigung", "gewerbeschein"].includes(d.type) ? 160 : 340 }}>
                        <DocumentThumb doc={d} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span className="truncate text-sm font-medium">{d.title}</span>
                      <Chip color={d.state.tone} size="sm" variant="soft">{d.state.label}</Chip>
                    </div>
                  </NextLink>
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

        <aside className="flex flex-col gap-4 xl:sticky xl:top-20">
          <Workbench
            applicationId={app.id}
            draft={draft}
            feeCents={app.feeCents}
            feePaid={!!app.feePaidAt}
            issuedCount={docs.length}
            preset={preset}
            status={app.status}
          />
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Weitere Vorgänge</Card.Title>
              <Card.Description>{citizen.firstName} {citizen.lastName}</Card.Description>
            </Card.Header>
            <Card.Content className="gap-0">
              {citizenDocs.length === 0 && otherApps.length === 0 ? <p className="text-sm text-muted">Keine weiteren Vorgänge.</p> : null}
              {citizenDocs.map((d) => {
                const st = documentState(d);

                return (
                  <NextLink key={d.id} className="flex items-center gap-2 py-1.5 text-sm hover:underline" href={`/verwaltung/dokumente/${d.number}`}>
                    <span className="min-w-0 flex-1 truncate">{DOCUMENT_TYPES[d.type].label}</span>
                    <Chip color={st.tone} size="sm" variant="soft">{st.label}</Chip>
                  </NextLink>
                );
              })}
              {citizenDocs.length && otherApps.length ? <Separator className="my-2" /> : null}
              {otherApps.map((o) => (
                <div key={o.reference} className="flex items-center gap-2 py-1.5 text-sm">
                  {canHandle(viewer, o.departmentId) ? (
                    <Link className="min-w-0 flex-1 truncate" href={`/verwaltung/antraege/${referenceSlug(o.reference)}`}>{o.title}</Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-muted">{o.title}</span>
                  )}
                  <StatusChip status={o.status} />
                </div>
              ))}
            </Card.Content>
          </Card>
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Calendar, FileText } from "@gravity-ui/icons";
import { Alert, Card, Chip, Separator } from "@heroui/react";

import { ApplicationData, StatusChip, StatusSteps, Timeline } from "@/components/applications/parts";
import { ReplyForm, SubmittedToast, WithdrawButton } from "@/components/konto/application-actions";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { applicationEvents, applications, departments, documents, services, users } from "@/db/schema";
import { referenceFromSlug } from "@/lib/applications";
import { formatDateTime, formatEuro } from "@/lib/format";
import { OPEN_STATUSES, STATUS } from "@/lib/status";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Antrag" };

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ az: string }>; searchParams: Promise<{ neu?: string }> }) {
  const [{ az }, { neu }] = await Promise.all([params, searchParams]);
  const viewer = await requireResident(`/konto/antraege/${az}`);
  const reference = referenceFromSlug(az);
  const [row] = await db
    .select({ app: applications, service: services, department: departments })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(departments, eq(applications.departmentId, departments.id))
    .where(and(eq(applications.reference, reference), eq(applications.citizenId, viewer.citizen.id)))
    .limit(1);

  if (!row) notFound();
  const { app, service, department } = row;
  const [events, docs] = await Promise.all([
    db
      .select({ event: applicationEvents, authorName: users.displayName })
      .from(applicationEvents)
      .leftJoin(users, eq(applicationEvents.authorId, users.id))
      .where(and(eq(applicationEvents.applicationId, app.id), eq(applicationEvents.isInternal, false)))
      .orderBy(asc(applicationEvents.createdAt)),
    db.select().from(documents).where(eq(documents.applicationId, app.id)),
  ]);
  const open = OPEN_STATUSES.includes(app.status);
  const lastQuestion = [...events].reverse().find((e) => e.event.type === "status" && e.event.toStatus === "rueckfrage");

  return (
    <>
      <SubmittedToast show={neu === "1"} />
      <PageHeader
        actions={<StatusChip size="lg" status={app.status} />}
        crumbs={[{ label: "Meine Anträge", href: "/konto/antraege" }, { label: app.reference }]}
        description={`${department.name} · Aktenzeichen ${app.reference}`}
        title={service.title}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <Card.Content className="gap-4">
              <StatusSteps status={app.status} />
              <p className="text-sm text-muted">{STATUS[app.status].hint}</p>
            </Card.Content>
          </Card>

          {app.status === "rueckfrage" ? (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Das Amt hat eine Rückfrage</Alert.Title>
                <Alert.Description>{lastQuestion?.event.message ?? "Bitte beantworten Sie die Rückfrage unten."}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          {docs.length > 0 ? (
            <Card>
              <Card.Header className="flex-row items-center gap-2">
                <FileText className="size-4 text-success" />
                <Card.Title className="text-base">Ausgestellte Dokumente</Card.Title>
              </Card.Header>
              <Card.Content className="gap-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="font-mono text-xs text-muted">{d.number}</p>
                    </div>
                    <ButtonLink href={`/konto/dokumente/${d.number}`} size="sm" variant="tertiary">Ansehen</ButtonLink>
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
                events={events.map(({ event, authorName }) => ({
                  ...event,
                  authorName: event.authorId === viewer.user.id ? "Sie" : authorName,
                  byCitizen: event.authorId === viewer.user.id,
                }))}
              />
            </Card.Content>
            {open ? (
              <>
                <Separator />
                <Card.Content>
                  <ReplyForm applicationId={app.id} prominent={app.status === "rueckfrage"} />
                </Card.Content>
              </>
            ) : null}
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-base">Ihre Angaben</Card.Title>
            </Card.Header>
            <Card.Content>
              <ApplicationData data={app.data} fields={app.fieldsSnapshot} />
            </Card.Content>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-36">
          <Card>
            <Card.Content className="gap-3 text-sm">
              <Row label="Eingereicht" value={formatDateTime(app.submittedAt)} />
              <Row label="Zuletzt geändert" value={formatDateTime(app.updatedAt)} />
              <div>
                <p className="text-xs text-muted">Gebühr</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatEuro(app.feeCents)}</span>
                  {app.feeCents > 0 ? (
                    <Chip color={app.feePaidAt ? "success" : "warning"} size="sm" variant="soft">{app.feePaidAt ? "bezahlt" : "offen"}</Chip>
                  ) : null}
                </div>
              </div>
            </Card.Content>
            {service.needsAppointment && app.status === "genehmigt" ? (
              <Card.Footer>
                <ButtonLink fullWidth href="/konto/termine" size="sm"><Calendar />Abholtermin buchen</ButtonLink>
              </Card.Footer>
            ) : null}
          </Card>
          {open ? <WithdrawButton applicationId={app.id} /> : null}
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

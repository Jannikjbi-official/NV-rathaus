import type { Metadata } from "next";
import NextLink from "next/link";
import { and, asc, count, desc, eq, gt, inArray } from "drizzle-orm";
import { ArrowRight, Calendar, ChevronRight, FileText, Receipt } from "@gravity-ui/icons";
import { Alert, Card, Link, Separator } from "@heroui/react";

import { StatusChip } from "@/components/applications/parts";
import { DocumentThumb } from "@/components/documents/document-viewer";
import { ButtonLink } from "@/components/ui/button-link";
import { db } from "@/db";
import { applications, appointments, appointmentSlots, departments, services } from "@/db/schema";
import { referenceSlug } from "@/lib/applications";
import { getDocumentsForCitizen } from "@/lib/document-render";
import { formatDateTime, formatRelative } from "@/lib/format";
import { OPEN_STATUSES } from "@/lib/status";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Bürgerkonto" };

export default async function KontoPage({ searchParams }: { searchParams: Promise<{ willkommen?: string }> }) {
  const [viewer, { willkommen }] = await Promise.all([requireResident("/konto"), searchParams]);
  const cid = viewer.citizen.id;

  const [recent, [{ n: openCount }], docs, [nextAppointment], popular] = await Promise.all([
    db
      .select({ reference: applications.reference, status: applications.status, updatedAt: applications.updatedAt, title: services.title, department: departments.name })
      .from(applications)
      .innerJoin(services, eq(applications.serviceId, services.id))
      .innerJoin(departments, eq(applications.departmentId, departments.id))
      .where(eq(applications.citizenId, cid))
      .orderBy(desc(applications.updatedAt))
      .limit(5),
    db.select({ n: count() }).from(applications).where(and(eq(applications.citizenId, cid), inArray(applications.status, OPEN_STATUSES))),
    getDocumentsForCitizen(cid),
    db
      .select({ startsAt: appointmentSlots.startsAt, purpose: appointments.purpose, department: departments.name })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .innerJoin(departments, eq(appointmentSlots.departmentId, departments.id))
      .where(and(eq(appointments.citizenId, cid), eq(appointments.status, "gebucht"), gt(appointmentSlots.startsAt, new Date())))
      .orderBy(asc(appointmentSlots.startsAt))
      .limit(1),
    db.select({ slug: services.slug, title: services.title }).from(services).where(eq(services.isFeatured, true)).orderBy(services.sortOrder).limit(6),
  ]);
  const validDocs = docs.filter((d) => d.state.tone === "success");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Moin, {viewer.citizen.firstName}.</h1>
        <p className="mt-1 text-muted">Ihr Bürgerkonto bei der Stadt Nordverkehr.</p>
      </div>

      {willkommen ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Ihre Meldedaten sind gespeichert</Alert.Title>
            <Alert.Description>Ihre Bürgernummer lautet {viewer.citizen.citizenNumber}. Als Nächstes können Sie zum Beispiel Ihren Personalausweis beantragen.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat href="/konto/antraege" icon={<Receipt />} label="Offene Anträge" value={String(openCount)} />
        <Stat href="/konto/dokumente" icon={<FileText />} label="Gültige Dokumente" value={String(validDocs.length)} />
        <Stat
          href="/konto/termine"
          icon={<Calendar />}
          label="Nächster Termin"
          value={nextAppointment ? formatDateTime(nextAppointment.startsAt) : "keiner"}
          small={!!nextAppointment}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Aktuelle Anträge</Card.Title>
            <Link className="text-sm" href="/konto/antraege">Alle<Link.Icon><ArrowRight /></Link.Icon></Link>
          </Card.Header>
          <Card.Content className="gap-0">
            {recent.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-sm text-muted">Sie haben noch keine Anträge gestellt.</p>
                <ButtonLink href="/leistungen" size="sm">Leistung auswählen</ButtonLink>
              </div>
            ) : (
              recent.map((r, i) => (
                <div key={r.reference}>
                  {i > 0 ? <Separator /> : null}
                  <NextLink className="flex items-center gap-3 py-3" href={`/konto/antraege/${referenceSlug(r.reference)}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted">{r.reference} · aktualisiert {formatRelative(r.updatedAt)}</p>
                    </div>
                    <StatusChip status={r.status} />
                    <ChevronRight className="size-4 text-muted" />
                  </NextLink>
                </div>
              ))
            )}
          </Card.Content>
        </Card>

        <div className="flex flex-col gap-4">
          {validDocs[0] ? (
            <NextLink className="rounded-2xl" href={`/konto/dokumente/${validDocs[0].number}`}>
              <DocumentThumb doc={validDocs[0]} />
            </NextLink>
          ) : null}
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Häufig beantragt</Card.Title>
            </Card.Header>
            <Card.Content className="gap-1.5">
              {popular.map((p) => (
                <Link key={p.slug} className="text-sm" href={`/konto/antraege/neu/${p.slug}`}>{p.title}</Link>
              ))}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ href, icon, label, value, small }: { href: string; icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <NextLink className="group rounded-3xl" href={href}>
      <Card className="h-full flex-row items-center gap-4 transition-shadow group-hover:shadow-overlay">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent [&>svg]:size-5">{icon}</span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className={small ? "text-sm font-semibold" : "text-2xl font-semibold tabular-nums"}>{value}</p>
        </div>
      </Card>
    </NextLink>
  );
}

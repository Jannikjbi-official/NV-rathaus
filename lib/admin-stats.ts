import "server-only";

import { and, asc, count, desc, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  applicationEvents,
  applications,
  appointments,
  appointmentSlots,
  citizens,
  departments,
  documents,
  services,
  users,
} from "@/db/schema";

import { OPEN_STATUSES } from "./status";

const NONE = ["00000000-0000-0000-0000-000000000000"];
const scope = (ids: string[]) => (ids.length ? ids : NONE);
const DAY = 86400000;

/** Berlin-Tagesgrenzen für "heute". */
function todayRange() {
  const now = new Date();
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const offset = berlin.getTime() - now.getTime();
  const start = new Date(berlin);

  start.setHours(0, 0, 0, 0);

  return { start: new Date(start.getTime() - offset), end: new Date(start.getTime() - offset + DAY) };
}

export type QueueItem = {
  reference: string;
  status: (typeof OPEN_STATUSES)[number];
  service: string;
  department: string;
  citizen: string;
  submittedAt: Date;
  dueAt: Date;
  overdue: boolean;
  assignee: string | null;
};

/** Offene Anträge, älteste zuerst, mit Fälligkeit aus der Bearbeitungszeit der Leistung. */
export async function getQueue(departmentIds: string[], opts: { limit?: number; assigneeId?: string } = {}): Promise<QueueItem[]> {
  const rows = await db
    .select({
      reference: applications.reference,
      status: applications.status,
      submittedAt: applications.submittedAt,
      processingDays: services.processingDays,
      service: services.title,
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
    .where(
      and(
        inArray(applications.departmentId, scope(departmentIds)),
        inArray(applications.status, OPEN_STATUSES),
        opts.assigneeId ? eq(applications.assigneeId, opts.assigneeId) : undefined,
      ),
    )
    .orderBy(asc(applications.submittedAt))
    .limit(opts.limit ?? 50);

  const now = Date.now();

  return rows.map((r) => {
    const dueAt = new Date(r.submittedAt.getTime() + Math.max(1, r.processingDays) * DAY);

    return {
      reference: r.reference,
      status: r.status as QueueItem["status"],
      service: r.service,
      department: r.department,
      citizen: `${r.firstName} ${r.lastName}`,
      submittedAt: r.submittedAt,
      dueAt,
      overdue: r.status !== "rueckfrage" && dueAt.getTime() < now,
      assignee: r.assignee,
    };
  });
}

/** Kennzahlen für eine Menge von Ämtern. */
export async function getKpis(departmentIds: string[]) {
  const ids = scope(departmentIds);
  const since30 = new Date(Date.now() - 30 * DAY);
  const { start, end } = todayRange();

  const [byStatus, [decided], [docs], [todayAppts], queue] = await Promise.all([
    db
      .select({ status: applications.status, n: count() })
      .from(applications)
      .where(inArray(applications.departmentId, ids))
      .groupBy(applications.status),
    db
      .select({
        n: count(),
        avgHours: sql<number>`coalesce(avg(extract(epoch from (${applications.decidedAt} - ${applications.submittedAt})) / 3600), 0)`,
      })
      .from(applications)
      .where(and(inArray(applications.departmentId, ids), gte(applications.decidedAt, since30), ne(applications.status, "zurueckgezogen"))),
    db
      .select({ n: count() })
      .from(documents)
      .where(and(inArray(documents.departmentId, ids), gte(documents.issuedAt, since30), isNull(documents.revokedAt))),
    db
      .select({ n: count() })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .where(
        and(
          inArray(appointmentSlots.departmentId, ids),
          eq(appointments.status, "gebucht"),
          gte(appointmentSlots.startsAt, start),
          lt(appointmentSlots.startsAt, end),
        ),
      ),
    getQueue(departmentIds, { limit: 500 }),
  ]);

  const of = (s: string) => byStatus.find((b) => b.status === s)?.n ?? 0;

  return {
    open: of("eingereicht") + of("in_bearbeitung") + of("rueckfrage"),
    fresh: of("eingereicht"),
    inProgress: of("in_bearbeitung"),
    waiting: of("rueckfrage"),
    overdue: queue.filter((q) => q.overdue).length,
    decided30: decided.n,
    avgDays: decided.n ? Number(decided.avgHours) / 24 : null,
    documents30: docs.n,
    appointmentsToday: todayAppts.n,
  };
}

export type DailyPoint = { day: string; label: string; received: number; decided: number };

/** Eingegangene und erledigte Anträge je Tag (Ortszeit Berlin). */
export async function getDaily(departmentIds: string[], days = 14): Promise<DailyPoint[]> {
  const ids = scope(departmentIds);
  const since = new Date(Date.now() - days * DAY);
  const dayOf = (col: typeof applications.submittedAt | typeof applications.decidedAt) =>
    sql<string>`to_char(${col} at time zone 'Europe/Berlin', 'YYYY-MM-DD')`;

  const [received, decided] = await Promise.all([
    db
      .select({ day: dayOf(applications.submittedAt), n: count() })
      .from(applications)
      .where(and(inArray(applications.departmentId, ids), gte(applications.submittedAt, since)))
      .groupBy(dayOf(applications.submittedAt)),
    db
      .select({ day: dayOf(applications.decidedAt), n: count() })
      .from(applications)
      .where(and(inArray(applications.departmentId, ids), gte(applications.decidedAt, since)))
      .groupBy(dayOf(applications.decidedAt)),
  ]);

  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });
  const label = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * DAY);
    const day = fmt.format(date);

    return {
      day,
      label: label.format(date),
      received: received.find((r) => r.day === day)?.n ?? 0,
      decided: decided.find((r) => r.day === day)?.n ?? 0,
    };
  });
}

/** Heutige Termine. */
export async function getTodayAppointments(departmentIds: string[]) {
  const { start, end } = todayRange();

  return db
    .select({
      id: appointments.id,
      startsAt: appointmentSlots.startsAt,
      purpose: appointments.purpose,
      status: appointments.status,
      department: departments.name,
      firstName: citizens.firstName,
      lastName: citizens.lastName,
      citizenNumber: citizens.citizenNumber,
    })
    .from(appointments)
    .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
    .innerJoin(departments, eq(appointmentSlots.departmentId, departments.id))
    .innerJoin(citizens, eq(appointments.citizenId, citizens.id))
    .where(
      and(
        inArray(appointmentSlots.departmentId, scope(departmentIds)),
        inArray(appointments.status, ["gebucht", "erschienen"]),
        gte(appointmentSlots.startsAt, start),
        lt(appointmentSlots.startsAt, end),
      ),
    )
    .orderBy(asc(appointmentSlots.startsAt));
}

/** Letzte Aktivitäten (ohne interne Notizen anderer Ämter). */
export async function getRecentActivity(departmentIds: string[], limit = 8) {
  return db
    .select({
      type: applicationEvents.type,
      toStatus: applicationEvents.toStatus,
      createdAt: applicationEvents.createdAt,
      author: users.displayName,
      reference: applications.reference,
      service: services.title,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
    .innerJoin(services, eq(applications.serviceId, services.id))
    .leftJoin(users, eq(applicationEvents.authorId, users.id))
    .where(inArray(applications.departmentId, scope(departmentIds)))
    .orderBy(desc(applicationEvents.createdAt))
    .limit(limit);
}

/** Meistgenutzte Leistungen der letzten 30 Tage. */
export async function getTopServices(departmentIds: string[], limit = 5) {
  return db
    .select({ title: services.title, slug: services.slug, n: count() })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .where(and(inArray(applications.departmentId, scope(departmentIds)), gte(applications.submittedAt, new Date(Date.now() - 30 * DAY))))
    .groupBy(services.title, services.slug)
    .orderBy(desc(count()))
    .limit(limit);
}

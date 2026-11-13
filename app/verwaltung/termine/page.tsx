import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { Card, Chip, Separator } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { AppointmentActions, SlotCreator } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { appointments, appointmentSlots, citizens, departments } from "@/db/schema";
import { formatTime } from "@/lib/format";
import { requireStaff } from "@/lib/viewer";

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(d);

export default async function AdminAppointmentsPage() {
  const viewer = await requireStaff("/verwaltung/termine");
  const ids = viewer.staffDepartments.map((d) => d.id);
  const since = new Date(Date.now() - 6 * 3600000);
  const rows = ids.length
    ? await db
        .select({
          id: appointments.id,
          status: appointments.status,
          purpose: appointments.purpose,
          startsAt: appointmentSlots.startsAt,
          department: departments.name,
          firstName: citizens.firstName,
          lastName: citizens.lastName,
          citizenNumber: citizens.citizenNumber,
        })
        .from(appointments)
        .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
        .innerJoin(departments, eq(appointmentSlots.departmentId, departments.id))
        .innerJoin(citizens, eq(appointments.citizenId, citizens.id))
        .where(and(inArray(appointmentSlots.departmentId, ids), gt(appointmentSlots.startsAt, since), inArray(appointments.status, ["gebucht", "erschienen"])))
        .orderBy(asc(appointmentSlots.startsAt))
    : [];

  const days = new Map<string, typeof rows>();

  for (const r of rows) days.set(dayLabel(r.startsAt), [...(days.get(dayLabel(r.startsAt)) ?? []), r]);

  return (
    <>
      <PageHeader description="Gebuchte Termine Ihrer Ämter und freie Zeitfenster." title="Termine" />
      <div className="flex flex-col gap-6">
        {days.size === 0 ? (
          <Card className="py-10 text-center"><Card.Description>Keine anstehenden Termine.</Card.Description></Card>
        ) : (
          [...days.entries()].map(([day, list]) => (
            <Card key={day}>
              <Card.Header>
                <Card.Title className="text-base">{day}</Card.Title>
              </Card.Header>
              <Card.Content className="gap-0">
                {list.map((a, i) => (
                  <div key={a.id}>
                    {i > 0 ? <Separator /> : null}
                    <div className="flex flex-wrap items-center gap-4 py-3">
                      <span className="w-14 font-semibold tabular-nums">{formatTime(a.startsAt)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.firstName} {a.lastName} <span className="font-mono text-xs text-muted">{a.citizenNumber}</span></p>
                        <p className="text-xs text-muted">{a.purpose} · {a.department}</p>
                      </div>
                      {a.status === "erschienen" ? <Chip color="success" size="sm" variant="soft">erschienen</Chip> : <AppointmentActions id={a.id} />}
                    </div>
                  </div>
                ))}
              </Card.Content>
            </Card>
          ))
        )}
        <SlotCreator departments={viewer.staffDepartments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { and, asc, count, eq, gt, inArray, sql } from "drizzle-orm";
import { Card } from "@heroui/react";

import { AppointmentBooking, BookingList } from "@/components/konto/appointment-booking";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { appointments, appointmentSlots, departments } from "@/db/schema";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Termine" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ anliegen?: string }> }) {
  const [viewer, { anliegen }] = await Promise.all([requireResident("/konto/termine"), searchParams]);
  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 86400000);

  const [booked, slots, mine] = await Promise.all([
    db
      .select({ slotId: appointments.slotId, n: count() })
      .from(appointments)
      .where(inArray(appointments.status, ["gebucht", "erschienen"]))
      .groupBy(appointments.slotId),
    db
      .select({ id: appointmentSlots.id, departmentId: appointmentSlots.departmentId, startsAt: appointmentSlots.startsAt, capacity: appointmentSlots.capacity, department: departments.name })
      .from(appointmentSlots)
      .innerJoin(departments, eq(appointmentSlots.departmentId, departments.id))
      .where(and(gt(appointmentSlots.startsAt, now), sql`${appointmentSlots.startsAt} < ${horizon}`))
      .orderBy(asc(appointmentSlots.startsAt)),
    db
      .select({ id: appointments.id, purpose: appointments.purpose, status: appointments.status, startsAt: appointmentSlots.startsAt, department: departments.name, address: departments.address })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .innerJoin(departments, eq(appointmentSlots.departmentId, departments.id))
      .where(and(eq(appointments.citizenId, viewer.citizen.id), gt(appointmentSlots.startsAt, now), eq(appointments.status, "gebucht")))
      .orderBy(asc(appointmentSlots.startsAt)),
  ]);

  const used = new Map(booked.map((b) => [b.slotId, b.n]));
  const open = slots.map((s) => ({ ...s, free: s.capacity - (used.get(s.id) ?? 0) })).filter((s) => s.free > 0);
  const depts = [...new Map(open.map((s) => [s.departmentId, { id: s.departmentId, name: s.department }])).values()];

  return (
    <>
      <PageHeader description="Persönliche Termine im Rathaus, etwa zur Abholung von Ausweisen oder für Trauungen." title="Termine" />
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="text-base">Ihre Termine</Card.Title>
          </Card.Header>
          <Card.Content>
            <BookingList bookings={mine} />
          </Card.Content>
        </Card>
        {depts.length > 0 ? (
          <AppointmentBooking
            defaultPurpose={anliegen}
            departments={depts}
            slots={open.map(({ id, departmentId, startsAt, free }) => ({ id, departmentId, startsAt, free }))}
          />
        ) : (
          <Card className="py-8 text-center">
            <Card.Description>Derzeit sind keine freien Termine verfügbar.</Card.Description>
          </Card>
        )}
      </div>
    </>
  );
}

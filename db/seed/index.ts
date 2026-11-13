/**
 * Grunddaten für das Rathaus. Ämter und Leistungen werden per Slug
 * aktualisiert (Inhalte aus dem Code gewinnen), Formulare nur beim ersten
 * Anlegen gesetzt, damit Änderungen aus dem Formular-Builder erhalten bleiben.
 * Nachrichten, Verkehr, Termine und Stellen nur, wenn die Tabellen leer sind.
 * Aufruf: pnpm db:seed
 */
import { count, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentSlots,
  cityEvents,
  departments,
  jobs,
  posts,
  services,
  trafficNotices,
} from "@/db/schema";

import { EVENTS, JOBS, POSTS, TRAFFIC } from "./content";
import { DEPARTMENTS } from "./departments";
import { SERVICES } from "./services";

async function main() {
  const deptIds = new Map<string, string>();

  for (const d of DEPARTMENTS) {
    const [row] = await db
      .insert(departments)
      .values({ ...d, openingHours: d.openingHours })
      .onConflictDoUpdate({
        target: departments.slug,
        set: {
          name: d.name,
          summary: d.summary,
          description: d.description,
          icon: d.icon,
          address: d.address,
          phone: d.phone,
          email: d.email,
          sortOrder: d.sortOrder,
        },
      })
      .returning({ id: departments.id });

    deptIds.set(d.slug, row.id);
  }
  console.log(`Ämter: ${DEPARTMENTS.length}`);

  let order = 0;

  for (const s of SERVICES) {
    const values = {
      slug: s.slug,
      departmentId: deptIds.get(s.department)!,
      title: s.title,
      summary: s.summary,
      description: s.description,
      lifeEvent: s.lifeEvent,
      requirements: s.requirements ?? [],
      documentsNeeded: s.documentsNeeded ?? [],
      keywords: s.keywords ?? [],
      feeCents: s.fee,
      feeNote: s.feeNote ?? null,
      processingDays: s.processingDays,
      fields: s.fields,
      issuesDocument: s.issuesDocument ?? null,
      documentValidityYears: s.documentValidityYears ?? null,
      needsAppointment: s.needsAppointment ?? false,
      isFeatured: s.isFeatured ?? false,
      sortOrder: order++,
    };
    const { fields: _fields, ...withoutFields } = values;

    await db
      .insert(services)
      .values(values)
      .onConflictDoUpdate({ target: services.slug, set: { ...withoutFields, updatedAt: new Date() } });
  }
  console.log(`Leistungen: ${SERVICES.length}`);

  const [{ n: postCount }] = await db.select({ n: count() }).from(posts);

  if (postCount === 0) {
    await db.insert(posts).values(
      POSTS.map((p) => ({
        ...p,
        imageUrl: p.imageUrl ?? null,
        gazetteNumber: p.gazetteNumber ?? null,
        departmentId: p.department ? deptIds.get(p.department)! : null,
        isFeatured: p.isFeatured ?? false,
      })),
    );
    await db.insert(trafficNotices).values(TRAFFIC);
    await db.insert(cityEvents).values(EVENTS);
    console.log(`Meldungen: ${POSTS.length}, Verkehr: ${TRAFFIC.length}, Veranstaltungen: ${EVENTS.length}`);
  }

  const [{ n: jobCount }] = await db.select({ n: count() }).from(jobs);

  if (jobCount === 0) {
    await db.insert(jobs).values(
      JOBS.map(({ department, ...j }) => ({
        ...j,
        departmentId: department ? deptIds.get(department)! : null,
      })),
    );
    console.log(`Stellen: ${JOBS.length}`);
  }

  const [{ n: slotCount }] = await db
    .select({ n: count() })
    .from(appointmentSlots)
    .where(sql`${appointmentSlots.startsAt} > now()`);

  if (slotCount === 0) {
    const slots: (typeof appointmentSlots.$inferInsert)[] = [];
    const withSlots = ["buergeramt", "standesamt", "strassenverkehrsamt", "gewerbeamt"];

    for (let day = 1; day <= 14; day++) {
      const base = new Date();

      base.setDate(base.getDate() + day);
      if (base.getDay() === 0) continue;

      for (const slug of withSlots) {
        for (const hour of [18, 19, 20, 21]) {
          for (const minute of [0, 30]) {
            const startsAt = new Date(base);

            startsAt.setHours(hour, minute, 0, 0);
            slots.push({ departmentId: deptIds.get(slug)!, startsAt, durationMinutes: 30, capacity: 2 });
          }
        }
      }
    }
    for (let i = 0; i < slots.length; i += 200) {
      await db.insert(appointmentSlots).values(slots.slice(i, i + 200));
    }
    console.log(`Terminslots: ${slots.length}`);
  }
}

main().then(() => console.log("Seed fertig."));

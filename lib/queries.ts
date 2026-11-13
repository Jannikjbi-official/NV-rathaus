import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { cityEvents, departments, jobs, posts, services, trafficNotices } from "@/db/schema";

/** Alle aktiven Leistungen mit Amt, für Suche und Übersichten. */
export const getServiceIndex = cache(async () =>
  db
    .select({
      id: services.id,
      slug: services.slug,
      title: services.title,
      summary: services.summary,
      lifeEvent: services.lifeEvent,
      keywords: services.keywords,
      feeCents: services.feeCents,
      isOnline: services.isOnline,
      isFeatured: services.isFeatured,
      department: departments.name,
      departmentSlug: departments.slug,
    })
    .from(services)
    .innerJoin(departments, eq(services.departmentId, departments.id))
    .where(eq(services.isActive, true))
    .orderBy(asc(services.title)),
);

export const getDepartments = cache(async () => db.select().from(departments).orderBy(asc(departments.sortOrder)));

export const getLatestPosts = cache(async (limit = 10) =>
  db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(limit),
);

export const getActiveTraffic = cache(async () =>
  db.select().from(trafficNotices).where(eq(trafficNotices.isActive, true)).orderBy(asc(trafficNotices.severity)),
);

export const getUpcomingEvents = cache(async (limit = 5) =>
  db.select().from(cityEvents).where(gt(cityEvents.startsAt, new Date())).orderBy(asc(cityEvents.startsAt)).limit(limit),
);

export const getOpenJobs = cache(async () =>
  db.select().from(jobs).where(and(eq(jobs.isOpen, true))).orderBy(asc(jobs.deadline), asc(jobs.title)),
);

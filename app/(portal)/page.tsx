import { and, count, desc, eq, inArray, ne } from "drizzle-orm";

import { HomeView } from "@/components/portal/home/home-view";
import { db } from "@/db";
import { applications, departments, posts, services } from "@/db/schema";
import { openingStatus } from "@/lib/format";
import { getActiveTraffic, getDepartments, getOpenJobs, getUpcomingEvents } from "@/lib/queries";
import { OPEN_STATUSES } from "@/lib/status";
import { getViewer } from "@/lib/viewer";

export default async function HomePage() {
  const [viewer, stage, news, notices, featured, [{ n: serviceCount }], traffic, events, depts, jobs] = await Promise.all([
    getViewer(),
    db.select().from(posts).where(eq(posts.isFeatured, true)).orderBy(desc(posts.publishedAt)).limit(4),
    db.select().from(posts).where(ne(posts.kind, "bekanntmachung")).orderBy(desc(posts.publishedAt)).limit(3),
    db.select().from(posts).where(eq(posts.kind, "bekanntmachung")).orderBy(desc(posts.publishedAt)).limit(4),
    db
      .select({
        slug: services.slug,
        title: services.title,
        feeCents: services.feeCents,
        lifeEvent: services.lifeEvent,
        department: departments.name,
        icon: departments.icon,
      })
      .from(services)
      .innerJoin(departments, eq(services.departmentId, departments.id))
      .where(and(eq(services.isFeatured, true), eq(services.isActive, true)))
      .orderBy(services.sortOrder)
      .limit(10),
    db.select({ n: count() }).from(services).where(eq(services.isActive, true)),
    getActiveTraffic(),
    getUpcomingEvents(4),
    getDepartments(),
    getOpenJobs(),
  ]);

  let openApplications = 0;

  if (viewer?.citizen) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(applications)
      .where(and(eq(applications.citizenId, viewer.citizen.id), inArray(applications.status, OPEN_STATUSES)));

    openApplications = n;
  }

  return (
    <HomeView
      data={{
        stage,
        news,
        notices,
        services: featured,
        serviceCount,
        traffic: traffic.slice(0, 4),
        events,
        departments: depts.map((d) => ({
          slug: d.slug,
          name: d.name,
          address: d.address,
          phone: d.phone,
          status: openingStatus(d.openingHours),
        })),
        jobs: jobs.slice(0, 3),
        jobCount: jobs.length,
        account: viewer ? { name: viewer.name, openApplications } : null,
      }}
    />
  );
}

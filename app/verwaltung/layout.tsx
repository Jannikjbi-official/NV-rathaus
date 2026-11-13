import type { Metadata } from "next";
import { and, count, inArray } from "drizzle-orm";

import { AdminShell } from "@/components/verwaltung/admin-shell";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireStaff } from "@/lib/viewer";

export const metadata: Metadata = { title: "Verwaltung", robots: { index: false } };

export default async function VerwaltungLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireStaff();
  const deptIds = viewer.staffDepartments.map((d) => d.id);
  const [{ n }] = deptIds.length
    ? await db
        .select({ n: count() })
        .from(applications)
        .where(and(inArray(applications.departmentId, deptIds), inArray(applications.status, ["eingereicht"])))
    : [{ n: 0 }];

  return (
    <AdminShell
      avatarUrl={viewer.user.avatarUrl}
      departments={viewer.staffDepartments.map((d) => d.name)}
      inboxCount={n}
      isAdmin={viewer.isAdmin}
      name={viewer.name}
    >
      {children}
    </AdminShell>
  );
}

import { and, count, eq, inArray } from "drizzle-orm";

import { KontoSidebar } from "@/components/konto/konto-sidebar";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { OPEN_STATUSES } from "@/lib/status";
import { requireCitizen } from "@/lib/viewer";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireCitizen();
  let openCount = 0;

  if (viewer.citizen) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(applications)
      .where(and(eq(applications.citizenId, viewer.citizen.id), inArray(applications.status, OPEN_STATUSES)));

    openCount = n;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
      <KontoSidebar
        avatarUrl={viewer.user.avatarUrl}
        citizenNumber={viewer.citizen?.citizenNumber ?? null}
        isStaff={viewer.isStaff}
        name={viewer.name}
        openCount={openCount}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

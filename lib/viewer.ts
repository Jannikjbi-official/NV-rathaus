import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { citizens, departments, users } from "@/db/schema";

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

/** Wer ist angemeldet, und was darf die Person? Einmal pro Request. */
export const getViewer = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) return null;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user) return null;

  const [[citizen], allDepartments] = await Promise.all([
    db.select().from(citizens).where(eq(citizens.userId, id)).limit(1),
    db
      .select({ id: departments.id, slug: departments.slug, name: departments.name, roleId: departments.discordRoleId })
      .from(departments)
      .orderBy(asc(departments.sortOrder)),
  ]);

  const staffDepartments = user.isAdmin
    ? allDepartments
    : allDepartments.filter((d) => d.roleId && user.discordRoles.includes(d.roleId));

  return {
    user,
    citizen: citizen ?? null,
    isCitizen: user.isCitizen || user.isAdmin,
    isAdmin: user.isAdmin,
    isStaff: staffDepartments.length > 0,
    staffDepartments: staffDepartments.map(({ roleId: _r, ...d }) => d),
    name: citizen ? `${citizen.firstName} ${citizen.lastName}` : (user.displayName ?? user.username),
  };
});

/** Für das Bürgerkonto: angemeldet und Bürger-Rolle. */
export async function requireCitizen(from = "/konto") {
  const viewer = await getViewer();

  if (!viewer) redirect(`/anmelden?callbackUrl=${encodeURIComponent(from)}`);
  if (!viewer.isCitizen) redirect("/kein-zugang?grund=rolle");

  return viewer;
}

/** Wie requireCitizen, zusätzlich müssen Meldedaten vorliegen. */
export async function requireResident(from = "/konto") {
  const viewer = await requireCitizen(from);

  if (!viewer.citizen) redirect(`/konto/meldedaten?weiter=${encodeURIComponent(from)}`);

  return { ...viewer, citizen: viewer.citizen };
}

/** Für die Verwaltung: mindestens ein Amt oder Admin. */
export async function requireStaff(from = "/verwaltung") {
  const viewer = await getViewer();

  if (!viewer) redirect(`/anmelden?callbackUrl=${encodeURIComponent(from)}`);
  if (!viewer.isStaff) redirect("/kein-zugang?grund=verwaltung");

  return viewer;
}

export async function requireAdmin(from = "/verwaltung") {
  const viewer = await requireStaff(from);

  if (!viewer.isAdmin) redirect("/verwaltung?hinweis=nur-admin");

  return viewer;
}

export function canHandle(viewer: Viewer, departmentId: string) {
  return viewer.isAdmin || viewer.staffDepartments.some((d) => d.id === departmentId);
}

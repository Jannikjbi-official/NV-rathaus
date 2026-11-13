import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

/** Nächstes Aktenzeichen, z. B. "AZ 2026-004812". */
export async function nextReference() {
  const result = await db.execute<{ n: string }>(sql`select nextval('application_reference_seq') as n`);
  const n = Number(result.rows[0].n);

  return `AZ ${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Pfad-Segment für ein Aktenzeichen ("AZ 2026-004812" → "2026-004812"). */
export const referenceSlug = (reference: string) => reference.replace(/^AZ\s*/, "");
export const referenceFromSlug = (slug: string) => `AZ ${decodeURIComponent(slug)}`;

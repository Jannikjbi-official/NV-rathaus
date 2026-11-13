import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Lichtbild für Dokumente: das Discord-Avatar des Bürgers, über die eigene
 * Domain ausgeliefert. So kann der Browser es beim PNG/PDF-Export einbetten
 * (gleiche Herkunft, kein CORS-Problem).
 */
export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user] = await db.select({ avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user?.avatarUrl?.startsWith("https://cdn.discordapp.com/")) return new Response(null, { status: 404 });

  const res = await fetch(user.avatarUrl.replace(/size=\d+/, "size=512"), { next: { revalidate: 3600 } });

  if (!res.ok) return new Response(null, { status: 404 });

  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

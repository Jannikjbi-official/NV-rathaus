import { type NextRequest } from "next/server";
import { redirect, unstable_rethrow } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { safeRedirect } from "@/lib/redirect";

/**
 * Einstieg für das Tablet im Spiel:
 *   /api/fivem/anmelden?token=…&weiter=/konto
 * Meldet die Person mit ihrer Discord-ID an und leitet dann weiter.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token = params.get("token") ?? "";
  const target = safeRedirect(params.get("weiter"));

  let failure: string | null = null;

  try {
    await signIn("fivem", { token, redirectTo: target });
  } catch (error) {
    unstable_rethrow(error);
    failure = error instanceof AuthError && error.type === "AccessDenied" ? "AccessDenied" : "FiveM";
  }

  redirect(`/anmelden?error=${failure ?? "FiveM"}&callbackUrl=${encodeURIComponent(target)}`);
}

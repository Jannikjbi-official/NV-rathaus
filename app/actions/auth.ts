"use server";

import { signIn, signOut } from "@/auth";
import { safeRedirect } from "@/lib/redirect";

export async function signInWithDiscord(callbackUrl?: string) {
  await signIn("discord", { redirectTo: safeRedirect(callbackUrl) });
}

export async function signInDev(persona: string, callbackUrl?: string) {
  await signIn("dev", { persona, redirectTo: safeRedirect(callbackUrl) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

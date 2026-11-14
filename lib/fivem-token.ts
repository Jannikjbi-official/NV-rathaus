import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Anmeldung aus dem Spiel (Tablet auf dem FiveM-Server).
 *
 * Der Spielserver kennt die Discord-ID des Spielers und signiert sie mit dem
 * gemeinsamen Geheimnis FIVEM_LOGIN_SECRET (HMAC-SHA256). Der Token lebt nur
 * wenige Sekunden und wird höchstens einmal angenommen.
 *
 * Aufbau: base64url(JSON {v, sub, exp, n}) + "." + base64url(HMAC(payload))
 */

const MAX_LIFETIME_S = 120;

type Payload = { v: number; sub: string; exp: number; n: string };

/** Bereits benutzte Nonces dieser Instanz (zusätzlich zur kurzen Laufzeit). */
const usedNonces = new Map<string, number>();

function forgetExpired(now: number) {
  for (const [nonce, exp] of usedNonces) if (exp < now) usedNonces.delete(nonce);
}

export const fivemLoginEnabled = (process.env.FIVEM_LOGIN_SECRET ?? "").length >= 32;

/** Gibt die Discord-ID zurück, wenn der Token echt, frisch und unbenutzt ist. */
export function verifyFivemToken(token: unknown): string | null {
  const secret = process.env.FIVEM_LOGIN_SECRET ?? "";

  if (!fivemLoginEnabled || typeof token !== "string" || token.length > 512) return null;

  const [body, signature, ...rest] = token.split(".");

  if (!body || !signature || rest.length) return null;

  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(signature, "base64url");

  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let payload: Payload;

  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload?.v !== 1 || typeof payload.exp !== "number" || typeof payload.n !== "string") return null;
  if (payload.exp < now || payload.exp > now + MAX_LIFETIME_S) return null;
  if (typeof payload.sub !== "string" || !/^\d{17,20}$/.test(payload.sub)) return null;

  forgetExpired(now);
  if (usedNonces.has(payload.n)) return null;
  usedNonces.set(payload.n, payload.exp);

  return payload.sub;
}

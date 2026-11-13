/**
 * Macht aus einer Rücksprungadresse (auch absolut, wie Auth.js sie liefert)
 * einen Pfad auf dieser Seite. Fremde Domains werden so nie angesprungen.
 */
export function safeRedirect(url: string | undefined | null, fallback = "/konto") {
  if (!url) return fallback;
  try {
    const u = new URL(url, "http://local");
    const path = `${u.pathname}${u.search}`;

    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/anmelden") ? path : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Einbetten nur durch die eigene Seite und das Tablet im Spiel
 * (FiveM-NUI der Ressource nv-tablet, Herkunft https://cfx-nui-nv-tablet).
 *
 * Achtung: Der Ressourcenname darf keinen Unterstrich enthalten. Chromium verwirft
 * Hosts mit "_" in CSP-Quellen stillschweigend, dann bliebe nur 'self' übrig.
 */
const frameAncestors = ["'self'", "https://cfx-nui-nv-tablet"].join(" ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
    ];
  },
};

export default nextConfig;

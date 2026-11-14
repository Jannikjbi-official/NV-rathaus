/**
 * Einbetten nur durch die eigene Seite und das Tablet im Spiel
 * (FiveM-NUI der Ressource nv-tablet, Herkunft https://cfx-nui-nv-tablet).
 *
 * frame-ancestors prüft jede übergeordnete Seite. In FiveM liegt über dem Tablet
 * noch die NUI-Root (nui://game/ui/root.html), sie muss deshalb mit erlaubt sein.
 * Andere Ressourcen (cfx-nui-…) können die Seite trotzdem nicht einbetten.
 *
 * Achtung: Der Ressourcenname darf keinen Unterstrich enthalten. Chromium verwirft
 * Hosts mit "_" in CSP-Quellen stillschweigend, dann bliebe nur 'self' übrig.
 */
const frameAncestors = ["'self'", "https://cfx-nui-nv-tablet", "nui://game"].join(" ");

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

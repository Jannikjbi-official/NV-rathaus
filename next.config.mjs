/**
 * Einbetten nur durch die eigene Seite und das Tablet im Spiel
 * (FiveM-NUI der Ressource nv_tablet, Herkunft https://cfx-nui-nv_tablet).
 */
const frameAncestors = ["'self'", "https://cfx-nui-nv_tablet", "nui://nv_tablet"].join(" ");

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

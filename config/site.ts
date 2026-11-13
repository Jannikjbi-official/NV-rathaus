export const siteConfig = {
  name: "Rathaus Nordverkehr",
  shortName: "Rathaus",
  description:
    "Das Stadtportal von Nordverkehr: Anträge, Bescheide, Amtsblatt, Termine und Stellen der Stadtverwaltung.",
  mainNav: [
    { label: "Bürgerservice", href: "/dienstleistungen" },
    { label: "Rathaus & Politik", href: "/rathaus" },
    { label: "Verkehr", href: "/verkehr" },
    { label: "Wirtschaft", href: "/wirtschaft" },
    { label: "Bauen & Wohnen", href: "/bauen-wohnen" },
    { label: "Soziales", href: "/soziales" },
    { label: "Sicherheit & Ordnung", href: "/ordnung" },
    { label: "Aktuelles", href: "/aktuelles" },
    { label: "Karriere", href: "/karriere" },
  ],
  links: {
    nordverkehr: "https://nordverkehr.xyz",
    rules: "https://nordverkehr.xyz/regeln",
    discord: "https://discord.gg/KrfKASTHDp",
    imprint: "https://nordverkehr.xyz/impressum",
    privacy: "https://nordverkehr.xyz/datenschutz",
  },
};

export type SiteConfig = typeof siteConfig;

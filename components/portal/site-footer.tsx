"use client";

import { Clock, Handset, MapPin } from "@gravity-ui/icons";
import { Link, Separator } from "@heroui/react";
import NextLink from "next/link";

import { BrandMark } from "@/components/brand/seal";
import { siteConfig } from "@/config/site";

const COLUMNS = [
  {
    title: "Bürgerservice",
    links: [
      ["Leistungen A–Z", "/leistungen"],
      ["Bürgerkonto", "/konto"],
      ["Termin buchen", "/konto/termine"],
      ["Dokument prüfen", "/pruefen"],
    ],
  },
  {
    title: "Stadt",
    links: [
      ["Aktuelles", "/aktuelles"],
      ["Amtsblatt", "/aktuelles?art=bekanntmachung"],
      ["Ämter & Kontakt", "/aemter"],
      ["Karriere", "/karriere"],
    ],
  },
  {
    title: "Nordverkehr",
    links: [
      ["nordverkehr.xyz", siteConfig.links.nordverkehr],
      ["Regelwerk", siteConfig.links.rules],
      ["Discord", siteConfig.links.discord],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-separator bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <NextLink className="w-fit rounded-xl" href="/">
            <BrandMark />
          </NextLink>
          <div className="flex flex-col gap-1.5 text-sm text-muted">
            <span className="flex items-center gap-2"><MapPin className="size-3.5" />Rathausmarkt 1</span>
            <span className="flex items-center gap-2"><Handset className="size-3.5" />Behördennummer 115</span>
            <span className="flex items-center gap-2"><Clock className="size-3.5" />Mo–Sa 16:00–23:00 Uhr</span>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{col.title}</span>
            {col.links.map(([label, href]) => (
              <Link key={href} className="w-fit text-sm font-normal text-muted" href={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Separator />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
        <span>Fiktive Stadtverwaltung im Roleplay-Projekt Nordverkehr · keine echte Behörde</span>
        <span className="flex gap-4">
          <Link className="text-xs font-normal text-muted" href={siteConfig.links.imprint}>Impressum</Link>
          <Link className="text-xs font-normal text-muted" href={siteConfig.links.privacy}>Datenschutz</Link>
        </span>
      </div>
    </footer>
  );
}

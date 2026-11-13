"use client";

import NextLink from "next/link";
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  FileText,
  Gear,
  LayoutList,
  Megaphone,
  Persons,
  Tray,
} from "@gravity-ui/icons";
import { Avatar, Chip, Separator } from "@heroui/react";

import { Seal } from "@/components/brand/seal";
import { SideNav } from "@/components/ui/side-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { initials } from "@/lib/format";

export function AdminShell({
  children,
  name,
  avatarUrl,
  departments,
  isAdmin,
  inboxCount,
}: {
  children: React.ReactNode;
  name: string;
  avatarUrl: string | null;
  departments: string[];
  isAdmin: boolean;
  inboxCount: number;
}) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="border-b border-separator bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-4">
          <Seal className="size-9 shrink-0 text-accent" />
          <div className="leading-none">
            <p className="text-sm font-bold">Rathaus</p>
            <p className="mt-1 text-xs text-muted">Verwaltungsportal</p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-5 overflow-y-auto px-3 py-4 lg:flex-1">
          <SideNav
            items={[
              { href: "/verwaltung", label: "Posteingang", icon: Tray, badge: inboxCount, exact: true },
              { href: "/verwaltung/antraege", label: "Alle Anträge", icon: LayoutList },
              { href: "/verwaltung/termine", label: "Termine", icon: Calendar },
              { href: "/verwaltung/buerger", label: "Melderegister", icon: Persons },
            ]}
            label="Bearbeitung"
          />
          <div>
            <p className="px-3 pb-1.5 text-xs font-medium text-muted">Inhalte</p>
            <SideNav
              items={[
                { href: "/verwaltung/leistungen", label: "Leistungen & Formulare", icon: FileText },
                { href: "/verwaltung/amtsblatt", label: "Aktuelles & Amtsblatt", icon: Megaphone },
                { href: "/verwaltung/stellen", label: "Stellenangebote", icon: Briefcase },
              ]}
              label="Inhalte"
            />
          </div>
          {isAdmin ? (
            <div>
              <p className="px-3 pb-1.5 text-xs font-medium text-muted">System</p>
              <SideNav items={[{ href: "/verwaltung/aemter", label: "Ämter & Rollen", icon: Gear }]} label="System" />
            </div>
          ) : null}
        </div>
        <Separator />
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {avatarUrl ? <Avatar.Image alt="" src={avatarUrl} /> : null}
              <Avatar.Fallback>{initials(name)}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {isAdmin ? (
                  <Chip color="accent" size="sm" variant="soft">Admin</Chip>
                ) : (
                  departments.slice(0, 2).map((d) => <Chip key={d} size="sm" variant="soft">{d}</Chip>)
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <NextLink className="flex items-center gap-2 text-sm text-muted hover:text-foreground" href="/">
              <ArrowLeft className="size-4" />
              Zum Stadtportal
            </NextLink>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
    </div>
  );
}

"use client";

import { Calendar, FileText, LayoutCellsLarge, Person, Plus, Receipt, ShieldCheck } from "@gravity-ui/icons";
import { Avatar, Card, Separator } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { SideNav } from "@/components/ui/side-nav";

export function KontoSidebar({
  name,
  citizenNumber,
  avatarUrl,
  openCount,
  isStaff,
}: {
  name: string;
  citizenNumber: string | null;
  avatarUrl: string | null;
  openCount: number;
  isStaff: boolean;
}) {
  return (
    <Card className="gap-4 lg:sticky lg:top-36">
      <div className="flex items-center gap-3">
        <Avatar>
          {avatarUrl ? <Avatar.Image alt="" src={avatarUrl} /> : null}
          <Avatar.Fallback>{name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate font-mono text-xs text-muted">{citizenNumber ?? "Meldedaten fehlen"}</p>
        </div>
      </div>
      <ButtonLink fullWidth href="/leistungen" size="sm">
        <Plus />
        Neuer Antrag
      </ButtonLink>
      <SideNav
        items={[
          { href: "/konto", label: "Übersicht", icon: LayoutCellsLarge, exact: true },
          { href: "/konto/antraege", label: "Anträge", icon: Receipt, badge: openCount },
          { href: "/konto/dokumente", label: "Dokumente", icon: FileText },
          { href: "/konto/termine", label: "Termine", icon: Calendar },
          { href: "/konto/meldedaten", label: "Meldedaten", icon: Person },
        ]}
        label="Bürgerkonto"
      />
      {isStaff ? (
        <>
          <Separator />
          <SideNav items={[{ href: "/verwaltung", label: "Zur Verwaltung", icon: ShieldCheck }]} label="Verwaltung" />
        </>
      ) : null}
    </Card>
  );
}

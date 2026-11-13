"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightFromSquare,
  ArrowRightToSquare,
  BookOpen,
  Calendar,
  FileText,
  Globe,
  LayoutCellsLarge,
  Person,
  Receipt,
  ShieldCheck,
} from "@gravity-ui/icons";
import { Avatar, Dropdown, Label, Link, Tabs } from "@heroui/react";

import { ServiceSearch, type SearchItem } from "./service-search";

import { BrandMark } from "@/components/brand/seal";
import { ButtonLink } from "@/components/ui/button-link";
import { initials } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth";

export type HeaderAccount = { name: string; avatarUrl: string | null; isStaff: boolean } | null;

const NAV = [
  { id: "/", label: "Startseite" },
  { id: "/leistungen", label: "Leistungen A–Z" },
  { id: "/aemter", label: "Ämter & Kontakt" },
  { id: "/aktuelles", label: "Aktuelles & Amtsblatt" },
  { id: "/karriere", label: "Karriere" },
  { id: "/pruefen", label: "Dokument prüfen" },
];

export function SiteHeader({ account, services }: { account: HeaderAccount; services: SearchItem[] }) {
  const pathname = usePathname();
  const current =
    NAV.slice(1).find((n) => pathname === n.id || pathname.startsWith(`${n.id}/`))?.id ??
    (pathname === "/" ? "/" : null);

  return (
    <>
      <div className="border-b border-separator bg-surface text-xs text-muted">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="hidden sm:inline">Das offizielle Stadtportal von Nordverkehr</span>
          <nav aria-label="Service" className="ml-auto flex items-center gap-4">
            <Link className="gap-1.5 text-xs font-normal text-muted" href="/leistungen">
              <BookOpen className="size-3.5" />
              Alle Leistungen
            </Link>
            <Link className="hidden gap-1.5 text-xs font-normal text-muted sm:inline-flex" href="https://nordverkehr.xyz" target="_blank">
              <Globe className="size-3.5" />
              nordverkehr.xyz
            </Link>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-separator bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap">
          <NextLink aria-label="Rathaus Nordverkehr, Startseite" className="rounded-xl" href="/">
            <BrandMark />
          </NextLink>

          <ServiceSearch className="order-3 w-full lg:order-none lg:ml-auto lg:max-w-md" items={services} />

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {account ? (
              <>
                <ButtonLink className="hidden md:inline-flex" href="/konto/termine" variant="tertiary">
                  <Calendar />
                  Termine
                </ButtonLink>
                <Dropdown>
                  <Dropdown.Trigger aria-label="Konto-Menü" className="rounded-full">
                    <Avatar size="sm">
                      {account.avatarUrl ? <Avatar.Image alt="" src={account.avatarUrl} /> : null}
                      <Avatar.Fallback>{initials(account.name)}</Avatar.Fallback>
                    </Avatar>
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="bottom end">
                    <div className="px-3 pb-1 pt-2">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted">Bürgerkonto</p>
                    </div>
                    <Dropdown.Menu
                      aria-label="Konto"
                      onAction={(key) => {
                        if (key === "logout") void signOutAction();
                      }}
                    >
                      <Dropdown.Item href="/konto" id="konto" textValue="Übersicht">
                        <LayoutCellsLarge className="size-4 text-muted" />
                        <Label>Übersicht</Label>
                      </Dropdown.Item>
                      <Dropdown.Item href="/konto/antraege" id="antraege" textValue="Meine Anträge">
                        <Receipt className="size-4 text-muted" />
                        <Label>Meine Anträge</Label>
                      </Dropdown.Item>
                      <Dropdown.Item href="/konto/dokumente" id="dokumente" textValue="Meine Dokumente">
                        <FileText className="size-4 text-muted" />
                        <Label>Meine Dokumente</Label>
                      </Dropdown.Item>
                      <Dropdown.Item href="/konto/meldedaten" id="meldedaten" textValue="Meldedaten">
                        <Person className="size-4 text-muted" />
                        <Label>Meldedaten</Label>
                      </Dropdown.Item>
                      {account.isStaff ? (
                        <Dropdown.Item href="/verwaltung" id="verwaltung" textValue="Verwaltung">
                          <ShieldCheck className="size-4 text-muted" />
                          <Label>Verwaltung</Label>
                        </Dropdown.Item>
                      ) : null}
                      <Dropdown.Item id="logout" textValue="Abmelden" variant="danger">
                        <ArrowRightFromSquare className="size-4" />
                        <Label>Abmelden</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </>
            ) : (
              <ButtonLink href="/anmelden">
                <ArrowRightToSquare />
                Bürgerkonto
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-2 sm:px-4">
          <Tabs selectedKey={current ?? "none"} variant="secondary">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Hauptnavigation" className="w-fit min-w-0">
                {NAV.map((n) => (
                  <Tabs.Tab key={n.id} className="whitespace-nowrap" href={n.id} id={n.id}>
                    {n.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </header>
    </>
  );
}

import type { Metadata } from "next";
import NextLink from "next/link";
import { LockFill } from "@gravity-ui/icons";

import { Seal } from "@/components/brand/seal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NordPayLogo } from "@/components/zahlung/brand";
import { NORDPAY } from "@/lib/nordpay";

export const metadata: Metadata = { title: "Bezahlen mit NordPay", robots: { index: false } };

/** Eigener Rahmen wie bei einem externen Zahlungsdienstleister. */
export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-warning-soft px-4 py-1.5 text-center text-xs text-warning-soft-foreground">
        Rollenspiel: {NORDPAY.name} ist ein fiktiver Zahlungsdienst. Es fließt kein echtes Geld. Geben Sie niemals echte Kartendaten ein.
      </div>
      <header className="border-b border-separator bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <NordPayLogo size={24} />
            <span className="hidden h-6 w-px bg-separator sm:block" />
            <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
              <LockFill className="size-3.5" />
              Sichere Zahlung
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NextLink className="flex items-center gap-2 text-sm text-muted hover:text-foreground" href="/konto/antraege">
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-[11px]">Zahlung an</span>
                <span className="block font-medium text-foreground">Stadt Nordverkehr</span>
              </span>
              <Seal className="size-9 text-accent" />
            </NextLink>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-separator py-5 text-center text-xs text-muted">
        {NORDPAY.name} · {NORDPAY.secure} · {NORDPAY.bank} – fiktive Marken im Roleplay-Projekt Nordverkehr. Keine Verbindung zu echten Banken oder Kartennetzen.
      </footer>
    </div>
  );
}

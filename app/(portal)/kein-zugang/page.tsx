import type { Metadata } from "next";
import { CircleExclamation } from "@gravity-ui/icons";
import { Card } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { discordConfig } from "@/lib/discord";

export const metadata: Metadata = { title: "Kein Zugang" };

const REASONS: Record<string, { title: string; text: string; discord?: boolean }> = {
  server: {
    title: "Sie sind nicht auf dem Nordverkehr-Discord",
    text: "Das Bürgerkonto steht nur Mitgliedern des Nordverkehr-Discords offen. Treten Sie dem Server bei und melden Sie sich danach erneut an.",
    discord: true,
  },
  rolle: {
    title: "Ihnen fehlt die Rolle „Bürger“",
    text: "Die Rolle erhalten Sie nach bestandener Whitelist-Bewerbung. Wie die Bewerbung abläuft, erfahren Sie im Discord.",
    discord: true,
  },
  verwaltung: {
    title: "Kein Zugang zur Verwaltung",
    text: "Die Verwaltung ist nur für Mitarbeitende der Ämter. Die Zuordnung erfolgt über die Discord-Rollen der Ämter.",
  },
  fehler: {
    title: "Discord ist gerade nicht erreichbar",
    text: "Ihre Mitgliedschaft konnte nicht geprüft werden. Bitte versuchen Sie es in ein paar Minuten erneut.",
  },
};

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ grund?: string }> }) {
  const { grund = "rolle" } = await searchParams;
  const reason = REASONS[grund] ?? REASONS.rolle;

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card className="items-center gap-5 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
          <CircleExclamation className="size-6" />
        </span>
        <Card.Header className="items-center gap-2">
          <Card.Title className="text-xl font-semibold">{reason.title}</Card.Title>
          <Card.Description>{reason.text}</Card.Description>
        </Card.Header>
        <Card.Footer className="flex-wrap justify-center gap-2">
          {reason.discord ? <ButtonLink href={discordConfig.inviteUrl} target="_blank">Zum Discord</ButtonLink> : null}
          <ButtonLink href="/anmelden" variant="tertiary">Erneut anmelden</ButtonLink>
          <ButtonLink href="/" variant="ghost">Zur Startseite</ButtonLink>
        </Card.Footer>
      </Card>
    </div>
  );
}

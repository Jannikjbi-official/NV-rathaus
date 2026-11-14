import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Card } from "@heroui/react";

import { DevLogin, DiscordLoginButton } from "@/components/portal/login-buttons";
import { Seal } from "@/components/brand/seal";
import { devLoginEnabled } from "@/auth";
import { safeRedirect } from "@/lib/redirect";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Anmelden" };

const ERRORS: Record<string, string> = {
  AccessDenied: "Die Anmeldung wurde abgelehnt. Prüfen Sie, ob Sie auf dem Nordverkehr-Discord sind und die Rolle „Bürger“ haben.",
  OAuthCallbackError: "Die Anmeldung bei Discord wurde abgebrochen. Bitte versuchen Sie es erneut.",
  FiveM: "Die Anmeldung über das Tablet ist abgelaufen oder ungültig. Schließen Sie das Tablet und öffnen Sie es erneut.",
  Configuration: "Die Anmeldung ist gerade nicht verfügbar. Bitte melden Sie sich im Discord beim Team.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  const viewer = await getViewer();

  if (viewer) redirect(safeRedirect(callbackUrl));

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-10">
      <Card className="items-center gap-6 p-8 text-center">
        <Seal className="size-16 text-accent" />
        <Card.Header className="items-center gap-2">
          <Card.Title className="text-2xl font-semibold">Bürgerkonto</Card.Title>
          <Card.Description>
            Melden Sie sich mit Ihrem Discord-Konto an, um Anträge zu stellen und Ihre Dokumente einzusehen.
          </Card.Description>
        </Card.Header>
        {error ? (
          <Alert className="text-left" status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Anmeldung nicht möglich</Alert.Title>
              <Alert.Description>{ERRORS[error] ?? ERRORS.Configuration}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <DiscordLoginButton callbackUrl={callbackUrl} />
        <ul className="flex w-full flex-col gap-2 rounded-2xl bg-default p-4 text-left text-sm text-muted">
          <li>Voraussetzung: Mitglied im Nordverkehr-Discord</li>
          <li>und die Rolle „Bürger“ (nach bestandener Whitelist)</li>
        </ul>
      </Card>
      {devLoginEnabled ? <DevLogin callbackUrl={callbackUrl} /> : null}
    </div>
  );
}

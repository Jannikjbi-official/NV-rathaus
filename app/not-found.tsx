import { Card } from "@heroui/react";

import { Seal } from "@/components/brand/seal";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md items-center gap-5 p-8 text-center">
        <Seal className="size-14 text-accent" />
        <Card.Header className="items-center gap-2">
          <Card.Title className="text-xl font-semibold">Seite nicht gefunden</Card.Title>
          <Card.Description>
            Diese Seite gibt es nicht oder nicht mehr. Vielleicht hilft die Suche nach einer Leistung weiter.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="gap-2">
          <ButtonLink href="/">Zur Startseite</ButtonLink>
          <ButtonLink href="/leistungen" variant="tertiary">Leistungen A–Z</ButtonLink>
        </Card.Footer>
      </Card>
    </div>
  );
}

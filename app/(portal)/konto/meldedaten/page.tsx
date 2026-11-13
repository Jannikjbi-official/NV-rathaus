import type { Metadata } from "next";
import { Alert } from "@heroui/react";

import { CitizenForm } from "@/components/konto/citizen-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireCitizen } from "@/lib/viewer";

export const metadata: Metadata = { title: "Meldedaten" };

export default async function MeldedatenPage({ searchParams }: { searchParams: Promise<{ weiter?: string }> }) {
  const [viewer, { weiter }] = await Promise.all([requireCitizen("/konto/meldedaten"), searchParams]);

  return (
    <>
      <PageHeader
        description={
          viewer.citizen
            ? `Bürgernummer ${viewer.citizen.citizenNumber}. Diese Daten werden in jeden Antrag übernommen.`
            : "Einmalig für Ihren Charakter. Danach sind alle Anträge vorausgefüllt."
        }
        title={viewer.citizen ? "Meldedaten" : "Willkommen im Bürgerkonto"}
      />
      {!viewer.citizen ? (
        <Alert className="mb-6" status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Bitte erfassen Sie zuerst Ihre Meldedaten</Alert.Title>
            <Alert.Description>
              Name, Geburtsdaten und Anschrift können später nur über einen Antrag geändert werden, wie bei einer echten Behörde.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <CitizenForm citizen={viewer.citizen} next={weiter} />
    </>
  );
}

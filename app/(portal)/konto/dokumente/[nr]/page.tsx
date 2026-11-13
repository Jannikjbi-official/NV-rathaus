import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Card, Chip } from "@heroui/react";

import { DocumentCard } from "@/components/documents/document-card";
import { PrintButton } from "@/components/documents/print-button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { getCitizenDocument } from "@/lib/document-data";
import { formatLongDate } from "@/lib/format";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Dokument" };

export default async function DocumentPage({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  const viewer = await requireResident(`/konto/dokumente/${nr}`);
  const doc = await getCitizenDocument(viewer.citizen.id, decodeURIComponent(nr));

  if (!doc) notFound();

  return (
    <>
      <PageHeader
        actions={<PrintButton />}
        crumbs={[{ label: "Meine Dokumente", href: "/konto/dokumente" }, { label: doc.number }]}
        description={`Ausgestellt am ${formatLongDate(doc.issuedAt)} vom ${doc.department}`}
        title={doc.title}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,560px)_1fr]">
        <div className="print-area">
          <DocumentCard doc={doc} />
        </div>
        <div className="flex flex-col gap-4 print:hidden">
          {doc.state.tone !== "success" ? (
            <Alert status={doc.state.tone === "danger" ? "danger" : "warning"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Dokument {doc.state.label}</Alert.Title>
                {doc.revokedReason ? <Alert.Description>{doc.revokedReason}</Alert.Description> : null}
              </Alert.Content>
            </Alert>
          ) : null}
          <Card>
            <Card.Header className="flex-row items-center justify-between">
              <Card.Title className="text-base">Angaben</Card.Title>
              <Chip color={doc.state.tone} size="sm" variant="soft">{doc.state.label}</Chip>
            </Card.Header>
            <Card.Content className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Dokumentnummer" value={doc.number} />
              <Row label="Gültig bis" value={doc.validUntil ? formatLongDate(doc.validUntil) : "unbefristet"} />
              {Object.entries(doc.details).map(([k, v]) => (
                <Row key={k} label={k} value={v} />
              ))}
            </Card.Content>
          </Card>
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-base">Echtheit prüfen lassen</Card.Title>
              <Card.Description>Polizei und Behörden können das Dokument über die Dokumentnummer prüfen.</Card.Description>
            </Card.Header>
            <Card.Footer>
              <ButtonLink href={`/pruefen?nr=${doc.number}`} size="sm" variant="tertiary">Prüfseite öffnen</ButtonLink>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

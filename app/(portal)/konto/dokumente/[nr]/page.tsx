import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Card, Chip } from "@heroui/react";

import { DocumentViewer } from "@/components/documents/document-viewer";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { getDocumentForCitizen } from "@/lib/document-render";
import { formatLongDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Dokument" };

export default async function DocumentPage({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  const viewer = await requireResident(`/konto/dokumente/${nr}`);
  const doc = await getDocumentForCitizen(viewer.citizen.id, decodeURIComponent(nr));

  if (!doc) notFound();

  return (
    <>
      <PageHeader
        actions={<Chip color={doc.state.tone} size="lg" variant="soft">{doc.state.label}</Chip>}
        crumbs={[{ label: "Meine Dokumente", href: "/konto/dokumente" }, { label: doc.number }]}
        description={`${DOCUMENT_TYPES[doc.type].label} · ausgestellt am ${formatLongDate(doc.issuedAt)} vom ${doc.authority.name}`}
        title={doc.title}
      />
      <div className="flex flex-col gap-6">
        {doc.state.tone !== "success" ? (
          <Alert status={doc.state.tone === "danger" ? "danger" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Dieses Dokument ist {doc.state.label}</Alert.Title>
              {doc.revokedReason ? <Alert.Description>{doc.revokedReason}</Alert.Description> : null}
            </Alert.Content>
          </Alert>
        ) : null}
        <DocumentViewer doc={doc} />
        <Card variant="secondary">
          <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <Card.Title className="text-base">Echtheit prüfen lassen</Card.Title>
              <Card.Description>Polizei und Behörden prüfen das Dokument über die Nummer {doc.number} oder den QR-Code.</Card.Description>
            </div>
            <ButtonLink href={`/pruefen?nr=${doc.number}`} size="sm" variant="tertiary">Prüfseite öffnen</ButtonLink>
          </Card.Header>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import NextLink from "next/link";
import { Card, Chip } from "@heroui/react";

import { DocumentThumb } from "@/components/documents/document-viewer";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { getDocumentsForCitizen } from "@/lib/document-render";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Meine Dokumente" };

export default async function DocumentsPage() {
  const viewer = await requireResident("/konto/dokumente");
  const docs = await getDocumentsForCitizen(viewer.citizen.id);

  return (
    <>
      <PageHeader description="Ausweise, Führerscheine, Urkunden und Bescheide, die die Stadt Ihnen ausgestellt hat. Jedes Dokument können Sie als PDF oder Bild herunterladen." title="Meine Dokumente" />
      {docs.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <Card.Title>Noch keine Dokumente</Card.Title>
          <Card.Description>Sobald ein Antrag genehmigt und das Dokument ausgestellt ist, erscheint es hier.</Card.Description>
          <ButtonLink href="/leistungen/personalausweis" variant="tertiary">Personalausweis beantragen</ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 2xl:grid-cols-3">
          {docs.map((d) => (
            <NextLink key={d.number} className="group flex flex-col gap-3 rounded-2xl" href={`/konto/dokumente/${d.number}`}>
              <div className="flex aspect-[1.4] items-center justify-center overflow-hidden rounded-3xl bg-default/60 p-5 transition-colors group-hover:bg-default">
                <div className="w-full max-w-[420px] transition-transform group-hover:-translate-y-0.5" style={{ maxWidth: ["urkunde", "bescheid", "bescheinigung", "genehmigung", "gewerbeschein"].includes(d.type) ? 170 : undefined }}>
                  <DocumentThumb doc={d} />
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted">{DOCUMENT_TYPES[d.type].label} · {formatDate(d.issuedAt)}</p>
                </div>
                <Chip color={d.state.tone} size="sm" variant="soft">{d.state.label}</Chip>
              </div>
            </NextLink>
          ))}
        </div>
      )}
    </>
  );
}

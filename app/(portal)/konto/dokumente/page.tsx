import type { Metadata } from "next";
import NextLink from "next/link";
import { Card, Chip } from "@heroui/react";

import { DocumentCard } from "@/components/documents/document-card";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { getCitizenDocuments } from "@/lib/document-data";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Meine Dokumente" };

export default async function DocumentsPage() {
  const viewer = await requireResident("/konto/dokumente");
  const docs = await getCitizenDocuments(viewer.citizen.id);

  return (
    <>
      <PageHeader description="Ausweise, Führerscheine, Urkunden und Bescheide, die die Stadt Ihnen ausgestellt hat." title="Meine Dokumente" />
      {docs.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <Card.Title>Noch keine Dokumente</Card.Title>
          <Card.Description>Sobald ein Antrag genehmigt und das Dokument ausgestellt ist, erscheint es hier.</Card.Description>
          <ButtonLink href="/leistungen/personalausweis" variant="tertiary">Personalausweis beantragen</ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {docs.map((d) => (
            <NextLink key={d.id} className="group flex flex-col gap-2 rounded-2xl" href={`/konto/dokumente/${d.number}`}>
              <div className="transition-transform group-hover:-translate-y-0.5">
                <DocumentCard doc={d} size="sm" />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium">{d.title}</span>
                <Chip color={d.state.tone} size="sm" variant="soft">{d.state.label}</Chip>
              </div>
            </NextLink>
          ))}
        </div>
      )}
    </>
  );
}

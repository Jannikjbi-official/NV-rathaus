import { notFound } from "next/navigation";
import { Chip } from "@heroui/react";

import { DocumentViewer } from "@/components/documents/document-viewer";
import { PageHeader } from "@/components/ui/page-header";
import { RevokeDocumentButton } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getDocumentByNumber } from "@/lib/document-render";
import { formatLongDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/status";
import { canHandle, requireStaff } from "@/lib/viewer";
import { eq } from "drizzle-orm";

export default async function AdminDocumentPage({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  const viewer = await requireStaff(`/verwaltung/dokumente/${nr}`);
  const found = await getDocumentByNumber(decodeURIComponent(nr));

  if (!found) notFound();
  const { doc, departmentId } = found;
  const [row] = await db.select({ id: documents.id }).from(documents).where(eq(documents.number, doc.number)).limit(1);

  return (
    <>
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Chip color={doc.state.tone} size="lg" variant="soft">{doc.state.label}</Chip>
            {doc.state.tone !== "danger" && canHandle(viewer, departmentId) ? <RevokeDocumentButton id={row.id} number={doc.number} /> : null}
          </div>
        }
        crumbs={[{ label: "Melderegister", href: "/verwaltung/buerger" }, { label: doc.holder.citizenNumber, href: `/verwaltung/buerger/${doc.holder.citizenNumber}` }, { label: doc.number }]}
        description={`${DOCUMENT_TYPES[doc.type].label} für ${doc.holder.firstName} ${doc.holder.lastName} · ausgestellt am ${formatLongDate(doc.issuedAt)} vom ${doc.authority.name}`}
        root={{ label: "Verwaltung", href: "/verwaltung" }}
        title={doc.title}
      />
      <DocumentViewer doc={doc} />
    </>
  );
}

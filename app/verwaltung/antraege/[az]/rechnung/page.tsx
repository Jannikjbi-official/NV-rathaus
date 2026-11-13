import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chip } from "@heroui/react";

import { InvoiceViewer } from "@/components/documents/invoice-viewer";
import { PageHeader } from "@/components/ui/page-header";
import { formatEuro } from "@/lib/format";
import { getInvoice } from "@/lib/invoice";
import { canHandle, requireStaff } from "@/lib/viewer";

export const metadata: Metadata = { title: "Rechnung" };

export default async function StaffInvoicePage({ params }: { params: Promise<{ az: string }> }) {
  const { az } = await params;
  const viewer = await requireStaff(`/verwaltung/antraege/${az}/rechnung`);
  const invoice = await getInvoice(az);

  if (!invoice || !canHandle(viewer, invoice.departmentId)) notFound();
  const { applicationId: _a, departmentId: _d, ...data } = invoice;

  return (
    <>
      <PageHeader
        actions={
          <Chip color={invoice.paid ? "success" : invoice.cancelled ? "default" : "warning"} size="lg" variant="soft">
            {invoice.paid ? "bezahlt" : invoice.cancelled ? "storniert" : "offen"}
          </Chip>
        }
        crumbs={[
          { label: "Anträge", href: "/verwaltung/antraege" },
          { label: invoice.reference, href: `/verwaltung/antraege/${az}` },
          { label: "Rechnung" },
        ]}
        description={`${invoice.serviceTitle} · ${invoice.holder.firstName} ${invoice.holder.lastName} · ${formatEuro(invoice.amountCents)}`}
        root={{ label: "Verwaltung", href: "/verwaltung" }}
        title={`Gebührenrechnung ${invoice.number}`}
      />
      <InvoiceViewer invoice={data} />
    </>
  );
}

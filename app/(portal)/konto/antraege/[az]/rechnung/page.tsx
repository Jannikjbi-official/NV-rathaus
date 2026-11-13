import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditCard } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";

import { InvoiceViewer } from "@/components/documents/invoice-viewer";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { formatEuro, formatLongDate } from "@/lib/format";
import { getInvoice } from "@/lib/invoice";
import { requireResident } from "@/lib/viewer";

export const metadata: Metadata = { title: "Rechnung" };

export default async function InvoicePage({ params }: { params: Promise<{ az: string }> }) {
  const { az } = await params;
  const viewer = await requireResident(`/konto/antraege/${az}/rechnung`);
  const invoice = await getInvoice(az, { citizenId: viewer.citizen.id });

  if (!invoice) notFound();
  const { applicationId: _a, departmentId: _d, ...data } = invoice;
  const open = !invoice.paid && !invoice.cancelled;

  return (
    <>
      <PageHeader
        actions={
          <Chip color={invoice.paid ? "success" : invoice.cancelled ? "default" : "warning"} size="lg" variant="soft">
            {invoice.paid ? "bezahlt" : invoice.cancelled ? "storniert" : "offen"}
          </Chip>
        }
        crumbs={[
          { label: "Meine Anträge", href: "/konto/antraege" },
          { label: invoice.reference, href: `/konto/antraege/${az}` },
          { label: "Rechnung" },
        ]}
        description={`${invoice.serviceTitle} · ${formatEuro(invoice.amountCents)} · ${invoice.paid ? `bezahlt am ${formatLongDate(invoice.paid.at)}` : `fällig am ${formatLongDate(invoice.dueAt)}`}`}
        title={`Gebührenrechnung ${invoice.number}`}
      />
      <InvoiceViewer
        invoice={data}
        toolbar={
          open ? (
            <ButtonLink href={`/zahlung/${az}`} variant="secondary">
              <CreditCard />
              Jetzt bezahlen
            </ButtonLink>
          ) : null
        }
      />
    </>
  );
}

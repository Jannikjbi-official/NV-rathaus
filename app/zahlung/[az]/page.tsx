import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Card } from "@heroui/react";
import { CircleCheckFill } from "@gravity-ui/icons";

import { ButtonLink } from "@/components/ui/button-link";
import { Checkout } from "@/components/zahlung/checkout";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { referenceFromSlug } from "@/lib/applications";
import { formatEuro, formatLongDate } from "@/lib/format";
import { getInvoice } from "@/lib/invoice";
import { citizenCard } from "@/lib/nordpay";
import { requireResident } from "@/lib/viewer";

export default async function PaymentPage({ params }: { params: Promise<{ az: string }> }) {
  const { az } = await params;
  const viewer = await requireResident(`/zahlung/${az}`);
  const invoice = await getInvoice(az, { citizenId: viewer.citizen.id });

  if (!invoice) {
    // Antrag ohne Gebühr: zurück zum Antrag statt 404.
    const [app] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.reference, referenceFromSlug(az)), eq(applications.citizenId, viewer.citizen.id)))
      .limit(1);

    if (!app) notFound();

    return <Notice href={`/konto/antraege/${az}`} text="Für diesen Antrag fällt keine Gebühr an." title="Nichts zu bezahlen" />;
  }

  if (invoice.paid) {
    return (
      <Notice
        href={`/konto/antraege/${az}/rechnung`}
        linkLabel="Rechnung ansehen"
        success
        text={`${formatEuro(invoice.amountCents)} wurden am ${formatLongDate(invoice.paid.at)} bezahlt${invoice.paid.transactionId ? ` (Transaktion ${invoice.paid.transactionId})` : ""}.`}
        title="Bereits bezahlt"
      />
    );
  }

  if (invoice.cancelled) {
    return <Notice href={`/konto/antraege/${az}`} text="Der Antrag wurde abgelehnt oder zurückgezogen. Die Gebühr wird nicht erhoben." title="Keine Zahlung nötig" />;
  }

  const { applicationId, departmentId: _d, ...data } = invoice;
  const card = citizenCard(viewer.citizen.citizenNumber, `${viewer.citizen.firstName} ${viewer.citizen.lastName}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Gebührenrechnung {invoice.number}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{formatEuro(invoice.amountCents)} bezahlen</h1>
        <p className="text-muted">{invoice.serviceTitle} · {invoice.reference}</p>
      </div>
      <Checkout applicationId={applicationId} card={card} invoice={data} slug={az} />
    </div>
  );
}

function Notice({ title, text, href, linkLabel = "Zum Antrag", success }: { title: string; text: string; href: string; linkLabel?: string; success?: boolean }) {
  return (
    <Card className="mx-auto max-w-lg items-center gap-4 p-8 text-center">
      {success ? <CircleCheckFill className="size-12 text-success" /> : null}
      <Card.Header className="items-center">
        <Card.Title className="text-xl">{title}</Card.Title>
        <Card.Description>{text}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <ButtonLink href={href}>{linkLabel}</ButtonLink>
      </Card.Footer>
    </Card>
  );
}

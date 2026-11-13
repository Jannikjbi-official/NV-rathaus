import "server-only";

import { and, desc, eq } from "drizzle-orm";
import QRCode from "qrcode";

import type { InvoiceData } from "@/components/documents/templates/invoice";
import { db } from "@/db";
import { applicationEvents, applications, citizens, departments, payments, services, users } from "@/db/schema";

import { referenceFromSlug, referenceSlug, siteUrl } from "./applications";
import { invoiceNumber } from "./nordpay";

const DAY = 86400000;

/** Rechnung zu einem Antrag. Mit citizenId nur für den eigenen Antrag. */
export async function getInvoice(slug: string, opts: { citizenId?: string } = {}): Promise<(InvoiceData & { departmentId: string; applicationId: string }) | null> {
  const reference = referenceFromSlug(slug);
  const [row] = await db
    .select({ app: applications, service: services, department: departments, citizen: citizens })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .innerJoin(departments, eq(applications.departmentId, departments.id))
    .innerJoin(citizens, eq(applications.citizenId, citizens.id))
    .where(and(eq(applications.reference, reference), opts.citizenId ? eq(applications.citizenId, opts.citizenId) : undefined))
    .limit(1);

  if (!row || row.app.feeCents <= 0) return null;
  const { app, service, department, citizen } = row;

  const [[payment], [feeEvent]] = await Promise.all([
    db
      .select()
      .from(payments)
      .where(and(eq(payments.applicationId, app.id), eq(payments.status, "bezahlt")))
      .orderBy(desc(payments.paidAt))
      .limit(1),
    db
      .select({ createdAt: applicationEvents.createdAt, author: users.displayName })
      .from(applicationEvents)
      .leftJoin(users, eq(applicationEvents.authorId, users.id))
      .where(and(eq(applicationEvents.applicationId, app.id), eq(applicationEvents.type, "gebuehr")))
      .orderBy(desc(applicationEvents.createdAt))
      .limit(1),
  ]);

  const payUrl = `${siteUrl()}/zahlung/${referenceSlug(app.reference)}`;
  const qrSvg = await QRCode.toString(payUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1d1a1fff", light: "#00000000" },
  });

  const paid: InvoiceData["paid"] = app.feePaidAt
    ? payment
      ? { at: (payment.paidAt ?? app.feePaidAt).toISOString(), method: "nordpay", last4: payment.cardLast4, transactionId: payment.transactionId, by: null }
      : { at: app.feePaidAt.toISOString(), method: "kasse", last4: null, transactionId: null, by: feeEvent?.author ?? null }
    : null;

  return {
    applicationId: app.id,
    departmentId: app.departmentId,
    number: invoiceNumber(app.reference),
    reference: app.reference,
    issuedAt: app.submittedAt.toISOString(),
    dueAt: new Date(app.submittedAt.getTime() + 14 * DAY).toISOString(),
    serviceTitle: service.title,
    tariff: `${department.slug.slice(0, 3).toUpperCase()}-${String(service.sortOrder).padStart(2, "0")}`,
    department: { name: department.name, address: department.address, phone: department.phone },
    holder: {
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      gender: citizen.gender,
      street: citizen.street,
      postalCode: citizen.postalCode,
      citizenNumber: citizen.citizenNumber,
    },
    amountCents: app.feeCents,
    paid,
    cancelled: !app.feePaidAt && (app.status === "abgelehnt" || app.status === "zurueckgezogen"),
    payUrl,
    qrSvg,
  };
}

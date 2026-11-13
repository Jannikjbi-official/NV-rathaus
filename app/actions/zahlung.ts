"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { applicationEvents, applications, payments, services } from "@/db/schema";
import { referenceSlug, siteUrl } from "@/lib/applications";
import { sendDirectMessage } from "@/lib/discord";
import { formatEuro } from "@/lib/format";
import { digitsOnly, invoiceNumber, NORDPAY, validateCard, type CardErrors, type CardInput } from "@/lib/nordpay";
import { requireResident } from "@/lib/viewer";

export type StartResult =
  | { ok: true; paymentId: string; code: string; transactionId: string; last4: string; expiresAt: string; amountCents: number }
  | { ok: false; message: string; errors?: CardErrors };

export type ConfirmResult =
  | { ok: true; transactionId: string; paidAt: string; last4: string; amountCents: number }
  | { ok: false; message: string; attemptsLeft: number; final: boolean };

const PAYABLE = ["eingereicht", "in_bearbeitung", "rueckfrage", "genehmigt"];

const hashCode = (paymentId: string, code: string) =>
  createHash("sha256").update(`${paymentId}:${code}:${process.env.AUTH_SECRET ?? "nordpay"}`).digest();

function transactionId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

  return `NP-${date}-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
}

function revalidate(reference: string) {
  const slug = referenceSlug(reference);

  revalidatePath(`/konto/antraege/${slug}`);
  revalidatePath(`/zahlung/${slug}`);
  revalidatePath(`/verwaltung/antraege/${slug}`);
  revalidatePath("/konto", "layout");
  revalidatePath("/verwaltung", "layout");
}

/** Schritt 1: Karte prüfen und NordSecure-Code anfordern. */
export async function startPayment(applicationId: string, input: CardInput): Promise<StartResult> {
  const viewer = await requireResident("/konto/antraege");
  const [row] = await db
    .select({ app: applications, serviceTitle: services.title })
    .from(applications)
    .innerJoin(services, eq(applications.serviceId, services.id))
    .where(and(eq(applications.id, applicationId), eq(applications.citizenId, viewer.citizen.id)))
    .limit(1);

  if (!row) return { ok: false, message: "Antrag nicht gefunden." };
  const { app } = row;

  if (app.feeCents <= 0) return { ok: false, message: "Für diesen Antrag fällt keine Gebühr an." };
  if (app.feePaidAt) return { ok: false, message: "Die Gebühr ist bereits bezahlt." };
  if (!PAYABLE.includes(app.status)) return { ok: false, message: "Für diesen Antrag kann nichts mehr bezahlt werden." };

  const errors = validateCard(input);

  if (Object.keys(errors).length) return { ok: false, message: "Bitte prüfen Sie die Kartendaten.", errors };

  const id = crypto.randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const last4 = digitsOnly(input.number).slice(-4);
  const tx = transactionId();
  const expiresAt = new Date(Date.now() + NORDPAY.codeTtlMinutes * 60_000);

  await db.batch([
    // Ältere, nicht abgeschlossene Versuche verfallen.
    db
      .update(payments)
      .set({ status: "abgebrochen", challengeHash: null })
      .where(and(eq(payments.applicationId, app.id), eq(payments.status, "authentifizierung"))),
    db.insert(payments).values({
      id,
      applicationId: app.id,
      citizenId: viewer.citizen.id,
      amountCents: app.feeCents,
      cardLast4: last4,
      cardHolder: input.holder.trim().toUpperCase().slice(0, 60),
      transactionId: tx,
      challengeHash: hashCode(id, code).toString("hex"),
      challengeExpiresAt: expiresAt,
    }),
  ]);

  after(() =>
    sendDirectMessage(viewer.user.id, {
      title: `${NORDPAY.secure}: Zahlung bestätigen`,
      description: `Ihr Bestätigungscode lautet **${code}**.\nEr gilt ${NORDPAY.codeTtlMinutes} Minuten. Geben Sie ihn nur im NordPay-Fenster des Rathauses ein.`,
      color: 0x0e3a5c,
      fields: [
        { name: "Empfänger", value: "Stadtkasse Nordverkehr", inline: true },
        { name: "Betrag", value: formatEuro(app.feeCents), inline: true },
        { name: "Karte", value: `NordPay ···· ${last4}`, inline: true },
      ],
    }),
  );

  return { ok: true, paymentId: id, code, transactionId: tx, last4, expiresAt: expiresAt.toISOString(), amountCents: app.feeCents };
}

/** Schritt 2: NordSecure-Code prüfen und die Gebühr verbuchen. */
export async function confirmPayment(paymentId: string, code: string): Promise<ConfirmResult> {
  const viewer = await requireResident("/konto/antraege");
  const [row] = await db
    .select({ payment: payments, app: applications, serviceTitle: services.title })
    .from(payments)
    .innerJoin(applications, eq(payments.applicationId, applications.id))
    .innerJoin(services, eq(applications.serviceId, services.id))
    .where(and(eq(payments.id, paymentId), eq(payments.citizenId, viewer.citizen.id)))
    .limit(1);

  if (!row) return { ok: false, message: "Zahlung nicht gefunden.", attemptsLeft: 0, final: true };
  const { payment, app } = row;

  if (payment.status === "bezahlt")
    return { ok: true, transactionId: payment.transactionId, paidAt: (payment.paidAt ?? new Date()).toISOString(), last4: payment.cardLast4, amountCents: payment.amountCents };
  if (payment.status !== "authentifizierung" || !payment.challengeHash)
    return { ok: false, message: "Dieser Zahlungsvorgang ist nicht mehr gültig. Bitte starten Sie neu.", attemptsLeft: 0, final: true };

  if (!payment.challengeExpiresAt || payment.challengeExpiresAt.getTime() < Date.now()) {
    await db.update(payments).set({ status: "abgelehnt", challengeHash: null }).where(eq(payments.id, payment.id));

    return { ok: false, message: "Der Code ist abgelaufen. Bitte starten Sie die Zahlung neu.", attemptsLeft: 0, final: true };
  }

  const expected = Buffer.from(payment.challengeHash, "hex");
  const given = hashCode(payment.id, digitsOnly(code).slice(0, 6));

  if (!timingSafeEqual(expected, given)) {
    const attempts = payment.attempts + 1;
    const left = NORDPAY.maxAttempts - attempts;

    await db
      .update(payments)
      .set(left <= 0 ? { attempts, status: "abgelehnt", challengeHash: null } : { attempts })
      .where(eq(payments.id, payment.id));

    return left <= 0
      ? { ok: false, message: "Zu viele falsche Eingaben. Die Zahlung wurde abgelehnt.", attemptsLeft: 0, final: true }
      : { ok: false, message: `Der Code ist falsch. Noch ${left} ${left === 1 ? "Versuch" : "Versuche"}.`, attemptsLeft: left, final: false };
  }

  if (app.feePaidAt) {
    await db.update(payments).set({ status: "abgebrochen", challengeHash: null }).where(eq(payments.id, payment.id));

    return { ok: false, message: "Die Gebühr wurde inzwischen bereits bezahlt. Es wurde nichts abgebucht.", attemptsLeft: 0, final: true };
  }

  const paidAt = new Date();

  await db.batch([
    db.update(payments).set({ status: "bezahlt", paidAt, challengeHash: null }).where(eq(payments.id, payment.id)),
    db.update(applications).set({ feePaidAt: paidAt, updatedAt: paidAt }).where(and(eq(applications.id, app.id), isNull(applications.feePaidAt))),
    db.insert(applicationEvents).values({
      applicationId: app.id,
      type: "gebuehr",
      authorId: viewer.user.id,
      message: `${formatEuro(payment.amountCents)} online bezahlt mit NordPay ···· ${payment.cardLast4}\nTransaktion ${payment.transactionId} · Rechnung ${invoiceNumber(app.reference)}`,
    }),
  ]);

  after(() =>
    sendDirectMessage(viewer.user.id, {
      title: "Zahlung erfolgreich",
      description: `Vielen Dank. Die Gebühr für **${row.serviceTitle}** ist bezahlt. Ihre Rechnung mit Zahlungsvermerk finden Sie im Bürgerkonto.`,
      color: 0x17803d,
      url: `${siteUrl()}/konto/antraege/${referenceSlug(app.reference)}/rechnung`,
      fields: [
        { name: "Betrag", value: formatEuro(payment.amountCents), inline: true },
        { name: "Aktenzeichen", value: app.reference, inline: true },
        { name: "Transaktion", value: payment.transactionId, inline: true },
      ],
    }),
  );
  revalidate(app.reference);

  return { ok: true, transactionId: payment.transactionId, paidAt: paidAt.toISOString(), last4: payment.cardLast4, amountCents: payment.amountCents };
}

/** Abbruch durch den Bürger (z. B. NordSecure-Fenster geschlossen). */
export async function cancelPayment(paymentId: string) {
  const viewer = await requireResident("/konto/antraege");

  await db
    .update(payments)
    .set({ status: "abgebrochen", challengeHash: null })
    .where(and(eq(payments.id, paymentId), eq(payments.citizenId, viewer.citizen.id), eq(payments.status, "authentifizierung")));
}

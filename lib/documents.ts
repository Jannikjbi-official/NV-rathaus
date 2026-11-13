import type { CityDocument, DocumentType } from "@/db/schema";

import { DOCUMENT_TYPES } from "./status";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** NV-ID-7Q4K21 */
export function newDocumentNumber(type: DocumentType) {
  return `NV-${DOCUMENT_TYPES[type].prefix}-${randomCode(6)}`;
}

/** NV-0412-7731 */
export function newCitizenNumber() {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b % 10).join("");

  return `NV-${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function documentState(doc: Pick<CityDocument, "revokedAt" | "validUntil">) {
  if (doc.revokedAt) return { label: "widerrufen", tone: "danger" as const };
  if (doc.validUntil && new Date(doc.validUntil) < new Date(new Date().toDateString()))
    return { label: "abgelaufen", tone: "warning" as const };

  return { label: "gültig", tone: "success" as const };
}

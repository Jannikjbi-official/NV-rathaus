import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { DocumentCardData } from "@/components/documents/document-card";
import { db } from "@/db";
import { citizens, departments, documents } from "@/db/schema";

import { documentState } from "./documents";

const base = () =>
  db
    .select({ doc: documents, citizen: citizens, department: departments.name })
    .from(documents)
    .innerJoin(citizens, eq(documents.citizenId, citizens.id))
    .innerJoin(departments, eq(documents.departmentId, departments.id));

function toCard(row: Awaited<ReturnType<typeof base>>[number]): DocumentCardData & { id: string; revokedReason: string | null } {
  return {
    id: row.doc.id,
    number: row.doc.number,
    type: row.doc.type,
    title: row.doc.title,
    holder: {
      firstName: row.citizen.firstName,
      lastName: row.citizen.lastName,
      birthDate: row.citizen.birthDate,
      birthPlace: row.citizen.birthPlace,
    },
    department: row.department,
    issuedAt: row.doc.issuedAt,
    validUntil: row.doc.validUntil,
    details: row.doc.details,
    state: documentState(row.doc),
    revokedReason: row.doc.revokedReason,
  };
}

export async function getCitizenDocuments(citizenId: string) {
  const rows = await base().where(eq(documents.citizenId, citizenId)).orderBy(desc(documents.issuedAt));

  return rows.map(toCard);
}

export async function getCitizenDocument(citizenId: string, number: string) {
  const [row] = await base().where(and(eq(documents.citizenId, citizenId), eq(documents.number, number))).limit(1);

  return row ? toCard(row) : null;
}

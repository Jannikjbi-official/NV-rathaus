import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import QRCode from "qrcode";

import type { DocRender } from "@/components/documents/types";
import { db } from "@/db";
import { applications, citizens, departments, documents, services, users } from "@/db/schema";

import { siteUrl } from "./applications";
import { documentState } from "./documents";

const owner = alias(users, "owner");

async function toRender(rows: Awaited<ReturnType<typeof query>>): Promise<DocRender[]> {
  return Promise.all(
    rows.map(async (r) => {
      const verifyUrl = `${siteUrl()}/pruefen?nr=${r.doc.number}`;
      const qrSvg = await QRCode.toString(verifyUrl, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#1d1a1fff", light: "#00000000" },
      });

      return {
        number: r.doc.number,
        type: r.doc.type,
        title: r.doc.title,
        details: r.doc.details,
        issuedAt: r.doc.issuedAt.toISOString(),
        validUntil: r.doc.validUntil,
        state: documentState(r.doc),
        revokedReason: r.doc.revokedReason,
        holder: {
          firstName: r.citizen.firstName,
          lastName: r.citizen.lastName,
          birthName: r.citizen.birthName,
          birthDate: r.citizen.birthDate,
          birthPlace: r.citizen.birthPlace,
          nationality: r.citizen.nationality,
          gender: r.citizen.gender,
          heightCm: r.citizen.heightCm,
          eyeColor: r.citizen.eyeColor,
          street: r.citizen.street,
          postalCode: r.citizen.postalCode,
          district: r.citizen.district,
          citizenNumber: r.citizen.citizenNumber,
          maritalStatus: r.citizen.maritalStatus,
          photoUrl: r.avatarUrl ? `/api/lichtbild/${r.citizen.userId}` : null,
        },
        authority: { name: r.department.name, address: r.department.address, phone: r.department.phone },
        application: r.app
          ? {
              reference: r.app.reference,
              serviceSlug: r.serviceSlug ?? "",
              serviceTitle: r.serviceTitle ?? "",
              submittedAt: r.app.submittedAt.toISOString(),
              decidedAt: r.app.decidedAt?.toISOString() ?? null,
              feeCents: r.app.feeCents,
              feePaid: !!r.app.feePaidAt,
              data: r.app.data,
            }
          : null,
        issuer: r.issuer,
        verifyUrl,
        qrSvg,
      };
    }),
  );
}

function query() {
  return db
    .select({
      doc: documents,
      citizen: citizens,
      department: departments,
      app: applications,
      serviceSlug: services.slug,
      serviceTitle: services.title,
      issuer: users.displayName,
      avatarUrl: owner.avatarUrl,
    })
    .from(documents)
    .innerJoin(citizens, eq(documents.citizenId, citizens.id))
    .innerJoin(departments, eq(documents.departmentId, departments.id))
    .innerJoin(owner, eq(owner.id, citizens.userId))
    .leftJoin(applications, eq(documents.applicationId, applications.id))
    .leftJoin(services, eq(applications.serviceId, services.id))
    .leftJoin(users, eq(documents.issuedById, users.id))
    .$dynamic();
}

export async function getDocumentForCitizen(citizenId: string, number: string) {
  const rows = await query().where(and(eq(documents.citizenId, citizenId), eq(documents.number, number))).limit(1);

  return (await toRender(rows))[0] ?? null;
}

export async function getDocumentsForCitizen(citizenId: string) {
  return toRender(await query().where(eq(documents.citizenId, citizenId)).orderBy(desc(documents.issuedAt)));
}

/** Für die Verwaltung: Dokument samt Amt (für die Rechteprüfung). */
export async function getDocumentByNumber(number: string) {
  const rows = await query().where(eq(documents.number, number)).limit(1);
  const [doc] = await toRender(rows);

  return doc ? { doc, departmentId: rows[0].doc.departmentId } : null;
}

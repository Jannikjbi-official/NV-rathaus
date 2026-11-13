import type { DocumentType } from "@/db/schema";

/** Alles, was eine Dokumentvorlage zum Rendern braucht (serialisierbar). */
export type DocRender = {
  number: string;
  type: DocumentType;
  title: string;
  details: Record<string, string>;
  issuedAt: string;
  validUntil: string | null;
  state: { label: string; tone: "success" | "warning" | "danger" };
  revokedReason: string | null;
  holder: {
    firstName: string;
    lastName: string;
    birthName: string | null;
    birthDate: string;
    birthPlace: string;
    nationality: string;
    gender: string;
    heightCm: number | null;
    eyeColor: string | null;
    street: string;
    postalCode: string;
    district: string;
    citizenNumber: string;
    maritalStatus: string;
    photoUrl: string | null;
  };
  authority: { name: string; address: string; phone: string };
  application: {
    reference: string;
    serviceSlug: string;
    serviceTitle: string;
    submittedAt: string;
    decidedAt: string | null;
    feeCents: number;
    feePaid: boolean;
    data: Record<string, unknown>;
  } | null;
  issuer: string | null;
  verifyUrl: string;
  qrSvg: string;
};

/** Eine Seite eines Dokuments in Designgröße (px) und Druckgröße (mm). */
export type DocSide = {
  id: string;
  label: string;
  width: number;
  height: number;
  mm: [number, number];
  node: React.ReactNode;
};

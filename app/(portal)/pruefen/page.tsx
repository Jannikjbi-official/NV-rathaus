import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { CircleCheckFill, CircleXmarkFill, TriangleExclamationFill } from "@gravity-ui/icons";
import { Button, Card, Description, Input, Label, TextField } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { citizens, departments, documents } from "@/db/schema";
import { formatLongDate } from "@/lib/format";
import { documentState } from "@/lib/documents";
import { DOCUMENT_TYPES } from "@/lib/status";

export const metadata: Metadata = { title: "Dokument prüfen" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ nr?: string }> }) {
  const nr = (await searchParams).nr?.trim().toUpperCase() ?? "";
  const [hit] = nr
    ? await db
        .select({ doc: documents, firstName: citizens.firstName, lastName: citizens.lastName, birthDate: citizens.birthDate, department: departments.name })
        .from(documents)
        .innerJoin(citizens, eq(documents.citizenId, citizens.id))
        .innerJoin(departments, eq(documents.departmentId, departments.id))
        .where(eq(documents.number, nr))
        .limit(1)
    : [];
  const state = hit ? documentState(hit.doc) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        crumbs={[{ label: "Dokument prüfen" }]}
        description="Prüfen Sie die Echtheit eines von der Stadt ausgestellten Dokuments anhand der Dokumentnummer. Für Polizei, Behörden und Arbeitgeber."
        title="Dokument prüfen"
      />
      <Card>
        <form action="/pruefen" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField className="flex-1" defaultValue={nr} isRequired name="nr">
            <Label>Dokumentnummer</Label>
            <Input className="font-mono uppercase" placeholder="NV-ID-7Q4K21" />
            <Description>Steht auf dem Dokument oben rechts.</Description>
          </TextField>
          <Button className="sm:mb-6" type="submit">Prüfen</Button>
        </form>
      </Card>

      {nr && !hit ? (
        <Result icon={<CircleXmarkFill className="size-6 text-danger" />} title="Kein Dokument gefunden">
          Zu dieser Nummer gibt es kein Dokument der Stadt Nordverkehr. Prüfen Sie die Schreibweise. Bei Verdacht auf Fälschung informieren Sie die Polizei.
        </Result>
      ) : null}

      {hit && state ? (
        <Result
          icon={
            state.tone === "success" ? (
              <CircleCheckFill className="size-6 text-success" />
            ) : state.tone === "warning" ? (
              <TriangleExclamationFill className="size-6 text-warning" />
            ) : (
              <CircleXmarkFill className="size-6 text-danger" />
            )
          }
          title={`${DOCUMENT_TYPES[hit.doc.type].label}: ${state.label}`}
        >
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Item label="Dokument" value={hit.doc.title} />
            <Item label="Nummer" value={hit.doc.number} mono />
            <Item label="Inhaber/in" value={`${hit.firstName} ${hit.lastName}`} />
            <Item label="Geburtsdatum" value={formatLongDate(hit.birthDate)} />
            <Item label="Ausgestellt" value={`${formatLongDate(hit.doc.issuedAt)}, ${hit.department}`} />
            <Item label="Gültig bis" value={hit.doc.validUntil ? formatLongDate(hit.doc.validUntil) : "unbefristet"} />
            {hit.doc.revokedReason ? <Item label="Widerrufsgrund" value={hit.doc.revokedReason} /> : null}
          </dl>
        </Result>
      ) : null}
    </div>
  );
}

function Result({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="mt-4">
      <Card.Header className="flex-row items-center gap-3">
        {icon}
        <Card.Title className="text-lg font-semibold">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="text-sm text-muted">{children}</Card.Content>
    </Card>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`m-0 font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

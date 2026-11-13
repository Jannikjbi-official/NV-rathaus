"use client";

import { PagesViewer } from "./document-viewer";
import { A4_H, A4_MM, A4_W } from "./templates/paper";
import { Invoice, type InvoiceData } from "./templates/invoice";

export function InvoiceViewer({ invoice, toolbar }: { invoice: InvoiceData; toolbar?: React.ReactNode }) {
  return (
    <PagesViewer
      fileName={`${invoice.number}_Gebuehrenrechnung`}
      pdfTitle={`Gebührenrechnung ${invoice.number}`}
      sides={[{ id: "rechnung", label: "Rechnung", width: A4_W, height: A4_H, mm: A4_MM, node: <Invoice inv={invoice} /> }]}
      toolbar={toolbar}
    />
  );
}

"use client";

import { Printer } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

/** Druckt das Dokument; im Druckdialog lässt es sich als PDF speichern. */
export function PrintButton() {
  return (
    <Button className="print:hidden" variant="tertiary" onPress={() => window.print()}>
      <Printer />
      Drucken / PDF
    </Button>
  );
}

/**
 * Formularfelder einer Dienstleistung. Werden im Formular-Builder gepflegt,
 * als JSON in `services.fields` gespeichert und beim Antrag als Snapshot
 * mitgesichert, damit spätere Änderungen alte Anträge nicht verfälschen.
 */
export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "checkboxes",
  "heading",
  "info",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type FormField = {
  /** Schlüssel im Antrag, z. B. "kennzeichen" */
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  /** Felder nebeneinander auf breiten Bildschirmen */
  half?: boolean;
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Textzeile",
  textarea: "Mehrzeiliger Text",
  number: "Zahl",
  date: "Datum",
  select: "Auswahlliste",
  radio: "Einfachauswahl",
  checkbox: "Bestätigung (Häkchen)",
  checkboxes: "Mehrfachauswahl",
  heading: "Zwischenüberschrift",
  info: "Hinweistext",
};

/** Feldtypen, die keine Eingabe erwarten. */
export const DISPLAY_ONLY: FieldType[] = ["heading", "info"];

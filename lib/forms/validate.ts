import { DISPLAY_ONLY, type FormField } from "./types";

export type FieldValue = string | number | boolean | string[] | null;
export type ParseResult =
  | { ok: true; data: Record<string, FieldValue> }
  | { ok: false; errors: Record<string, string> };

const MAX_TEXT = 4000;

/** Prüft eine Formularabgabe gegen die Felddefinition (Server-seitig). */
export function parseSubmission(fields: FormField[], form: FormData): ParseResult {
  const data: Record<string, FieldValue> = {};
  const errors: Record<string, string> = {};

  for (const f of fields) {
    if (DISPLAY_ONLY.includes(f.type)) continue;
    const raw = form.get(f.id);
    const str = typeof raw === "string" ? raw.trim() : "";

    switch (f.type) {
      case "text":
      case "textarea": {
        if (str.length > MAX_TEXT) errors[f.id] = "Der Text ist zu lang.";
        else if (f.required && !str) errors[f.id] = "Bitte ausfüllen.";
        data[f.id] = str || null;
        break;
      }
      case "number": {
        if (!str) {
          if (f.required) errors[f.id] = "Bitte eine Zahl angeben.";
          data[f.id] = null;
          break;
        }
        const n = Number(str.replace(",", "."));

        if (!Number.isFinite(n)) errors[f.id] = "Bitte eine gültige Zahl angeben.";
        else if (f.min !== undefined && n < f.min) errors[f.id] = `Mindestens ${f.min}.`;
        else if (f.max !== undefined && n > f.max) errors[f.id] = `Höchstens ${f.max}.`;
        data[f.id] = n;
        break;
      }
      case "date": {
        if (!str) {
          if (f.required) errors[f.id] = "Bitte ein Datum wählen.";
          data[f.id] = null;
          break;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) errors[f.id] = "Ungültiges Datum.";
        data[f.id] = str;
        break;
      }
      case "select":
      case "radio": {
        if (!str) {
          if (f.required) errors[f.id] = "Bitte eine Option wählen.";
          data[f.id] = null;
          break;
        }
        if (!f.options?.includes(str)) errors[f.id] = "Ungültige Auswahl.";
        data[f.id] = str;
        break;
      }
      case "checkbox": {
        const checked = form.has(f.id);

        if (f.required && !checked) errors[f.id] = "Bitte bestätigen.";
        data[f.id] = checked;
        break;
      }
      case "checkboxes": {
        const values = form
          .getAll(f.id)
          .map(String)
          .filter((v) => f.options?.includes(v));

        if (f.required && values.length === 0) errors[f.id] = "Bitte mindestens eine Option wählen.";
        data[f.id] = values;
        break;
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Lesbarer Wert für Übersichten und Discord-Nachrichten. */
export function displayValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "–";
  switch (field.type) {
    case "checkbox":
      return value ? "Ja" : "Nein";
    case "checkboxes":
      return Array.isArray(value) && value.length ? value.join(", ") : "–";
    case "date": {
      const [y, m, d] = String(value).split("-");

      return d ? `${d}.${m}.${y}` : String(value);
    }
    case "number":
      return new Intl.NumberFormat("de-DE").format(Number(value));
    default:
      return String(value);
  }
}

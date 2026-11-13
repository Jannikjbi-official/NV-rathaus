import type { FormField } from "@/lib/forms/types";

type Opts = Partial<Omit<FormField, "id" | "type" | "label">>;

const f =
  (type: FormField["type"]) =>
  (id: string, label: string, opts: Opts = {}): FormField => ({
    id,
    type,
    label,
    required: type === "heading" || type === "info" ? undefined : (opts.required ?? true),
    ...opts,
  });

export const text = f("text");
export const textarea = f("textarea");
export const number = f("number");
export const date = f("date");
export const select = (id: string, label: string, options: string[], opts: Opts = {}) =>
  f("select")(id, label, { options, ...opts });
export const radio = (id: string, label: string, options: string[], opts: Opts = {}) =>
  f("radio")(id, label, { options, ...opts });
export const checkboxes = (id: string, label: string, options: string[], opts: Opts = {}) =>
  f("checkboxes")(id, label, { options, ...opts });
export const confirm = (id: string, label: string, opts: Opts = {}) => f("checkbox")(id, label, opts);
export const heading = (id: string, label: string) => f("heading")(id, label);
export const info = (id: string, label: string, description?: string) =>
  f("info")(id, label, { description });

export const DISTRICTS = [
  "Altona",
  "Bahrenfeld",
  "Barmbek",
  "Billstedt",
  "Eimsbüttel",
  "Harburg",
  "HafenCity",
  "Ottensen",
  "St. Georg",
  "St. Pauli",
  "Wandsbek",
  "Wilhelmsburg",
];

export const EYE_COLORS = ["blau", "braun", "grau", "grün", "grünbraun", "blaugrau"];

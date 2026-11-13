const TZ = "Europe/Berlin";

export function formatEuro(cents: number) {
  if (cents === 0) return "gebührenfrei";

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

type DateInput = Date | string | null | undefined;

const toDate = (d: DateInput) => (d ? (typeof d === "string" ? new Date(d) : d) : null);

export function formatDate(d: DateInput, opts: Intl.DateTimeFormatOptions = {}) {
  const date = toDate(d);

  if (!date) return "–";

  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ, ...opts }).format(date);
}

export function formatLongDate(d: DateInput) {
  return formatDate(d, { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(d: DateInput) {
  const date = toDate(d);

  if (!date) return "–";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function formatTime(d: DateInput) {
  const date = toDate(d);

  if (!date) return "–";

  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(date);
}

export function formatRelative(d: DateInput) {
  const date = toDate(d);

  if (!date) return "–";
  const diff = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });
  const abs = Math.abs(diff);

  if (abs < 60) return "gerade eben";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");

  return formatDate(date);
}

/** "Heute 16:00–23:00" aus den Öffnungszeiten eines Amts. */
export function openingStatus(hours: { days: { day: number; open: string; close: string }[]; note?: string }, now = new Date()) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const today = hours.days.find((d) => d.day === local.getDay());

  if (!today) return { open: false, label: "heute geschlossen", tone: "default" as const };

  const minutes = local.getHours() * 60 + local.getMinutes();
  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  const open = minutes >= oh * 60 + om && minutes < ch * 60 + cm;

  if (open) return { open, label: `geöffnet bis ${today.close}`, tone: "success" as const };
  if (minutes < oh * 60 + om) return { open, label: `öffnet um ${today.open}`, tone: "warning" as const };

  return { open, label: "heute geschlossen", tone: "default" as const };
}

export const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

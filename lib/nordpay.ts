/**
 * NordPay – fiktiver Zahlungsdienst im Roleplay-Projekt Nordverkehr.
 *
 * Es werden keine echten Zahlungen ausgeführt. NordPay-Karten beginnen mit
 * der Ziffer 9 (nach ISO/IEC 7812 für nationale Zwecke reserviert, keinem
 * echten Kartennetz zugeordnet). Nummern, die wie echte Karten aussehen
 * (Visa, Mastercard, Amex …), werden schon im Browser abgelehnt und nie
 * an den Server geschickt. Gespeichert werden nur die letzten vier Ziffern.
 *
 * Diese Datei läuft im Browser und auf dem Server.
 */

export const NORDPAY = {
  name: "NordPay",
  bank: "Stadtbank Nordverkehr",
  secure: "NordSecure",
  iin: "927600",
  codeTtlMinutes: 5,
  maxAttempts: 3,
  disclaimer:
    "NordPay ist ein fiktiver Zahlungsdienst im Roleplay-Projekt Nordverkehr. Es werden keine echten Zahlungen ausgeführt. Geben Sie niemals echte Kartendaten ein.",
} as const;

export const STADTKASSE = {
  name: "Stadtkasse Nordverkehr",
  bank: "Stadtbank Nordverkehr",
  iban: "NV27 9276 0000 0115 0000 00",
  bic: "SBNVNVHHXXX",
};

export const digitsOnly = (v: string) => v.replace(/\D/g, "");

export function luhnValid(number: string) {
  const d = digitsOnly(number);
  let sum = 0;

  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);

    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }

  return d.length > 0 && sum % 10 === 0;
}

function luhnDigit(partial: string) {
  for (let c = 0; c <= 9; c++) if (luhnValid(partial + c)) return String(c);

  return "0";
}

/** Erkennt Nummernkreise echter Kartennetze (nur zur Warnung, nichts wird gespeichert). */
export function realNetwork(number: string): string | null {
  const d = digitsOnly(number);

  if (!d) return null;
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "American Express";
  if (/^3(0[0-5]|[68])/.test(d)) return "Diners Club";
  if (/^35/.test(d)) return "JCB";
  if (/^62/.test(d)) return "UnionPay";
  if (/^(6011|65|64[4-9])/.test(d)) return "Discover";
  if (/^(50|5[6-9]|6)/.test(d)) return "Maestro";
  if (/^[1-8]/.test(d)) return "eine echte Karte";

  return null;
}

export const formatCardNumber = (v: string) =>
  digitsOnly(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

export const maskCard = (last4: string) => `•••• •••• •••• ${last4}`;

export type CardInput = { number: string; holder: string; expiry: string; cvc: string };
export type CardErrors = Partial<Record<keyof CardInput, string>>;

/** Prüft Kartendaten. Leeres Ergebnis = gültig. */
export function validateCard(input: CardInput, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const number = digitsOnly(input.number);
  const network = realNetwork(number);

  if (network) errors.number = `Das sieht nach ${network} aus. Hier gehen nur fiktive NordPay-Karten (beginnen mit 9). Bitte niemals echte Kartendaten eingeben.`;
  else if (number.length !== 16) errors.number = "Die Kartennummer hat 16 Stellen.";
  else if (!number.startsWith("9")) errors.number = "NordPay-Karten beginnen mit 9.";
  else if (!luhnValid(number)) errors.number = "Die Kartennummer ist ungültig (Prüfziffer).";

  if (input.holder.trim().length < 3) errors.holder = "Bitte den Namen auf der Karte angeben.";

  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(input.expiry.trim());

  if (!m) errors.expiry = "Format MM/JJ.";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);

    if (month < 1 || month > 12) errors.expiry = "Ungültiger Monat.";
    else if (year * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1) errors.expiry = "Die Karte ist abgelaufen.";
  }

  if (!/^\d{3}$/.test(input.cvc.trim())) errors.cvc = "Drei Ziffern.";

  return errors;
}

/** Einfacher, stabiler Hash (FNV-1a) für die Ableitung der persönlichen Karte. */
function fnv(text: string) {
  let h = 0x811c9dc5;

  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return h;
}

function digitsFrom(seed: string, length: number) {
  let out = "";
  let i = 0;

  while (out.length < length) out += String(fnv(`${seed}:${i++}`)).padStart(10, "0").slice(-5);

  return out.slice(0, length);
}

/**
 * Persönliche NordPay-Karte eines Bürgers, fest aus der Bürgernummer abgeleitet.
 * Rein fiktiv: Sie existiert nur in diesem Rollenspiel.
 */
export function citizenCard(citizenNumber: string, holder: string, now = new Date()) {
  const body = NORDPAY.iin + digitsFrom(citizenNumber, 9);
  const number = body + luhnDigit(body);
  const month = (fnv(`${citizenNumber}:m`) % 12) + 1;
  const year = (now.getFullYear() % 100) + 3;

  return {
    number: formatCardNumber(number),
    holder: holder.toUpperCase(),
    expiry: `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}`,
    cvc: digitsFrom(`${citizenNumber}:cvc`, 3),
  };
}

export type NordPayCard = ReturnType<typeof citizenCard>;

/** Rechnungsnummer aus dem Aktenzeichen: AZ 2026-004800 → RE-2026-004800. */
export const invoiceNumber = (reference: string) => `RE-${reference.replace(/^AZ\s*/, "")}`;

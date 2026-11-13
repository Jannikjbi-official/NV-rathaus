/**
 * Maschinenlesbare Zone nach ICAO 9303 (TD1 = Ausweiskarte, TD3 = Reisepass)
 * mit echten Prüfziffern. Staatenkürzel des fiktiven Nordverkehr: "NVK".
 */

export const STATE_CODE = "NVK";

const TRANSLIT: Record<string, string> = { Ä: "AE", Ö: "OE", Ü: "UE", ß: "SS", É: "E", È: "E", Á: "A", À: "A", Ó: "O", Ú: "U", Ñ: "N", Ç: "C" };

export function mrzText(s: string) {
  return s
    .toUpperCase()
    .replace(/[ÄÖÜßÉÈÁÀÓÚÑÇ]/g, (c) => TRANSLIT[c] ?? c)
    .replace(/[^A-Z0-9]/g, "<");
}

function charValue(c: string) {
  if (c === "<") return 0;
  if (/[0-9]/.test(c)) return Number(c);

  return c.charCodeAt(0) - 55; // A=10 … Z=35
}

export function checkDigit(s: string) {
  const weights = [7, 3, 1];

  return String([...s].reduce((sum, c, i) => sum + charValue(c) * weights[i % 3], 0) % 10);
}

const pad = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);

/** "1991-03-14" → "910314" */
export function mrzDate(iso: string | null | undefined) {
  if (!iso) return "<<<<<<";
  const [y, m, d] = iso.slice(0, 10).split("-");

  return `${y.slice(2)}${m}${d}`;
}

export function mrzSex(gender: string | null | undefined) {
  if (gender === "männlich") return "M";
  if (gender === "weiblich") return "F";

  return "X";
}

/** "NV-ID-7Q4K21" → "ID7Q4K21" */
export function mrzDocNumber(number: string) {
  return mrzText(number.replace(/^NV-/, "").replace(/-/g, "")).slice(0, 9);
}

function mrzName(lastName: string, firstNames: string, length: number) {
  return pad(`${mrzText(lastName)}<<${mrzText(firstNames)}`, length);
}

type MrzInput = {
  number: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  expiry: string | null;
  gender: string;
  optional?: string;
};

/** Ausweiskarte: 3 Zeilen à 30 Zeichen */
export function mrzTD1(p: MrzInput) {
  const doc = pad(mrzDocNumber(p.number), 9);
  const line1 = pad(`ID${STATE_CODE}${doc}${checkDigit(doc)}${pad(mrzText(p.optional ?? ""), 15)}`, 30);
  const birth = mrzDate(p.birthDate);
  const exp = mrzDate(p.expiry);
  const head = `${birth}${checkDigit(birth)}${mrzSex(p.gender)}${exp}${checkDigit(exp)}${STATE_CODE}${"<".repeat(11)}`;
  const composite = checkDigit(line1.slice(5, 30) + head.slice(0, 7) + head.slice(8, 15) + head.slice(18, 29));
  const line2 = `${head}${composite}`;

  return [line1, line2, mrzName(p.lastName, p.firstName, 30)];
}

/** Reisepass: 2 Zeilen à 44 Zeichen */
export function mrzTD3(p: MrzInput) {
  const line1 = `P<${STATE_CODE}${mrzName(p.lastName, p.firstName, 39)}`;
  const doc = pad(mrzDocNumber(p.number), 9);
  const birth = mrzDate(p.birthDate);
  const exp = mrzDate(p.expiry);
  const personal = pad(mrzText(p.optional ?? ""), 14);
  const personalCheck = personal === "<".repeat(14) ? "<" : checkDigit(personal);
  const body = `${doc}${checkDigit(doc)}${STATE_CODE}${birth}${checkDigit(birth)}${mrzSex(p.gender)}${exp}${checkDigit(exp)}${personal}${personalCheck}`;
  const composite = checkDigit(body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 43));

  return [line1, `${body}${composite}`];
}

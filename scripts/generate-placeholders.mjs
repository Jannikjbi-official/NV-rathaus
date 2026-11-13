// Erzeugt Platzhalter-Illustrationen (SVG) für Nachrichten und Bühne.
// Werden ersetzt, sobald echte Screenshots/Pressefotos hochgeladen werden.
// Aufruf: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 900;

const PALETTES = {
  dusk: { sky: ["#1c2a44", "#c8644a", "#f2b46a"], water: ["#3a3346", "#141824"], sil: "#151a26", sil2: "#2a2c3e", glow: "#ffd28a", sun: "#ffcf7a", sunAlpha: 0.75 },
  day: { sky: ["#7fa7cf", "#bcd3e6", "#e9eef2"], water: ["#6b8aa3", "#3d566b"], sil: "#3b4652", sil2: "#7d8b97", glow: "#ffffff", sun: "#fff6dc", sunAlpha: 0.35 },
  night: { sky: ["#070b17", "#16213b", "#2c3355"], water: ["#141a2e", "#06080f"], sil: "#05070d", sil2: "#141a2c", glow: "#ffbf5e", sun: "#e9edf7", sunAlpha: 0.5 },
};

function rng(seed) {
  let s = seed;

  return () => {
    s = (s * 9301 + 49297) % 233280;

    return s / 233280;
  };
}

const f = (n) => Math.round(n * 10) / 10;

function skyline(r, base, color, scale, lights, glow) {
  let out = "";
  let x = 0;

  while (x < W) {
    const bw = (36 + r() * 92) * scale;
    const bh = (60 + r() * 180) * scale;

    out += `<rect x="${f(x)}" y="${f(base - bh)}" width="${f(bw + 1)}" height="${f(bh)}" fill="${color}"/>`;
    if (r() < 0.18) {
      out += `<polygon points="${f(x + bw * 0.3)},${f(base - bh)} ${f(x + bw * 0.5)},${f(base - bh - 120 * scale * (0.6 + r()))} ${f(x + bw * 0.7)},${f(base - bh)}" fill="${color}"/>`;
    }
    if (lights) {
      for (let yy = base - bh + 12 * scale; yy < base - 12; yy += 18 * scale) {
        for (let xx = x + 8 * scale; xx < x + bw - 8; xx += 16 * scale) {
          if (r() < 0.32) {
            out += `<rect x="${f(xx)}" y="${f(yy)}" width="${f(6 * scale)}" height="${f(8 * scale)}" fill="${glow}" opacity="${f(0.5 + r() * 0.5)}"/>`;
          }
        }
      }
    }
    x += bw;
  }

  return out;
}

function rathaus(cx, base, s, color, roof) {
  return [
    `<rect x="${f(cx - 180 * s)}" y="${f(base - 140 * s)}" width="${f(360 * s)}" height="${f(140 * s)}" fill="${color}"/>`,
    `<polygon points="${f(cx - 192 * s)},${f(base - 140 * s)} ${f(cx)},${f(base - 200 * s)} ${f(cx + 192 * s)},${f(base - 140 * s)}" fill="${color}"/>`,
    `<rect x="${f(cx - 28 * s)}" y="${f(base - 300 * s)}" width="${f(56 * s)}" height="${f(300 * s)}" fill="${color}"/>`,
    `<polygon points="${f(cx - 32 * s)},${f(base - 300 * s)} ${f(cx)},${f(base - 430 * s)} ${f(cx + 32 * s)},${f(base - 300 * s)}" fill="${roof}"/>`,
    `<rect x="${f(cx - 3 * s)}" y="${f(base - 464 * s)}" width="${f(6 * s)}" height="${f(40 * s)}" fill="${color}"/>`,
  ].join("");
}

function crane(x, base, s, color) {
  const l = [
    [x, base, x, base - 300 * s],
    [x - 60 * s, base - 280 * s, x + 220 * s, base - 280 * s],
    [x, base - 300 * s, x + 140 * s, base - 280 * s],
    [x + 180 * s, base - 280 * s, x + 180 * s, base - 180 * s],
  ];
  let out = l
    .map(([a, b, c, d]) => `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(d)}" stroke="${color}" stroke-width="${f(6 * s)}"/>`)
    .join("");

  for (let i = 0; i < 6; i++) {
    out += `<line x1="${f(x - 12 * s)}" y1="${f(base - i * 50 * s)}" x2="${f(x + 12 * s)}" y2="${f(base - (i + 1) * 50 * s)}" stroke="${color}" stroke-width="${f(3 * s)}"/>`;
  }

  return out;
}

function scene({ kind, palette, seed }) {
  const p = PALETTES[palette];
  const r = rng(seed);
  const hz = H * (kind === "street" ? 0.58 : 0.66);
  let body = "";

  const defs = `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="0.62" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/></linearGradient>
    <radialGradient id="sun" cx="0.72" cy="${f((hz - 120) / H)}" r="0.3"><stop offset="0" stop-color="${p.sun}" stop-opacity="${p.sunAlpha}"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.water[0]}"/><stop offset="1" stop-color="${p.water[1]}"/></linearGradient>
  </defs>`;

  body += `<rect width="${W}" height="${H}" fill="url(#sky)"/><rect width="${W}" height="${H}" fill="url(#sun)"/>`;

  if (palette === "night") {
    for (let i = 0; i < 140; i++) {
      body += `<rect x="${f(r() * W)}" y="${f(r() * hz * 0.7)}" width="2" height="2" fill="#fff" opacity="${f(0.2 + r() * 0.6)}"/>`;
    }
  }

  body += skyline(r, hz, p.sil2, 0.8, false);

  if (kind === "rathaus") {
    body += skyline(r, hz + 28, p.sil, 1, false);
    body += `<rect x="0" y="${f(hz + 80)}" width="${W}" height="${f(H - hz)}" fill="#9aa3a8"/>`;
    for (let k = 0; k < W; k += 68) body += `<rect x="${k}" y="${f(hz + 80)}" width="2" height="${f(H - hz)}" fill="#8a9397"/>`;
    body += rathaus(W * 0.5, hz + 80, 1.25, p.sil, "#4f7d6e");
    for (let i = 0; i < 5; i++) {
      const fx = W * 0.5 - 260 + i * 130;

      body += `<rect x="${fx}" y="${f(hz - 180)}" width="4" height="260" fill="#c41e1e"/><rect x="${fx + 4}" y="${f(hz - 180)}" width="52" height="32" fill="#c41e1e"/>`;
    }
  } else if (kind === "street") {
    body += skyline(r, hz, p.sil, 1.1, false);
    body += `<polygon points="0,${H} ${W * 0.42},${hz} ${W * 0.58},${hz} ${W},${H}" fill="#4a4f56"/>`;
    body += `<line x1="${W / 2}" y1="${hz}" x2="${W / 2}" y2="${H}" stroke="#e9e3d0" stroke-width="6" stroke-dasharray="44 44"/>`;
    for (let b = 0; b < 3; b++) {
      const by = hz + (H - hz) * (0.3 + b * 0.22);
      const bw = (180 + b * 140);
      const bx = W / 2 - bw / 2;
      const bh = 20 + b * 12;

      for (let st = 0; st < 8; st++) {
        body += `<rect x="${f(bx + (st * bw) / 8)}" y="${f(by)}" width="${f(bw / 8 + 1)}" height="${bh}" fill="${st % 2 ? "#ffffff" : "#c41e1e"}"/>`;
      }
      body += `<rect x="${f(bx + 8)}" y="${f(by + bh)}" width="6" height="${f(28 * (1 + b * 0.4))}" fill="#222"/><rect x="${f(bx + bw - 14)}" y="${f(by + bh)}" width="6" height="${f(28 * (1 + b * 0.4))}" fill="#222"/>`;
      body += `<circle cx="${f(bx + 12)}" cy="${f(by - 8)}" r="${f(7 * (1 + b * 0.3))}" fill="#ffb23f"/>`;
    }
  } else {
    body += crane(W * 0.08, hz, 1, p.sil) + crane(W * 0.2, hz, 0.8, p.sil) + crane(W * 0.88, hz, 0.9, p.sil);
    body += skyline(r, hz, p.sil, 1, palette !== "day", p.glow);
    body += rathaus(W * 0.55, hz, 0.7, p.sil, palette === "night" ? "#1d2b2a" : "#2f4741");
    body += `<rect x="0" y="${f(hz)}" width="${W}" height="${f(H - hz)}" fill="url(#water)"/>`;
    for (let j = 0; j < 160; j++) {
      const yy = hz + 6 + Math.pow(r(), 1.6) * (H - hz);
      const warm = r() < 0.5;

      body += `<rect x="${f(r() * W)}" y="${f(yy)}" width="${f(20 + r() * 120)}" height="2.5" fill="${warm ? "#ffd28c" : "#ffffff"}" opacity="${warm ? (palette === "day" ? 0.08 : 0.22) : 0.06}"/>`;
    }
    const sx = W * 0.3;
    const sy = hz + 60;

    body += `<polygon points="${sx},${sy} ${sx + 380},${sy} ${sx + 350},${sy + 32} ${sx + 24},${sy + 32}" fill="${p.sil}"/>`;
    body += `<rect x="${sx + 80}" y="${sy - 36}" width="140" height="36" fill="${p.sil}"/><rect x="${sx + 120}" y="${sy - 64}" width="28" height="28" fill="${p.sil}"/><rect x="${sx + 116}" y="${sy - 76}" width="36" height="12" fill="#c41e1e"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${defs}${body}</svg>\n`;
}

const IMAGES = {
  "hafen-abend": { kind: "harbor", palette: "dusk", seed: 5 },
  "hafen-tag": { kind: "harbor", palette: "day", seed: 21 },
  "hafen-nacht": { kind: "harbor", palette: "night", seed: 13 },
  "rathausmarkt": { kind: "rathaus", palette: "day", seed: 9 },
  "strassensperrung": { kind: "street", palette: "day", seed: 4 },
};

mkdirSync("public/images", { recursive: true });
for (const [name, opts] of Object.entries(IMAGES)) {
  writeFileSync(`public/images/${name}.svg`, scene(opts));
}
console.log(`Wrote ${Object.keys(IMAGES).length} placeholder images to public/images`);

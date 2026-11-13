/* eslint-disable @next/next/no-img-element */
import { Seal } from "@/components/brand/seal";

/** Hypotrochoide (Spirograph) als SVG-Pfad – Grundlage der Guilloche-Muster. */
function hypotrochoid(cx: number, cy: number, R: number, r: number, d: number, steps = 1400) {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const turns = r / gcd(R, r);
  const pts: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);

    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `M${pts.join("L")}`;
}

/** Rosette aus mehreren Guilloche-Bahnen. */
export function Rosette({ cx, cy, size, color, opacity = 0.35, strokeWidth = 0.6 }: { cx: number; cy: number; size: number; color: string; opacity?: number; strokeWidth?: number }) {
  const s = size / 100;

  return (
    <g fill="none" opacity={opacity} stroke={color} strokeWidth={strokeWidth}>
      <path d={hypotrochoid(cx, cy, 100 * s, 37 * s, 58 * s)} />
      <path d={hypotrochoid(cx, cy, 90 * s, 23 * s, 44 * s)} />
      <path d={hypotrochoid(cx, cy, 70 * s, 19 * s, 26 * s)} />
    </g>
  );
}

/** Feine Wellenlinien quer über das Dokument. */
export function Waves({ width, height, color, lines = 28, amplitude = 14, opacity = 0.22, period = 220 }: { width: number; height: number; color: string; lines?: number; amplitude?: number; opacity?: number; period?: number }) {
  const paths: string[] = [];

  for (let l = 0; l < lines; l++) {
    const y0 = (height / lines) * l + height / lines / 2;
    const phase = l * 0.55;
    const pts: string[] = [];

    for (let x = -10; x <= width + 10; x += 8) {
      pts.push(`${x},${(y0 + Math.sin((x / period) * Math.PI * 2 + phase) * amplitude + Math.sin((x / (period / 3.1)) + phase) * amplitude * 0.25).toFixed(1)}`);
    }
    paths.push(`M${pts.join("L")}`);
  }

  return (
    <g fill="none" opacity={opacity} stroke={color} strokeWidth={0.7}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** Hintergrund mit Verlauf, Wellen und Rosette. */
export function SecurityBackground({
  width,
  height,
  from,
  to,
  line,
  rosette,
}: {
  width: number;
  height: number;
  from: string;
  to: string;
  line: string;
  rosette?: { cx: number; cy: number; size: number };
}) {
  return (
    <svg aria-hidden className="absolute inset-0" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
      <defs>
        <linearGradient id={`bg-${from}-${to}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect fill={`url(#bg-${from}-${to})`} height={height} width={width} />
      <Waves color={line} height={height} width={width} />
      {rosette ? <Rosette color={line} cx={rosette.cx} cy={rosette.cy} size={rosette.size} /> : null}
    </svg>
  );
}

/** Schillerndes Sicherheitsmerkmal mit Stadtsiegel. */
export function Hologram({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      className={`absolute overflow-hidden rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 30deg, rgba(255,120,170,.35), rgba(120,200,255,.35), rgba(160,255,190,.32), rgba(255,230,120,.32), rgba(200,140,255,.35), rgba(255,120,170,.35))",
        mixBlendMode: "multiply",
        ...style,
      }}
    >
      <Seal className="absolute inset-[8%] text-white/70" style={{ width: "84%", height: "84%" }} title="" />
    </div>
  );
}

/** Lichtbild (Discord-Avatar) oder Silhouette. */
export function Photo({ src, width, height, radius = 8, ghost = false }: { src: string | null; width: number; height: number; radius?: number; ghost?: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(180deg,#d9dde3,#bfc6cf)",
        opacity: ghost ? 0.28 : 1,
        boxShadow: ghost ? undefined : "inset 0 0 0 1px rgba(0,0,0,.08)",
      }}
    >
      {src ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
          src={src}
          style={{ filter: ghost ? "grayscale(1) contrast(1.4)" : "grayscale(.85) contrast(1.08) brightness(1.03)" }}
        />
      ) : (
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 60 78">
          <circle cx="30" cy="30" fill="#8d96a3" r="14" />
          <path d="M4 78c2-18 13-28 26-28s24 10 26 28z" fill="#8d96a3" />
        </svg>
      )}
    </div>
  );
}

export function Signature({ name, size = 34, color = "#1b2a4a" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="whitespace-nowrap leading-none" style={{ fontFamily: "var(--font-signature)", fontSize: size, color }}>
      {name}
    </span>
  );
}

/** Beschriftetes Feld im Ausweisstil (zweisprachig). */
export function Field({
  label,
  en,
  value,
  size = 22,
  labelSize = 11,
  color = "#1d1a1f",
  labelColor = "#5c6470",
  mono,
  className,
}: {
  label: string;
  en?: string;
  value: React.ReactNode;
  size?: number;
  labelSize?: number;
  color?: string;
  labelColor?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="uppercase leading-tight tracking-[0.06em]" style={{ fontSize: labelSize, color: labelColor }}>
        {label}
        {en ? <span className="italic normal-case tracking-normal opacity-80"> / {en}</span> : null}
      </div>
      <div className="font-semibold leading-tight" style={{ fontSize: size, color, fontFamily: mono ? "var(--font-mrz)" : undefined }}>
        {value}
      </div>
    </div>
  );
}

/** Mikroschrift-Linie (wiederholter Text in winziger Schrift). */
export function MicroText({ text, width, color = "#9a3a3a", top, left = 0 }: { text: string; width: number; color?: string; top: number; left?: number }) {
  return (
    <div
      aria-hidden
      className="absolute overflow-hidden whitespace-nowrap uppercase"
      style={{ top, left, width, fontSize: 5.5, letterSpacing: 0.6, color, opacity: 0.7, lineHeight: 1 }}
    >
      {Array.from({ length: 40 }, () => text).join(" · ")}
    </div>
  );
}

/** Runder Amtsstempel in Stempelfarbe. */
export function Stamp({ size, color = "#2d4f9e", authority, rotate = -9 }: { size: number; color?: string; authority: string; rotate?: number }) {
  const id = `stamp-${authority.replace(/\W/g, "")}`;

  return (
    <svg
      aria-hidden
      height={size}
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.78, mixBlendMode: "multiply" }}
      viewBox="0 0 200 200"
      width={size}
    >
      <defs>
        <path d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" id={id} />
        <filter id={`${id}-ink`}>
          <feTurbulence baseFrequency="0.9" numOctaves="2" result="noise" type="fractalNoise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
        </filter>
      </defs>
      <g fill="none" filter={`url(#${id}-ink)`} stroke={color}>
        <circle cx="100" cy="100" r="94" strokeWidth="5" />
        <circle cx="100" cy="100" r="60" strokeWidth="2.5" />
        <text fill={color} fontFamily="Inter, Arial, sans-serif" fontSize="17" fontWeight="700" letterSpacing="2" stroke="none">
          <textPath href={`#${id}`} lengthAdjust="spacing" textLength="455">
            {`STADT NORDVERKEHR · ${authority.toUpperCase()} ·`}
          </textPath>
        </text>
      </g>
      <g filter={`url(#${id}-ink)`} transform="translate(52 52) scale(0.8)">
        <Seal height={120} style={{ color }} title="" width={120} />
      </g>
    </svg>
  );
}

export function SealMark({ size, color = "#c41e1e", className, style }: { size: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return <Seal className={className} height={size} style={{ color, ...style }} title="" width={size} />;
}

export function Qr({ svg, size }: { svg: string; size: number }) {
  return <div aria-label="QR-Code zur Echtheitsprüfung" dangerouslySetInnerHTML={{ __html: svg }} role="img" style={{ width: size, height: size }} />;
}

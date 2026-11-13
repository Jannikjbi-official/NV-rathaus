"use client";

import { useState } from "react";

import type { DailyPoint } from "@/lib/admin-stats";

const W = 760;
const H = 230;
const PAD = { top: 12, right: 8, bottom: 26, left: 30 };
const SERIES = [
  { key: "received", label: "Eingegangen", color: "var(--chart-1)" },
  { key: "decided", label: "Entschieden", color: "var(--chart-2)" },
] as const;

function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  const m = Math.ceil(n / step) * step;

  return m % 4 === 0 ? m : Math.ceil(m / 4) * 4;
}

/** Balken mit 4px gerundetem Ende, unten an der Grundlinie verankert. */
function bar(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);

  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function ActivityChart({ data, title }: { data: DailyPoint[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.flatMap((d) => [d.received, d.decided])));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(14, (slot - 10) / 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const totals = SERIES.map((s) => data.reduce((a, d) => a + d[s.key], 0));

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="text-sm font-medium">{title}</figcaption>
        <div className="flex gap-4 text-xs text-muted" aria-hidden>
          {SERIES.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
              {s.label} <span className="font-medium tabular-nums text-foreground">{totals[i]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg aria-hidden className="block h-auto w-full" viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const v = Math.round(max * t);

            return (
              <g key={t}>
                <line stroke="var(--separator)" strokeWidth={1} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
                <text className="fill-muted" fontSize={10} textAnchor="end" x={PAD.left - 6} y={y(v) + 3}>
                  {v}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const cx = PAD.left + slot * i + slot / 2;

            return (
              <g key={d.day} opacity={hover === null || hover === i ? 1 : 0.45}>
                {SERIES.map((s, k) => {
                  const val = d[s.key];
                  const x = cx - barW - 1 + k * (barW + 2);

                  return <path key={s.key} d={bar(x, y(val), barW, PAD.top + plotH - y(val))} fill={s.color} />;
                })}
                {i % 2 === data.length % 2 || i === data.length - 1 ? (
                  <text className="fill-muted" fontSize={10} textAnchor="middle" x={cx} y={H - 8}>
                    {d.label}
                  </text>
                ) : null}
                <rect fill="transparent" height={plotH + 10} width={slot} x={cx - slot / 2} y={PAD.top} onMouseEnter={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {hover !== null ? (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-xl bg-overlay px-3 py-2 text-xs shadow-overlay"
            style={{ left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%` }}
          >
            <p className="mb-1 font-medium">{data[hover].label}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
                <span className="text-muted">{s.label}</span>
                <span className="ml-auto pl-3 font-medium tabular-nums">{data[hover][s.key]}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Tag</th>
            <th>Eingegangen</th>
            <th>Entschieden</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{d.label}</td>
              <td>{d.received}</td>
              <td>{d.decided}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

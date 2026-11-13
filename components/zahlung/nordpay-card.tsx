"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { NordPayLogo, NordStar } from "./brand";

import { formatCardNumber } from "@/lib/nordpay";

type Props = {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
  flipped: boolean;
  focus?: "number" | "holder" | "expiry" | "cvc" | null;
  warning?: boolean;
};

const W = 380;
const H = 240;

function Chip() {
  return (
    <svg aria-hidden height="36" viewBox="0 0 48 36" width="48">
      <defs>
        <linearGradient id="np-chip" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f6e2a6" />
          <stop offset=".5" stopColor="#d4ac55" />
          <stop offset="1" stopColor="#f2d58c" />
        </linearGradient>
      </defs>
      <rect fill="url(#np-chip)" height="34" rx="6" stroke="#a8823a" strokeWidth=".8" width="46" x="1" y="1" />
      <path d="M1 12h14M1 24h14M33 12h14M33 24h14M15 1v34M33 1v34M15 18h18" fill="none" stroke="#a8823a" strokeWidth=".9" />
    </svg>
  );
}

function Contactless() {
  return (
    <svg aria-hidden fill="none" height="26" stroke="rgba(255,255,255,.85)" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="26">
      <path d="M7 8.5a5 5 0 0 1 0 7" />
      <path d="M10.5 6a8.5 8.5 0 0 1 0 12" />
      <path d="M14 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

function Guilloche() {
  return (
    <svg aria-hidden className="absolute inset-0" height={H} viewBox={`0 0 ${W} ${H}`} width={W}>
      {Array.from({ length: 18 }, (_, i) => {
        const y = 30 + i * 12;
        let d = `M -10 ${y}`;

        for (let x = -10; x <= W + 10; x += 10) d += ` L ${x} ${y + Math.sin((x + i * 17) / 34) * 9 + Math.cos((x - i * 9) / 71) * 6}`;

        return <path key={i} d={d} fill="none" stroke="#7fd3e0" strokeOpacity={0.09 + (i % 3) * 0.02} strokeWidth=".8" />;
      })}
      <circle cx={W - 40} cy={40} fill="#ffffff" fillOpacity=".04" r="120" />
      <circle cx={W - 10} cy={H} fill="#c41e1e" fillOpacity=".18" r="90" />
    </svg>
  );
}

/** Fiktive NordPay-Karte mit 3D-Wendung und Neigung zur Maus. */
export function NordPayCard({ number, holder, expiry, cvc, flipped, focus, warning }: Props) {
  const tilt = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = stage.current;

    if (!el) return;
    const update = () => setScale(el.clientWidth / W);
    const ro = new ResizeObserver(update);

    update();
    ro.observe(el);

    return () => ro.disconnect();
  }, []);
  const digits = number.replace(/\D/g, "").slice(0, 16);
  const shown = (formatCardNumber(digits) + "•••• •••• •••• ••••".slice(formatCardNumber(digits).length)).trim();
  const ring = (f: Props["focus"]) => (focus === f ? "outline outline-2 outline-offset-4 outline-white/60" : "");

  const onMove = (e: React.PointerEvent) => {
    const el = tilt.current;

    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;

    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const onLeave = () => {
    tilt.current?.style.setProperty("--rx", "0deg");
    tilt.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={stage} className="np-card-stage mx-auto w-full" style={{ maxWidth: W, aspectRatio: `${W} / ${H}` }} onPointerLeave={onLeave} onPointerMove={onMove}>
      <div ref={tilt} className="np-card-tilt">
        <div className={`np-card ${flipped ? "np-card-flipped" : ""}`}>
          {/* Vorderseite */}
          <div
            className={`np-card-face overflow-hidden text-white ${warning ? "np-card-warning" : ""}`}
            style={{ background: "linear-gradient(135deg,#0b2740 0%,#0e3a5c 45%,#11707f 100%)" }}
          >
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
              <Guilloche />
              <div className="np-card-glare" />
              <div className="absolute left-6 top-5 flex flex-col gap-0.5">
                <NordPayLogo inverted size={20} />
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-white/70">Stadtbank Nordverkehr</span>
              </div>
              <div className="absolute right-6 top-6 flex items-center gap-2">
                <span className="rounded-full border border-white/40 px-2 py-[1px] text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85">RP · Fiktiv</span>
                <Contactless />
              </div>
              <div className="absolute left-6 top-[86px]">
                <Chip />
              </div>
              <div className={`absolute left-6 top-[136px] rounded-md px-1 font-mono text-[25px] tracking-[0.08em] [text-shadow:0_1px_1px_rgba(0,0,0,.45)] ${ring("number")}`}>
                {shown}
              </div>
              <div className={`absolute bottom-5 left-6 max-w-[220px] rounded-md px-1 ${ring("holder")}`}>
                <div className="text-[8.5px] uppercase tracking-[0.2em] text-white/60">Karteninhaber</div>
                <div className="truncate text-[14px] font-medium uppercase tracking-[0.08em]">{holder || "Vorname Nachname"}</div>
              </div>
              <div className={`absolute bottom-5 left-[250px] rounded-md px-1 ${ring("expiry")}`}>
                <div className="text-[8.5px] uppercase tracking-[0.2em] text-white/60">Gültig bis</div>
                <div className="font-mono text-[14px]">{expiry || "MM/JJ"}</div>
              </div>
              <div className="absolute bottom-4 right-5 flex flex-col items-center">
                <NordStar color="#fff" size={30} />
                <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/80">NordPay</span>
              </div>
            </div>
          </div>

          {/* Rückseite */}
          <div className="np-card-face np-card-back overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#11707f 0%,#0e3a5c 60%,#0b2740 100%)" }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
              <Guilloche />
              <div className="absolute inset-x-0 top-6 h-11 bg-[#111]" />
              <div className="absolute left-6 top-[84px] flex items-center gap-3">
                <div
                  className="h-9 w-[230px] rounded-sm"
                  style={{ background: "repeating-linear-gradient(-12deg,#f3f1ea 0 6px,#e5e1d6 6px 8px)" }}
                />
                <div className={`flex h-9 w-14 items-center justify-center rounded-sm bg-white font-mono text-[16px] font-semibold italic text-[#111] ${focus === "cvc" ? "np-cvc-pulse" : ""}`}>
                  {cvc ? cvc.padEnd(3, "•") : "•••"}
                </div>
              </div>
              <div className="absolute left-6 top-[128px] text-[8.5px] uppercase tracking-[0.18em] text-white/70">Prüfnummer (CVC)</div>
              <p className="absolute bottom-5 left-6 max-w-[250px] text-[8.5px] leading-[1.45] text-white/80">
                Diese Karte ist ein fiktives Zahlungsmittel im Roleplay-Projekt Nordverkehr. Kein echtes Geld, keine echte Bank, kein echtes Kartennetz.
                Fundsachen bitte im Rathaus abgeben.
              </p>
              <div className="np-holo absolute bottom-6 right-6 size-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

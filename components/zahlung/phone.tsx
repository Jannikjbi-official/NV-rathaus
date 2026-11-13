"use client";

import { useEffect, useState } from "react";
import { CircleCheckFill, FaceNeutral, LockFill } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

import { NordStar, StadtbankMark } from "./brand";

import { formatEuro } from "@/lib/format";

type Props = {
  amountCents: number;
  last4: string;
  code: string | null;
  approved: boolean;
  onApprove: () => void;
  onDecline: () => void;
};

const clock = () => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date());

/** Simuliertes Smartphone mit der App der fiktiven Stadtbank Nordverkehr. */
export function BankPhone({ amountCents, last4, code, approved, onApprove, onDecline }: Props) {
  const [now, setNow] = useState("");
  const [screen, setScreen] = useState<"lock" | "app">("lock");
  const [checking, setChecking] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setNow(clock());
    const t = setInterval(() => setNow(clock()), 15_000);

    return () => clearInterval(t);
  }, []);

  // Die Push-Nachricht kommt wie in echt mit etwas Verzögerung.
  useEffect(() => {
    if (!code) return;
    const t = setTimeout(() => setNotified(true), 1400);

    return () => clearTimeout(t);
  }, [code]);

  const approve = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onApprove();
    }, 1300);
  };

  const date = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div aria-label="Simuliertes Smartphone" className="mx-auto w-[236px] shrink-0 rounded-[2.6rem] bg-[#16181c] p-[9px] shadow-[0_30px_60px_-25px_rgba(0,0,0,.55)] ring-1 ring-black/40" role="group">
      <div className="relative h-[470px] overflow-hidden rounded-[2.1rem] text-white" style={{ background: "linear-gradient(170deg,#0b2740 0%,#0e3a5c 50%,#11707f 100%)" }}>
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black" />
        <div className="relative z-10 flex items-center justify-between px-6 pt-3 text-[11px] font-semibold">
          <span suppressHydrationWarning>{now}</span>
          <span className="flex items-center gap-1 opacity-90">
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className="w-[2.5px] rounded-sm bg-white" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-white/80 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-white" />
            </span>
          </span>
        </div>

        {screen === "lock" ? (
          <>
            <svg aria-hidden className="absolute inset-x-0 bottom-0" viewBox="0 0 236 120">
              <path d="M0 70 Q30 55 60 70 T120 70 T180 70 T240 70 V120 H0Z" fill="#ffffff" fillOpacity=".06" />
              <path d="M0 88 Q30 74 60 88 T120 88 T180 88 T240 88 V120 H0Z" fill="#ffffff" fillOpacity=".08" />
              <path d="M86 70 V40 h8 v-8 h6 v-10 l6 -8 6 8 v10 h6 v8 h8 V70Z" fill="#ffffff" fillOpacity=".12" />
            </svg>
            <div className="mt-8 flex flex-col items-center">
              <LockFill className="size-3.5 opacity-80" />
              <div className="mt-1 text-[11px] capitalize opacity-80">{date}</div>
              <div suppressHydrationWarning className="text-[54px] font-semibold leading-none tracking-tight">{now}</div>
            </div>

            {notified && code ? (
              <button
                className="np-notification absolute inset-x-3 top-[150px] rounded-2xl bg-white/85 p-3 text-left text-[#111] shadow-lg backdrop-blur-md transition hover:bg-white"
                type="button"
                onClick={() => setScreen("app")}
              >
                <div className="flex items-center gap-2 text-[10px] text-[#555]">
                  <StadtbankMark size={16} />
                  <span className="font-semibold uppercase tracking-wide">Stadtbank</span>
                  <span className="ml-auto">jetzt</span>
                </div>
                <div className="mt-1.5 text-[12.5px] font-semibold">NordSecure: Zahlung bestätigen</div>
                <div className="text-[11.5px] leading-snug text-[#333]">
                  {formatEuro(amountCents)} an Stadtkasse Nordverkehr. Ihr Code: <span className="font-mono font-semibold">{code.slice(0, 3)} {code.slice(3)}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#666]">Tippen zum Freigeben</div>
              </button>
            ) : (
              <div className="absolute inset-x-0 top-[170px] text-center text-[11px] opacity-70">Warte auf Stadtbank …</div>
            )}
            <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/70" />
          </>
        ) : (
          <div className="np-fade-up absolute inset-0 top-9 flex flex-col bg-[#f4f6f8] text-[#111]">
            <div className="flex items-center gap-2 bg-[#0e3a5c] px-4 pb-3 pt-4 text-white">
              <StadtbankMark size={22} />
              <div className="leading-tight">
                <div className="text-[12px] font-semibold">Stadtbank Nordverkehr</div>
                <div className="text-[10px] opacity-75">NordSecure-Freigabe</div>
              </div>
            </div>
            {approved ? (
              <div className="np-pop flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
                <CircleCheckFill className="size-14 text-[#17803d]" />
                <div className="text-[15px] font-semibold">Freigegeben</div>
                <div className="text-[11.5px] text-[#555]">Sie können zum Rathaus-Fenster zurückkehren.</div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col px-4 pt-4">
                <div className="text-[11px] uppercase tracking-wide text-[#666]">Zahlung freigeben?</div>
                <div className="mt-1 text-[30px] font-semibold tracking-tight">{formatEuro(amountCents)}</div>
                <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-white p-3 text-[11.5px] shadow-sm">
                  <div className="flex justify-between gap-2"><span className="text-[#666]">Empfänger</span><span className="text-right font-medium">Stadtkasse Nordverkehr</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[#666]">Karte</span><span className="flex items-center gap-1 font-medium"><NordStar color="#0e3a5c" size={11} />···· {last4}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[#666]">Code</span><span className="font-mono font-semibold">{code}</span></div>
                </div>
                {checking ? (
                  <div className="mt-auto mb-6 flex flex-col items-center gap-2">
                    <div className="relative size-16 overflow-hidden rounded-2xl border-2 border-[#0e3a5c]">
                      <FaceNeutral className="m-auto mt-3 size-9 text-[#0e3a5c]" />
                      <div className="np-scan absolute inset-x-0 top-1 h-[3px] bg-[#11a3b8] shadow-[0_0_10px_#11a3b8]" />
                    </div>
                    <span className="text-[11px] text-[#555]">Identität wird geprüft …</span>
                  </div>
                ) : (
                  <div className="mt-auto mb-6 flex flex-col gap-2">
                    <Button className="bg-[#0e3a5c] text-white" fullWidth size="sm" onPress={approve}>Freigeben</Button>
                    <Button fullWidth size="sm" variant="tertiary" onPress={onDecline}>Ablehnen</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

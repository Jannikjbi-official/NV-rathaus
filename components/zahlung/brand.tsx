/**
 * Marken des fiktiven Zahlungsdienstes NordPay und der fiktiven Stadtbank
 * Nordverkehr. Bewusst eigenständig gestaltet (Nordstern statt Kreise),
 * damit nichts an echte Kartennetze erinnert.
 */

/** Nordstern: vierzackiger Kompassstern. */
export function NordStar({ size = 20, className, color = "currentColor" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg aria-hidden className={className} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 0.8 14.3 9.7 23.2 12 14.3 14.3 12 23.2 9.7 14.3 0.8 12 9.7 9.7Z" fill={color} />
      <path d="M12 6.5 13 11 17.5 12 13 13 12 17.5 11 13 6.5 12 11 11Z" fill={color} opacity=".45" transform="rotate(45 12 12)" />
    </svg>
  );
}

export function NordPayLogo({ size = 24, className = "", inverted = false }: { size?: number; className?: string; inverted?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} style={{ fontSize: size * 0.82 }}>
      <span
        className="flex items-center justify-center rounded-[28%]"
        style={{ width: size * 1.25, height: size * 1.25, background: inverted ? "#fff" : "linear-gradient(140deg,#0e3a5c,#11707f)" }}
      >
        <NordStar color={inverted ? "#0e3a5c" : "#fff"} size={size * 0.8} />
      </span>
      <span className="font-semibold tracking-tight" style={{ color: inverted ? "#fff" : undefined }}>
        Nord<span className="font-normal opacity-80">Pay</span>
      </span>
    </span>
  );
}

/** Logo der fiktiven Stadtbank Nordverkehr (Giebelhaus). */
export function StadtbankMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden className={className} height={size} viewBox="0 0 32 32" width={size}>
      <rect fill="#0e3a5c" height="32" rx="8" width="32" />
      <path d="M16 6 25 12H7Z" fill="#fff" />
      <path d="M9 14h3v9H9zm5.5 0h3v9h-3zM20 14h3v9h-3z" fill="#fff" opacity=".9" />
      <rect fill="#e2b85c" height="2.4" rx="1" width="18" x="7" y="24.5" />
    </svg>
  );
}

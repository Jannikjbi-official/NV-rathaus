import type { SVGProps } from "react";

/**
 * Stadtsiegel des Rathauses Nordverkehr: Rathaus mit Turm über zwei Wellen
 * (Hafen), umlaufender Schriftzug. Zeichnet in `currentColor`; Fenster sind
 * ausgespart (Maske), damit das Siegel auf jedem Untergrund funktioniert.
 */
export function Seal({
  title = "Siegel Rathaus Nordverkehr",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg fill="none" role="img" viewBox="0 0 120 120" {...props}>
      <title>{title}</title>
      <defs>
        <path
          d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"
          id="nv-seal-ring"
        />
        <mask id="nv-seal-windows">
          <rect fill="white" height="120" width="120" />
          <g fill="black">
            <circle cx="60" cy="40" r="2.6" />
            <path d="M40 66v-7a2 2 0 0 1 4 0v7z" />
            <path d="M47 66v-7a2 2 0 0 1 4 0v7z" />
            <path d="M69 66v-7a2 2 0 0 1 4 0v7z" />
            <path d="M76 66v-7a2 2 0 0 1 4 0v7z" />
            <path d="M57 73v-10a3 3 0 0 1 6 0v10z" />
          </g>
        </mask>
      </defs>
      <circle cx="60" cy="60" r="57.5" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="43" stroke="currentColor" strokeWidth="1.2" />
      <text
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="8.4"
        fontWeight="600"
      >
        <textPath href="#nv-seal-ring" lengthAdjust="spacing" textLength="312">
          NORDVERKEHR · RATHAUS · HAMBURG · ANNO 2026 ·
        </textPath>
      </text>
      <g fill="currentColor" mask="url(#nv-seal-windows)">
        <polygon points="33,52 60,42 87,52" />
        <rect height="21" width="48" x="36" y="52" />
        <rect height="40" width="11" x="54.5" y="33" />
        <polygon points="54.5,33 60,18 65.5,33" />
        <circle cx="60" cy="16.6" r="1.6" />
        <rect height="3.2" rx="1" width="58" x="31" y="73" />
      </g>
      <path
        d="M33 82c4.5-3 9-3 13.5 0s9 3 13.5 0 9-3 13.5 0 9 3 13.5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <path
        d="M39 88.5c3.5-2.4 7-2.4 10.5 0s7 2.4 10.5 0 7-2.4 10.5 0 7 2.4 10.5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className ?? ""}`}>
      <Seal className="size-11 shrink-0 text-accent" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Rathaus
        </span>
        <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted">
          Nordverkehr
        </span>
      </span>
    </span>
  );
}

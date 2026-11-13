"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowDownToLine, FileArrowDown, Picture } from "@gravity-ui/icons";
import { Button, Dropdown, Label, Spinner, toast } from "@heroui/react";

import { documentSides, previewSide } from "./registry";
import type { DocRender, DocSide } from "./types";

/** Skaliert eine Seite in Designgröße auf die verfügbare Breite. */
function Scaled({ side, maxWidth, innerRef, invalid }: { side: DocSide; maxWidth?: number; innerRef?: (el: HTMLDivElement | null) => void; invalid?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useLayoutEffect(() => {
    const el = outer.current;

    if (!el) return;
    const update = () => setScale(el.clientWidth / side.width);
    const ro = new ResizeObserver(update);

    update();
    ro.observe(el);

    return () => ro.disconnect();
  }, [side.width]);

  return (
    <div
      ref={outer}
      className="relative w-full"
      style={{ maxWidth, height: side.height * scale, filter: "drop-shadow(0 12px 28px rgba(0,0,0,.18)) drop-shadow(0 2px 4px rgba(0,0,0,.08))" }}
    >
      <div ref={innerRef} className="absolute left-0 top-0" style={{ width: side.width, height: side.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {side.node}
        {invalid ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/35">
            <span
              className="-rotate-[18deg] rounded-xl border-[6px] px-8 py-2 font-black uppercase tracking-[0.2em]"
              style={{ borderColor: "#c41e1e", color: "#c41e1e", fontSize: Math.round(side.width / 9) }}
            >
              {invalid}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const fileBase = (doc: DocRender) => `${doc.number}_${doc.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}`;

async function renderImage(node: HTMLElement, side: DocSide, format: "png" | "jpeg") {
  const { toJpeg, toPng } = await import("html-to-image");

  await document.fonts.ready;
  const options = {
    width: side.width,
    height: side.height,
    pixelRatio: side.width < 1000 ? 4 : 3,
    cacheBust: true,
    style: { transform: "none", left: "0", top: "0" },
  };

  // PNG für den Bild-Download (mit transparenten Kartenecken),
  // JPEG für das PDF (deutlich kleinere Datei, gleiche Schärfe).
  return format === "png" ? toPng(node, options) : toJpeg(node, { ...options, quality: 0.93, backgroundColor: "#ffffff" });
}

function download(href: string, name: string) {
  const a = document.createElement("a");

  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DocumentViewer({ doc }: { doc: DocRender }) {
  const sides = documentSides(doc);
  const nodes = useRef<Record<string, HTMLDivElement | null>>({});
  const [busy, setBusy] = useState(false);
  const invalid = doc.state.tone === "success" ? undefined : doc.state.label;
  const isCard = sides.length === 2 && sides[0].width === sides[1].width;

  const exportPng = async (side: DocSide) => {
    const node = nodes.current[side.id];

    if (!node) return;
    setBusy(true);
    try {
      download(await renderImage(node, side, "png"), `${fileBase(doc)}_${side.id}.png`);
    } catch {
      toast.danger("Das Bild konnte nicht erzeugt werden.");
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      let pdf: InstanceType<typeof jsPDF> | null = null;

      for (const side of sides) {
        const node = nodes.current[side.id];

        if (!node) continue;
        const jpg = await renderImage(node, side, "jpeg");
        const [w, h] = side.mm;
        const orientation = w > h ? "landscape" : "portrait";

        if (!pdf) pdf = new jsPDF({ unit: "mm", format: [w, h], orientation, compress: true });
        else pdf.addPage([w, h], orientation);
        pdf.addImage(jpg, "JPEG", 0, 0, w, h);
      }
      pdf?.setProperties({ title: `${doc.title} ${doc.number}`, subject: "Stadt Nordverkehr", creator: "Rathaus Nordverkehr" });
      pdf?.save(`${fileBase(doc)}.pdf`);
    } catch {
      toast.danger("Das PDF konnte nicht erzeugt werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button isPending={busy} onPress={exportPdf}>
          {busy ? <Spinner color="current" size="sm" /> : <FileArrowDown />}
          PDF herunterladen
        </Button>
        <Dropdown>
          <Button isDisabled={busy} variant="tertiary">
            <Picture />
            Als Bild
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label="Seite als PNG" onAction={(key) => exportPng(sides.find((s) => s.id === key)!)}>
              {sides.map((s) => (
                <Dropdown.Item key={s.id} id={s.id} textValue={s.label}>
                  <ArrowDownToLine className="size-4 text-muted" />
                  <Label>{s.label} (PNG)</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <div className={`grid items-start gap-8 ${isCard ? "lg:grid-cols-2" : doc.type === "reisepass" ? "lg:grid-cols-[0.62fr_1fr]" : ""}`}>
        {sides.map((side) => (
          <figure key={side.id} className="m-0 flex flex-col items-center gap-3">
            <Scaled
              innerRef={(el) => {
                nodes.current[side.id] = el;
              }}
              invalid={invalid}
              maxWidth={side.width === 794 ? 760 : undefined}
              side={side}
            />
            {sides.length > 1 ? <figcaption className="text-sm text-muted">{side.label}</figcaption> : null}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Kleine Vorschau für Listen. */
export function DocumentThumb({ doc }: { doc: DocRender }) {
  const side = previewSide(doc);

  return <Scaled invalid={doc.state.tone === "success" ? undefined : doc.state.label} side={side} />;
}

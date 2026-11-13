"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Magnifier } from "@gravity-ui/icons";
import { ComboBox, Input, ListBox } from "@heroui/react";

export type SearchItem = { slug: string; title: string; department: string; keywords: string[] };

export function ServiceSearch({ items, className }: { items: SearchItem[]; className?: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();

    if (!q) return items.slice(0, 8);

    return items
      .filter((s) => [s.title, s.department, ...s.keywords].join(" ").toLowerCase().includes(q))
      .slice(0, 8);
  }, [input, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      className={className}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = input.trim();

        if (q) router.push(`/leistungen?q=${encodeURIComponent(q)}`);
      }}
    >
      <ComboBox
        allowsCustomValue
        allowsEmptyCollection
        aria-label="Dienstleistung suchen"
        defaultFilter={() => true}
        fullWidth
        inputValue={input}
        items={filtered}
        menuTrigger="input"
        onInputChange={setInput}
        onSelectionChange={(key) => {
          if (key) {
            setInput("");
            router.push(`/leistungen/${key}`);
          }
        }}
      >
        <ComboBox.InputGroup>
          <Input ref={inputRef} placeholder="Was suchen Sie? z. B. Reisepass (Strg+K)" />
          <ComboBox.Trigger aria-label="Vorschläge anzeigen">
            <Magnifier aria-hidden className="size-4" />
          </ComboBox.Trigger>
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox renderEmptyState={() => <p className="px-3 py-2 text-sm text-muted">Keine Leistung gefunden. Enter sucht im Volltext.</p>}>
            {(s: SearchItem) => (
              <ListBox.Item id={s.slug} textValue={s.title}>
                <div className="flex w-full items-center justify-between gap-3">
                  <span>{s.title}</span>
                  <span className="text-xs text-muted">{s.department}</span>
                </div>
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </form>
  );
}

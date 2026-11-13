"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Kbd, SearchField } from "@heroui/react";

/** Globale Suche der Verwaltung (Strg+K). */
export function AdminSearch() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      className="w-full max-w-xl"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();

        if (q) router.push(`/verwaltung/suche?q=${encodeURIComponent(q)}`);
      }}
    >
      <SearchField aria-label="Verwaltung durchsuchen" fullWidth name="q">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input ref={input} placeholder="Name, Bürgernummer, Kennzeichen, Dokument- oder Aktenzeichen …" />
          <SearchField.ClearButton />
          <Kbd className="me-2 hidden md:inline-flex" variant="light">
            <Kbd.Abbr keyValue="ctrl" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </SearchField.Group>
      </SearchField>
    </form>
  );
}

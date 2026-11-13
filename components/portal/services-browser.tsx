"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { ChevronRight } from "@gravity-ui/icons";
import { Card, Chip, Label, ListBox, SearchField, Select, ToggleButton, ToggleButtonGroup } from "@heroui/react";

import { Icon } from "@/components/ui/icon";
import { formatEuro } from "@/lib/format";
import { LIFE_EVENTS } from "@/lib/status";

type Item = {
  slug: string;
  title: string;
  summary: string;
  lifeEvent: string;
  keywords: string[];
  feeCents: number;
  department: string;
  departmentSlug: string;
};

export function ServicesBrowser({
  items,
  departments,
  initialQuery,
  initialDepartment,
}: {
  items: Item[];
  departments: { slug: string; name: string }[];
  initialQuery: string;
  initialDepartment: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [dept, setDept] = useState(initialDepartment || "alle");
  const [life, setLife] = useState("alle");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter(
      (s) =>
        (dept === "alle" || s.departmentSlug === dept) &&
        (life === "alle" || s.lifeEvent === life) &&
        (!q || [s.title, s.summary, s.department, ...s.keywords].join(" ").toLowerCase().includes(q)),
    );
  }, [items, query, dept, life]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();

    for (const s of filtered) {
      const letter = s.title[0].toUpperCase();

      map.set(letter, [...(map.get(letter) ?? []), s]);
    }

    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField aria-label="Leistungen durchsuchen" className="flex-1" value={query} onChange={setQuery}>
          <Label>Suche</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="z. B. Ausweis, Kennzeichen, Gewerbe" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Select className="sm:w-64" selectedKey={dept} onSelectionChange={(k) => setDept(String(k))}>
          <Label>Amt</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="alle" textValue="Alle Ämter">Alle Ämter<ListBox.ItemIndicator /></ListBox.Item>
              {departments.map((d) => (
                <ListBox.Item key={d.slug} id={d.slug} textValue={d.name}>
                  {d.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <ToggleButtonGroup
        aria-label="Lebenslage"
        className="flex-wrap"
        disallowEmptySelection
        selectedKeys={[life]}
        selectionMode="single"
        onSelectionChange={(keys) => setLife(String([...keys][0] ?? "alle"))}
      >
        <ToggleButton id="alle" size="sm">Alle Lebenslagen</ToggleButton>
        {Object.entries(LIFE_EVENTS).map(([key, l]) => (
          <ToggleButton key={key} id={key} size="sm">
            <Icon name={l.icon} />
            {l.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <p aria-live="polite" className="text-sm text-muted">
        {filtered.length === 1 ? "1 Leistung" : `${filtered.length} Leistungen`}
      </p>

      {groups.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <Card.Title>Keine Leistung gefunden</Card.Title>
          <Card.Description>Versuchen Sie einen anderen Suchbegriff oder setzen Sie die Filter zurück.</Card.Description>
        </Card>
      ) : null}

      {groups.map(([letter, list]) => (
        <section key={letter} aria-label={`Buchstabe ${letter}`} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted">{letter}</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {list.map((s) => (
              <NextLink key={s.slug} className="group rounded-3xl" href={`/leistungen/${s.slug}`}>
                <Card className="h-full flex-row items-center gap-4 transition-shadow group-hover:shadow-overlay">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Card.Title className="leading-snug">{s.title}</Card.Title>
                    <Card.Description className="line-clamp-2">{s.summary}</Card.Description>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip size="sm" variant="soft">{s.department}</Chip>
                      <Chip color={s.feeCents === 0 ? "success" : "default"} size="sm" variant="soft">{formatEuro(s.feeCents)}</Chip>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                </Card>
              </NextLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

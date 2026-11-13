"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, FloppyDisk, Plus, TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Card,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  Switch,
  Tabs,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";

import { DynamicFields } from "@/components/forms/fields";
import { saveService, type ServiceInput } from "@/app/actions/inhalte";
import { DISPLAY_ONLY, FIELD_TYPE_LABELS, FIELD_TYPES, type FieldType, type FormField } from "@/lib/forms/types";
import { DOCUMENT_TYPES, LIFE_EVENTS } from "@/lib/status";

const WITH_OPTIONS: FieldType[] = ["select", "radio", "checkboxes"];

const keyFrom = (label: string) =>
  label
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "feld";

function SelectBox({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: [string, string][] }) {
  return (
    <Select selectedKey={value} onSelectionChange={(k) => onChange(String(k))}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map(([id, text]) => (
            <ListBox.Item key={id} id={id} textValue={text}>
              {text}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function Toggle({ label, isSelected, onChange }: { label: string; isSelected: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch isSelected={isSelected} onChange={onChange}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {label}
      </Switch.Content>
    </Switch>
  );
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function ServiceEditor({ initial, departments }: { initial: ServiceInput; departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [svc, setSvc] = useState(initial);
  const [tab, setTab] = useState<"formular" | "allgemein">(initial.id ? "formular" : "allgemein");
  const [pending, start] = useTransition();
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setSvc((s) => ({ ...s, [k]: v }));
  const setField = (i: number, patch: Partial<FormField>) =>
    setSvc((s) => ({ ...s, fields: s.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const move = (i: number, d: number) =>
    setSvc((s) => {
      const fields = [...s.fields];
      const [f] = fields.splice(i, 1);

      fields.splice(i + d, 0, f);

      return { ...s, fields };
    });
  const addField = (type: FieldType) =>
    setSvc((s) => {
      let id = `feld_${s.fields.length + 1}`;

      while (s.fields.some((f) => f.id === id)) id += "_";

      return {
        ...s,
        fields: [...s.fields, { id, type, label: FIELD_TYPE_LABELS[type], required: !DISPLAY_ONLY.includes(type), options: WITH_OPTIONS.includes(type) ? ["Option 1", "Option 2"] : undefined }],
      };
    });

  const preview = useMemo(() => svc.fields, [svc.fields]);

  const save = () =>
    start(async () => {
      const res = await saveService(svc);

      if (res.ok) {
        toast.success(res.message);
        if (!svc.id && res.slug) router.push(`/verwaltung/leistungen/${res.slug}`);
        else router.refresh();
      } else toast.danger(res.message);
    });

  return (
    <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as "formular" | "allgemein")}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Bereich">
                <Tabs.Tab className="whitespace-nowrap" id="formular">Formular ({svc.fields.length})<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id="allgemein">Allgemein<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <Button isPending={pending} onPress={save}>
            <FloppyDisk />
            Speichern
          </Button>
        </div>

        {tab === "allgemein" ? (
          <Card>
            <Card.Content className="grid gap-4 sm:grid-cols-2">
              <TextField className="sm:col-span-2" isRequired value={svc.title} onChange={(v) => set("title", v)}>
                <Label>Titel</Label>
                <Input placeholder="z. B. Hundesteuer anmelden" />
              </TextField>
              <SelectBox items={departments.map((d) => [d.id, d.name])} label="Zuständiges Amt" value={svc.departmentId} onChange={(v) => set("departmentId", v)} />
              <SelectBox items={Object.entries(LIFE_EVENTS).map(([k, v]) => [k, v.label])} label="Lebenslage" value={svc.lifeEvent} onChange={(v) => set("lifeEvent", v)} />
              <TextField className="sm:col-span-2" isRequired value={svc.summary} onChange={(v) => set("summary", v)}>
                <Label>Kurzbeschreibung</Label>
                <Input />
                <Description>Erscheint in Listen und in der Suche.</Description>
              </TextField>
              <TextField className="sm:col-span-2" value={svc.description} onChange={(v) => set("description", v)}>
                <Label>Beschreibung</Label>
                <TextArea rows={4} />
              </TextField>
              <NumberField formatOptions={{ style: "currency", currency: "EUR" }} minValue={0} value={svc.feeCents / 100} onChange={(v) => set("feeCents", Math.round((v || 0) * 100))}>
                <Label>Gebühr</Label>
                <NumberField.Group>
                  <NumberField.Input />
                </NumberField.Group>
              </NumberField>
              <NumberField minValue={0} maxValue={90} value={svc.processingDays} onChange={(v) => set("processingDays", v || 0)}>
                <Label>Bearbeitungszeit (Tage)</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
              <TextField className="sm:col-span-2" value={svc.feeNote ?? ""} onChange={(v) => set("feeNote", v || null)}>
                <Label>Hinweis zur Gebühr</Label>
                <Input placeholder="optional" />
              </TextField>
              <SelectBox
                items={[["keins", "Kein Dokument"], ...Object.entries(DOCUMENT_TYPES).map(([k, v]) => [k, v.label] as [string, string])]}
                label="Ausgestelltes Dokument"
                value={svc.issuesDocument ?? "keins"}
                onChange={(v) => set("issuesDocument", v === "keins" ? null : (v as ServiceInput["issuesDocument"]))}
              />
              <NumberField minValue={1} maxValue={30} value={svc.documentValidityYears ?? NaN} onChange={(v) => set("documentValidityYears", Number.isFinite(v) ? v : null)}>
                <Label>Gültigkeit (Jahre)</Label>
                <NumberField.Group>
                  <NumberField.Input placeholder="unbefristet" />
                </NumberField.Group>
              </NumberField>
              <TextField value={svc.requirements.join("\n")} onChange={(v) => set("requirements", lines(v))}>
                <Label>Voraussetzungen</Label>
                <TextArea rows={3} />
                <Description>Eine pro Zeile</Description>
              </TextField>
              <TextField value={svc.documentsNeeded.join("\n")} onChange={(v) => set("documentsNeeded", lines(v))}>
                <Label>Benötigte Unterlagen</Label>
                <TextArea rows={3} />
                <Description>Eine pro Zeile</Description>
              </TextField>
              <TextField className="sm:col-span-2" value={svc.keywords.join(", ")} onChange={(v) => set("keywords", v.split(",").map((x) => x.trim()).filter(Boolean))}>
                <Label>Suchbegriffe</Label>
                <Input placeholder="ausweis, perso, id" />
              </TextField>
              <div className="flex flex-wrap gap-6 sm:col-span-2">
                <Toggle isSelected={svc.isActive} label="Online verfügbar" onChange={(v) => set("isActive", v)} />
                <Toggle isSelected={svc.isFeatured} label="Auf der Startseite" onChange={(v) => set("isFeatured", v)} />
                <Toggle isSelected={svc.needsAppointment} label="Termin zur Abholung" onChange={(v) => set("needsAppointment", v)} />
              </div>
            </Card.Content>
          </Card>
        ) : (
          <>
            {svc.fields.map((f, i) => (
              <Card key={i} variant="secondary">
                <Card.Header className="flex-row items-center gap-2">
                  <Chip size="sm" variant="soft">{FIELD_TYPE_LABELS[f.type]}</Chip>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.label}</span>
                  <Button aria-label="Nach oben" isDisabled={i === 0} isIconOnly size="sm" variant="ghost" onPress={() => move(i, -1)}><ArrowUp /></Button>
                  <Button aria-label="Nach unten" isDisabled={i === svc.fields.length - 1} isIconOnly size="sm" variant="ghost" onPress={() => move(i, 1)}><ArrowDown /></Button>
                  <Button aria-label="Feld löschen" isIconOnly size="sm" variant="ghost" onPress={() => setSvc((s) => ({ ...s, fields: s.fields.filter((_, j) => j !== i) }))}><TrashBin /></Button>
                </Card.Header>
                <Card.Content className="grid gap-3 sm:grid-cols-2">
                  <SelectBox
                    items={FIELD_TYPES.map((t) => [t, FIELD_TYPE_LABELS[t]])}
                    label="Feldtyp"
                    value={f.type}
                    onChange={(t) => setField(i, { type: t as FieldType, options: WITH_OPTIONS.includes(t as FieldType) ? (f.options ?? ["Option 1"]) : undefined })}
                  />
                  <TextField value={f.label} onChange={(v) => setField(i, { label: v })}>
                    <Label>Beschriftung</Label>
                    <Input />
                  </TextField>
                  {!DISPLAY_ONLY.includes(f.type) ? (
                    <TextField value={f.id} onChange={(v) => setField(i, { id: keyFrom(v) })}>
                      <Label>Schlüssel</Label>
                      <Input className="font-mono" />
                      <Description>Für Auswertungen; nicht mehr ändern, wenn schon Anträge vorliegen.</Description>
                    </TextField>
                  ) : null}
                  <TextField className={DISPLAY_ONLY.includes(f.type) ? "sm:col-span-2" : ""} value={f.description ?? ""} onChange={(v) => setField(i, { description: v || undefined })}>
                    <Label>{f.type === "info" ? "Hinweistext" : "Hilfetext"}</Label>
                    <Input />
                  </TextField>
                  {WITH_OPTIONS.includes(f.type) ? (
                    <TextField className="sm:col-span-2" value={(f.options ?? []).join("\n")} onChange={(v) => setField(i, { options: lines(v) })}>
                      <Label>Optionen</Label>
                      <TextArea rows={Math.min(8, Math.max(3, (f.options ?? []).length))} />
                      <Description>Eine Option pro Zeile</Description>
                    </TextField>
                  ) : null}
                  {!DISPLAY_ONLY.includes(f.type) ? (
                    <div className="flex flex-wrap gap-6 sm:col-span-2">
                      <Toggle isSelected={!!f.required} label="Pflichtfeld" onChange={(v) => setField(i, { required: v })} />
                      <Toggle isSelected={!!f.half} label="Halbe Breite" onChange={(v) => setField(i, { half: v })} />
                    </div>
                  ) : null}
                </Card.Content>
              </Card>
            ))}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Feld hinzufügen</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-row flex-wrap gap-2">
                {FIELD_TYPES.map((t) => (
                  <Button key={t} size="sm" variant="tertiary" onPress={() => addField(t)}>
                    <Plus />
                    {FIELD_TYPE_LABELS[t]}
                  </Button>
                ))}
              </Card.Content>
            </Card>
          </>
        )}
      </div>

      <Card className="2xl:sticky 2xl:top-8">
        <Card.Header className="flex-row items-center gap-2">
          <Eye className="size-4 text-muted" />
          <Card.Title className="text-base">Vorschau für Bürger</Card.Title>
        </Card.Header>
        <Card.Content>
          {preview.length ? <DynamicFields key={JSON.stringify(preview)} fields={preview} /> : <p className="text-sm text-muted">Noch keine Felder.</p>}
        </Card.Content>
      </Card>
    </div>
  );
}

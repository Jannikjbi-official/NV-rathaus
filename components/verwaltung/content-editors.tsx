"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, FloppyDisk, Plus, TrashBin, Xmark } from "@gravity-ui/icons";
import {
  AlertDialog,
  Button,
  Card,
  Description,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";

import { DateInput } from "@/components/forms/fields";
import {
  addTrafficNotice,
  createSlots,
  deletePost,
  endTrafficNotice,
  saveDepartment,
  saveJob,
  savePost,
  setAppointmentStatus,
  type JobInput,
  type PostInput,
  type SaveResult,
} from "@/app/actions/inhalte";
import { revokeDocument } from "@/app/actions/verwaltung";
import { POST_KINDS } from "@/lib/status";
import { WEEKDAYS } from "@/lib/format";

function useSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<SaveResult | { ok: boolean; message: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();

      if (res.ok) {
        toast.success(res.message);
        after?.();
        router.refresh();
      } else toast.danger(res.message);
    });

  return { pending, run, router };
}

function Pick({ label, value, onChange, items, className }: { label: string; value: string; onChange: (v: string) => void; items: [string, string][]; className?: string }) {
  return (
    <Select className={className} selectedKey={value} onSelectionChange={(k) => onChange(String(k))}>
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

/* -------------------------------- Amtsblatt ------------------------------- */

const IMAGES: [string, string][] = [
  ["", "Kein Bild"],
  ["/images/hafen-abend.svg", "Hafen am Abend"],
  ["/images/hafen-tag.svg", "Hafen am Tag"],
  ["/images/hafen-nacht.svg", "Hafen bei Nacht"],
  ["/images/rathausmarkt.svg", "Rathausmarkt"],
  ["/images/strassensperrung.svg", "Straßensperrung"],
];

export function PostEditor({ initial, departments }: { initial: PostInput; departments: { id: string; name: string }[] }) {
  const [post, setPost] = useState(initial);
  const { pending, run, router } = useSave();
  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => setPost((p) => ({ ...p, [k]: v }));
  const preset = IMAGES.some(([id]) => id === (post.imageUrl ?? ""));

  return (
    <Card>
      <Card.Content className="grid gap-4 sm:grid-cols-2">
        <Pick items={Object.entries(POST_KINDS).map(([k, v]) => [k, v.label])} label="Art" value={post.kind} onChange={(v) => set("kind", v as PostInput["kind"])} />
        <Pick
          items={[["", "Ohne Amt"], ...departments.map((d) => [d.id, d.name] as [string, string])]}
          label="Herausgeber"
          value={post.departmentId ?? ""}
          onChange={(v) => set("departmentId", v || null)}
        />
        <TextField className="sm:col-span-2" isRequired value={post.title} onChange={(v) => set("title", v)}>
          <Label>Überschrift</Label>
          <Input />
        </TextField>
        <TextField className="sm:col-span-2" isRequired value={post.teaser} onChange={(v) => set("teaser", v)}>
          <Label>Vorspann</Label>
          <TextArea rows={2} />
          <Description>Ein bis zwei Sätze, erscheinen in Listen und auf der Startseite.</Description>
        </TextField>
        <TextField className="sm:col-span-2" isRequired value={post.body} onChange={(v) => set("body", v)}>
          <Label>Text</Label>
          <TextArea rows={10} />
          <Description>Absätze mit einer Leerzeile trennen.</Description>
        </TextField>
        <Pick items={preset ? IMAGES : [...IMAGES, [post.imageUrl ?? "", "Eigene Adresse"]]} label="Bild" value={post.imageUrl ?? ""} onChange={(v) => set("imageUrl", v || null)} />
        <TextField value={post.imageUrl ?? ""} onChange={(v) => set("imageUrl", v || null)}>
          <Label>Oder Bild-Adresse</Label>
          <Input placeholder="https://… (z. B. Screenshot aus dem Spiel)" />
        </TextField>
        {post.kind === "bekanntmachung" ? (
          <TextField value={post.gazetteNumber ?? ""} onChange={(v) => set("gazetteNumber", v || null)}>
            <Label>Amtsblatt-Nummer</Label>
            <Input placeholder="Amtsblatt 47/2026" />
          </TextField>
        ) : null}
        <div className="flex items-end sm:col-span-2">
          <Toggle isSelected={post.isFeatured} label="Als Top-Thema auf der Startseite" onChange={(v) => set("isFeatured", v)} />
        </div>
      </Card.Content>
      <Card.Footer className="justify-between gap-2">
        {post.id ? (
          <Button isDisabled={pending} variant="danger-soft" onPress={() => run(() => deletePost(post.id!), () => router.push("/verwaltung/amtsblatt"))}>
            <TrashBin />
            Löschen
          </Button>
        ) : <span />}
        <Button isPending={pending} onPress={() => run(() => savePost(post), () => router.push("/verwaltung/amtsblatt"))}>
          <FloppyDisk />
          Veröffentlichen
        </Button>
      </Card.Footer>
    </Card>
  );
}

export function TrafficManager({ items }: { items: { id: string; location: string; category: string; detail: string; severity: string }[] }) {
  const [form, setForm] = useState({ location: "", category: "Baustelle", severity: "mittel" as "hoch" | "mittel" | "info", detail: "" });
  const { pending, run } = useSave();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">Verkehrsmeldungen</Card.Title>
        <Card.Description>Erscheinen auf der Startseite, bis sie beendet werden.</Card.Description>
      </Card.Header>
      <Card.Content className="gap-2">
        {items.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-default px-3 py-2 text-sm">
            <span><span className="font-medium">{t.location}</span> · {t.category} · <span className="text-muted">{t.detail}</span></span>
            <Button aria-label="Meldung beenden" isIconOnly size="sm" variant="ghost" onPress={() => run(() => endTrafficNotice(t.id))}><Xmark /></Button>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted">Keine aktiven Meldungen.</p> : null}
      </Card.Content>
      <Card.Content className="grid gap-3 sm:grid-cols-2">
        <TextField value={form.location} onChange={(v) => setForm({ ...form, location: v })}>
          <Label>Ort</Label>
          <Input placeholder="Stresemannstraße stadteinwärts" />
        </TextField>
        <TextField value={form.category} onChange={(v) => setForm({ ...form, category: v })}>
          <Label>Art</Label>
          <Input placeholder="Baustelle, Unfall, Sperrung" />
        </TextField>
        <Pick items={[["hoch", "Hoch (rot)"], ["mittel", "Mittel (gelb)"], ["info", "Info (grau)"]]} label="Schwere" value={form.severity} onChange={(v) => setForm({ ...form, severity: v as "hoch" })} />
        <TextField value={form.detail} onChange={(v) => setForm({ ...form, detail: v })}>
          <Label>Hinweis</Label>
          <Input placeholder="bis Freitag, eine Spur frei" />
        </TextField>
      </Card.Content>
      <Card.Footer className="justify-end">
        <Button isPending={pending} size="sm" onPress={() => run(() => addTrafficNotice(form), () => setForm({ ...form, location: "", detail: "" }))}>
          <Plus />
          Meldung veröffentlichen
        </Button>
      </Card.Footer>
    </Card>
  );
}

/* --------------------------------- Stellen -------------------------------- */

export function JobEditor({ initial, departments }: { initial: JobInput; departments: { id: string; name: string }[] }) {
  const [job, setJob] = useState(initial);
  const { pending, run, router } = useSave();
  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setJob((j) => ({ ...j, [k]: v }));

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const deadline = new FormData(e.currentTarget).get("deadline");

          run(() => saveJob({ ...job, deadline: deadline ? String(deadline) : null }), () => router.push("/verwaltung/stellen"));
        }}
      >
        <Card.Content className="grid gap-4 sm:grid-cols-2">
          <TextField className="sm:col-span-2" isRequired value={job.title} onChange={(v) => set("title", v)}>
            <Label>Stellenbezeichnung</Label>
            <Input />
          </TextField>
          <TextField isRequired value={job.organization} onChange={(v) => set("organization", v)}>
            <Label>Arbeitgeber</Label>
            <Input placeholder="Stadtverwaltung, Polizei Nordverkehr …" />
          </TextField>
          <Pick items={[["", "Kein Amt (Polizei, Feuerwehr …)"], ...departments.map((d) => [d.id, d.name] as [string, string])]} label="Amt" value={job.departmentId ?? ""} onChange={(v) => set("departmentId", v || null)} />
          <TextField isRequired value={job.employment} onChange={(v) => set("employment", v)}>
            <Label>Umfang</Label>
            <Input placeholder="Vollzeit / Teilzeit" />
          </TextField>
          <DateInput defaultValue={job.deadline} label="Bewerbungsschluss (leer = laufend)" name="deadline" />
          <TextField className="sm:col-span-2" isRequired value={job.summary} onChange={(v) => set("summary", v)}>
            <Label>Kurzbeschreibung</Label>
            <Input />
          </TextField>
          <TextField className="sm:col-span-2" isRequired value={job.description} onChange={(v) => set("description", v)}>
            <Label>Beschreibung</Label>
            <TextArea rows={4} />
          </TextField>
          <TextField value={job.tasks.join("\n")} onChange={(v) => set("tasks", lines(v))}>
            <Label>Aufgaben</Label>
            <TextArea rows={4} />
            <Description>Eine pro Zeile</Description>
          </TextField>
          <TextField value={job.requirements.join("\n")} onChange={(v) => set("requirements", lines(v))}>
            <Label>Anforderungen</Label>
            <TextArea rows={4} />
            <Description>Eine pro Zeile</Description>
          </TextField>
          <Toggle isSelected={job.isOpen} label="Ausgeschrieben (Bewerbung möglich)" onChange={(v) => set("isOpen", v)} />
        </Card.Content>
        <Card.Footer className="mt-4 justify-end">
          <Button isPending={pending} type="submit">
            <FloppyDisk />
            Speichern
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}

/* --------------------------------- Termine -------------------------------- */

export function SlotCreator({ departments }: { departments: { id: string; name: string }[] }) {
  const [dept, setDept] = useState(departments[0]?.id ?? "");
  const [from, setFrom] = useState("18:00");
  const [to, setTo] = useState("22:00");
  const [interval, setInterval] = useState(30);
  const [capacity, setCapacity] = useState(2);
  const { pending, run } = useSave();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">Terminslots anlegen</Card.Title>
        <Card.Description>Zeiten in Serverzeit (Europe/Berlin).</Card.Description>
      </Card.Header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const date = String(new FormData(e.currentTarget).get("date") ?? "");

          run(() => createSlots({ departmentId: dept, date, from, to, interval, capacity }));
        }}
      >
        <Card.Content className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Pick items={departments.map((d) => [d.id, d.name])} label="Amt" value={dept} onChange={setDept} />
          <DateInput isRequired label="Datum" name="date" />
          <div className="grid grid-cols-2 gap-3">
            <TextField value={from} onChange={setFrom}>
              <Label>Von</Label>
              <Input placeholder="18:00" />
            </TextField>
            <TextField value={to} onChange={setTo}>
              <Label>Bis</Label>
              <Input placeholder="22:00" />
            </TextField>
          </div>
          <NumberField maxValue={120} minValue={10} step={5} value={interval} onChange={setInterval}>
            <Label>Dauer (Minuten)</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
          <NumberField maxValue={20} minValue={1} value={capacity} onChange={setCapacity}>
            <Label>Plätze je Slot</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
          <div className="flex items-end">
            <Button fullWidth isPending={pending} type="submit">
              <Plus />
              Slots anlegen
            </Button>
          </div>
        </Card.Content>
      </form>
    </Card>
  );
}

export function AppointmentActions({ id }: { id: string }) {
  const { pending, run } = useSave();

  return (
    <div className="flex gap-1">
      <Button isDisabled={pending} size="sm" variant="tertiary" onPress={() => run(() => setAppointmentStatus(id, "erschienen"))}>
        <Check />
        Erschienen
      </Button>
      <Button aria-label="Termin stornieren" isDisabled={pending} isIconOnly size="sm" variant="ghost" onPress={() => run(() => setAppointmentStatus(id, "storniert"))}>
        <Xmark />
      </Button>
    </div>
  );
}

/* ---------------------------------- Ämter --------------------------------- */

type DepartmentInput = Parameters<typeof saveDepartment>[0];

export function DepartmentEditor({ initial, name }: { initial: DepartmentInput; name: string }) {
  const [d, setD] = useState(initial);
  const { pending, run } = useSave();
  const days = [1, 2, 3, 4, 5, 6, 0];
  const slot = (day: number) => d.openingHours.days.find((x) => x.day === day);
  const setDay = (day: number, patch: { open?: string; close?: string } | null) =>
    setD((s) => {
      const rest = s.openingHours.days.filter((x) => x.day !== day);
      const cur = s.openingHours.days.find((x) => x.day === day) ?? { day, open: "16:00", close: "22:00" };

      return { ...s, openingHours: { ...s.openingHours, days: patch ? [...rest, { ...cur, ...patch }].sort((a, b) => a.day - b.day) : rest } };
    });

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">{name}</Card.Title>
      </Card.Header>
      <Card.Content className="grid gap-4 sm:grid-cols-2">
        <TextField value={d.discordRoleId} onChange={(v) => setD({ ...d, discordRoleId: v.trim() })}>
          <Label>Discord-Rollen-ID</Label>
          <Input className="font-mono" placeholder="z. B. 1234567890123456789" />
          <Description>Mitglieder mit dieser Rolle bearbeiten die Anträge dieses Amts.</Description>
        </TextField>
        <TextField value={d.summary} onChange={(v) => setD({ ...d, summary: v })}>
          <Label>Kurzbeschreibung</Label>
          <Input />
        </TextField>
        <TextField value={d.address} onChange={(v) => setD({ ...d, address: v })}>
          <Label>Anschrift</Label>
          <Input />
        </TextField>
        <div className="grid grid-cols-2 gap-3">
          <TextField value={d.phone} onChange={(v) => setD({ ...d, phone: v })}>
            <Label>Telefon</Label>
            <Input />
          </TextField>
          <TextField value={d.email} onChange={(v) => setD({ ...d, email: v })}>
            <Label>E-Mail (IC)</Label>
            <Input />
          </TextField>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <p className="text-sm font-medium">Öffnungszeiten</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {days.map((day) => {
              const s = slot(day);

              return (
                <div key={day} className="flex items-center gap-2 rounded-xl bg-default px-3 py-1.5">
                  <Switch aria-label={`${WEEKDAYS[day]} geöffnet`} isSelected={!!s} size="sm" onChange={(on) => setDay(day, on ? {} : null)}>
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch>
                  <span className="w-24 text-sm">{WEEKDAYS[day]}</span>
                  {s ? (
                    <>
                      <TextField aria-label="öffnet" className="w-20" value={s.open} onChange={(v) => setDay(day, { open: v })}><Input /></TextField>
                      <span className="text-muted">–</span>
                      <TextField aria-label="schließt" className="w-20" value={s.close} onChange={(v) => setDay(day, { close: v })}><Input /></TextField>
                    </>
                  ) : (
                    <span className="text-sm text-muted">geschlossen</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card.Content>
      <Card.Footer className="justify-end">
        <Button isPending={pending} size="sm" onPress={() => run(() => saveDepartment(d))}>
          <FloppyDisk />
          Speichern
        </Button>
      </Card.Footer>
    </Card>
  );
}

/* ------------------------------ Melderegister ----------------------------- */

export function RevokeDocumentButton({ id, number }: { id: string; number: string }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const { pending, run } = useSave();

  return (
    <AlertDialog isOpen={open} onOpenChange={setOpen}>
      <Button size="sm" variant="danger-soft">Widerrufen</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{number} widerrufen?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <TextField isRequired value={reason} onChange={setReason}>
                <Label>Grund</Label>
                <Input placeholder="z. B. Entzug durch Gerichtsbeschluss" />
              </TextField>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">Abbrechen</Button>
              <Button isDisabled={reason.trim().length < 3} isPending={pending} variant="danger" onPress={() => run(() => revokeDocument(id, reason), () => setOpen(false))}>
                Widerrufen
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

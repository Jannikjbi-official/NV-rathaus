"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, Xmark } from "@gravity-ui/icons";
import {
  Alert,
  Button,
  Card,
  Chip,
  FieldError,
  Form,
  Header,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";

import { bookAppointment, cancelAppointment } from "@/app/actions/konto";
import { formatTime } from "@/lib/format";

export type Slot = { id: string; departmentId: string; startsAt: Date; free: number };
export type Booking = { id: string; department: string; address: string; startsAt: Date; purpose: string; status: string };

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(new Date(d));

export function AppointmentBooking({
  departments,
  slots,
  defaultPurpose,
}: {
  departments: { id: string; name: string }[];
  slots: Slot[];
  defaultPurpose?: string;
}) {
  const [state, action, pending] = useActionState(bookAppointment, null);
  const [dept, setDept] = useState(departments[0]?.id ?? "");

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();

    for (const s of slots.filter((x) => x.departmentId === dept)) {
      const key = dayLabel(s.startsAt);

      map.set(key, [...(map.get(key) ?? []), s]);
    }

    return [...map.entries()].slice(0, 7);
  }, [slots, dept]);

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">Neuen Termin buchen</Card.Title>
        <Card.Description>Für Abholungen, Trauungen und persönliche Vorsprachen.</Card.Description>
      </Card.Header>
      <Form key={state?.ok ? String(Date.now()) : "form"} action={action} className="flex flex-col gap-4" validationErrors={state?.errors}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select selectedKey={dept} onSelectionChange={(k) => setDept(String(k))}>
            <Label>Amt</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {departments.map((d) => (
                  <ListBox.Item key={d.id} id={d.id} textValue={d.name}>
                    {d.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Select key={dept} isRequired name="slot" placeholder="Uhrzeit wählen">
            <Label>Termin</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError />
            <Select.Popover>
              <ListBox>
                {grouped.map(([day, list]) => (
                  <ListBox.Section key={day}>
                    <Header>{day}</Header>
                    {list.map((s) => (
                      <ListBox.Item key={s.id} id={s.id} textValue={`${day}, ${formatTime(s.startsAt)} Uhr`}>
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>{formatTime(s.startsAt)} Uhr</span>
                          <span className="text-xs text-muted">{s.free} frei</span>
                        </span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox.Section>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <TextField defaultValue={defaultPurpose} isRequired name="purpose">
          <Label>Anliegen</Label>
          <Input placeholder="z. B. Abholung Personalausweis" />
          <FieldError />
        </TextField>
        {state?.message && !state.ok ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content><Alert.Title>{state.message}</Alert.Title></Alert.Content>
          </Alert>
        ) : null}
        <Button className="self-end" isPending={pending} type="submit">
          {pending ? <Spinner color="current" size="sm" /> : <Calendar />}
          Termin buchen
        </Button>
      </Form>
    </Card>
  );
}

export function BookingList({ bookings }: { bookings: Booking[] }) {
  const [pending, start] = useTransition();

  if (bookings.length === 0) return <p className="text-sm text-muted">Sie haben keine anstehenden Termine.</p>;

  return (
    <div className="flex flex-col">
      {bookings.map((b, i) => (
        <div key={b.id}>
          {i > 0 ? <Separator /> : null}
          <div className="flex flex-wrap items-center gap-4 py-3">
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft leading-none text-accent">
              <span className="text-lg font-semibold">{new Date(b.startsAt).toLocaleDateString("de-DE", { day: "numeric", timeZone: "Europe/Berlin" })}</span>
              <span className="text-[10px] font-semibold uppercase">{new Date(b.startsAt).toLocaleDateString("de-DE", { month: "short", timeZone: "Europe/Berlin" })}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{b.purpose}</p>
              <p className="text-xs text-muted">
                {dayLabel(b.startsAt)}, {formatTime(b.startsAt)} Uhr · {b.department}, {b.address}
              </p>
            </div>
            {b.status === "gebucht" ? (
              <Button
                isDisabled={pending}
                size="sm"
                variant="ghost"
                onPress={() =>
                  start(async () => {
                    const res = await cancelAppointment(b.id);

                    if (res?.ok) toast.success(res.message ?? "Storniert");
                  })
                }
              >
                <Xmark />
                Stornieren
              </Button>
            ) : (
              <Chip size="sm" variant="soft">{b.status}</Chip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

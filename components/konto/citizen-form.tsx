"use client";

import { useActionState, useEffect } from "react";
import { FloppyDisk, Lock } from "@gravity-ui/icons";
import { Alert, Button, Card, Description, FieldError, Form, Input, Label, Spinner, TextField, toast } from "@heroui/react";

import { DateInput, SelectInput } from "@/components/forms/fields";
import { saveCitizen } from "@/app/actions/konto";
import type { Citizen } from "@/db/schema";

const DISTRICTS = ["Altona", "Bahrenfeld", "Barmbek", "Billstedt", "Eimsbüttel", "Harburg", "HafenCity", "Ottensen", "St. Georg", "St. Pauli", "Wandsbek", "Wilhelmsburg"];

export function CitizenForm({ citizen, next }: { citizen: Citizen | null; next?: string }) {
  const [state, action, pending] = useActionState(saveCitizen, null);
  const locked = !!citizen;

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  const text = (name: keyof Citizen, label: string, opts: { required?: boolean; placeholder?: string; lockable?: boolean; description?: string } = {}) => (
    <TextField
      defaultValue={citizen ? String(citizen[name] ?? "") : ""}
      isReadOnly={locked && opts.lockable !== false}
      isRequired={opts.required !== false && !(locked && opts.lockable === false)}
      name={name}
    >
      <Label>{label}</Label>
      <Input placeholder={opts.placeholder} />
      {opts.description ? <Description>{opts.description}</Description> : null}
      <FieldError />
    </TextField>
  );

  return (
    <Form action={action} className="flex flex-col gap-6" validationErrors={state?.errors}>
      {next ? <input name="weiter" type="hidden" value={next} /> : null}
      {state?.message && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content><Alert.Title>{state.message}</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      <Card>
        <Card.Header className="flex-row items-center justify-between gap-3">
          <div>
            <Card.Title className="text-base">Angaben zur Person</Card.Title>
            <Card.Description>So, wie Ihr Charakter im Melderegister steht.</Card.Description>
          </div>
          {locked ? <Lock className="size-4 text-muted" /> : null}
        </Card.Header>
        <Card.Content className="grid gap-5 sm:grid-cols-2">
          {text("firstName", "Vorname(n)")}
          {text("lastName", "Familienname")}
          {text("birthName", "Geburtsname", { required: false, description: "Nur wenn abweichend" })}
          <DateInput defaultValue={citizen?.birthDate} isReadOnly={locked} isRequired label="Geburtsdatum" name="birthDate" />
          {text("birthPlace", "Geburtsort", { placeholder: "z. B. Hamburg-Altona" })}
          {locked ? (
            text("gender", "Geschlecht")
          ) : (
            <SelectInput isRequired label="Geschlecht" name="gender" options={["männlich", "weiblich", "divers"]} />
          )}
          {text("nationality", "Staatsangehörigkeit", { placeholder: "deutsch" })}
        </Card.Content>
        {locked ? (
          <Card.Footer>
            <p className="text-xs text-muted">Namensänderungen beantragen Sie über die Leistung „Namensänderung“.</p>
          </Card.Footer>
        ) : null}
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-base">Anschrift</Card.Title>
          <Card.Description>{locked ? "Bei einem Umzug melden Sie die neue Anschrift über „Umzug innerhalb der Stadt melden“." : "Ihre Wohnanschrift in Nordverkehr."}</Card.Description>
        </Card.Header>
        <Card.Content className="grid gap-5 sm:grid-cols-2">
          {text("street", "Straße und Hausnummer")}
          {text("postalCode", "Postleitzahl", { placeholder: "20095" })}
          {locked ? text("district", "Stadtteil") : <SelectInput isRequired label="Stadtteil" name="district" options={DISTRICTS} />}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-base">Weitere Angaben</Card.Title>
          <Card.Description>Diese Angaben können Sie jederzeit ändern.</Card.Description>
        </Card.Header>
        <Card.Content className="grid gap-5 sm:grid-cols-2">
          {text("phone", "Telefonnummer (IC)", { required: false, lockable: false, placeholder: "0176 1234567" })}
          {text("occupation", "Beruf", { required: false, lockable: false })}
          <TextField defaultValue={citizen?.heightCm ? String(citizen.heightCm) : ""} name="heightCm" type="number">
            <Label>Körpergröße in cm</Label>
            <Input min={120} max={230} />
            <FieldError />
          </TextField>
          <SelectInput defaultValue={citizen?.eyeColor} label="Augenfarbe" name="eyeColor" options={["blau", "braun", "grau", "grün", "grünbraun", "blaugrau"]} />
          <SelectInput defaultValue={citizen?.maritalStatus ?? "ledig"} label="Familienstand" name="maritalStatus" options={["ledig", "verheiratet", "geschieden", "verwitwet"]} />
        </Card.Content>
      </Card>

      <div className="flex justify-end">
        <Button isPending={pending} size="lg" type="submit">
          {pending ? <Spinner color="current" size="sm" /> : <FloppyDisk />}
          {locked ? "Änderungen speichern" : "Meldedaten speichern"}
        </Button>
      </div>
    </Form>
  );
}

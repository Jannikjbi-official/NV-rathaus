"use client";

import { useActionState } from "react";
import { PaperPlane } from "@gravity-ui/icons";
import { Alert, Button, Card, Form, Spinner } from "@heroui/react";

import { DynamicFields } from "@/components/forms/fields";
import { submitApplication } from "@/app/actions/konto";
import type { FormField } from "@/lib/forms/types";

export function ApplicationForm({
  slug,
  fields,
  feeLabel,
  hidden,
}: {
  slug: string;
  fields: FormField[];
  feeLabel: string;
  hidden?: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(submitApplication.bind(null, slug), null);

  return (
    <Form action={action} className="flex flex-col gap-6" validationErrors={state?.errors}>
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} name={k} type="hidden" value={v} />
      ))}
      {state?.message ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Card>
        <Card.Header>
          <Card.Title className="text-base">Angaben zum Antrag</Card.Title>
          <Card.Description>Pflichtfelder sind markiert.</Card.Description>
        </Card.Header>
        <Card.Content>
          {fields.length ? <DynamicFields fields={fields} /> : <p className="text-sm text-muted">Für diese Leistung sind keine weiteren Angaben nötig.</p>}
        </Card.Content>
      </Card>
      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">Gebühr: {feeLabel}. Die Zahlung erfolgt im Spiel bei Abholung oder nach Aufforderung.</p>
        <Button isPending={pending} size="lg" type="submit">
          {pending ? <Spinner color="current" size="sm" /> : <PaperPlane />}
          Antrag verbindlich absenden
        </Button>
      </div>
    </Form>
  );
}

"use client";

import { useActionState, useEffect, useTransition } from "react";
import { ArrowRotateLeft, PaperPlane } from "@gravity-ui/icons";
import { AlertDialog, Button, FieldError, Form, Label, Spinner, TextArea, TextField, toast } from "@heroui/react";

import { replyToApplication, withdrawApplication } from "@/app/actions/konto";

export function ReplyForm({ applicationId, prominent }: { applicationId: string; prominent: boolean }) {
  const [state, action, pending] = useActionState(replyToApplication.bind(null, applicationId), null);

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <Form key={state?.ok ? "sent" : "draft"} action={action} className="flex flex-col gap-3" validationErrors={state?.errors}>
      <TextField isRequired name="message">
        <Label>{prominent ? "Ihre Antwort auf die Rückfrage" : "Nachricht an das Amt"}</Label>
        <TextArea placeholder="Ihre Nachricht …" rows={prominent ? 4 : 3} />
        <FieldError />
      </TextField>
      <Button className="self-end" isPending={pending} type="submit" variant={prominent ? "primary" : "tertiary"}>
        {pending ? <Spinner color="current" size="sm" /> : <PaperPlane />}
        Senden
      </Button>
    </Form>
  );
}

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [pending, start] = useTransition();

  return (
    <AlertDialog>
      <Button size="sm" variant="ghost">
        <ArrowRotateLeft />
        Antrag zurückziehen
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Antrag zurückziehen?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>Der Antrag wird nicht weiter bearbeitet. Das lässt sich nicht rückgängig machen; Sie können aber jederzeit einen neuen Antrag stellen.</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">Abbrechen</Button>
              <Button
                isPending={pending}
                variant="danger"
                onPress={() =>
                  start(async () => {
                    const res = await withdrawApplication(applicationId);

                    if (res?.ok) toast.success(res.message ?? "Zurückgezogen");
                    else toast.danger(res?.message ?? "Nicht möglich");
                  })
                }
              >
                Zurückziehen
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

export function SubmittedToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) toast.success("Ihr Antrag wurde eingereicht.", { description: "Sie erhalten eine Discord-Nachricht, sobald sich etwas ändert." });
  }, [show]);

  return null;
}

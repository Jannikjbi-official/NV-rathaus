"use client";

import { useState, useTransition } from "react";
import {
  CircleCheck,
  CircleQuestion,
  CircleXmark,
  FileText,
  Hand,
  PaperPlane,
  Plus,
  Receipt,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, Card, Input, Label, Modal, Separator, Tabs, TextArea, TextField, toast } from "@heroui/react";

import { DateInput } from "@/components/forms/fields";
import { DocumentThumb, DocumentViewer } from "@/components/documents/document-viewer";
import type { DocRender } from "@/components/documents/types";
import {
  addMessage,
  changeStatus,
  issueDocument,
  markFeePaid,
  type ActionResult,
} from "@/app/actions/verwaltung";
import type { ApplicationStatus } from "@/db/schema";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTime, formatEuro } from "@/lib/format";

type Preset = { title: string; validUntil: string | null; details: Record<string, string> } | null;

function useAction() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      const res = await fn();

      if (res.ok) {
        toast.success(res.message);
        onOk?.();
      } else toast.danger(res.message);
    });

  return { pending, run };
}

function DecisionModal({
  trigger,
  title,
  description,
  label,
  required,
  confirm,
  variant,
  onConfirm,
  templates = [],
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  label: string;
  required: boolean;
  confirm: string;
  variant: "primary" | "danger";
  onConfirm: (message: string) => Promise<ActionResult>;
  templates?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { pending, run } = useAction();

  return (
    <Modal isOpen={open} onOpenChange={setOpen}>
      {trigger}
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <p className="text-sm text-muted">{description}</p>
              {templates.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <Button key={t} size="sm" variant="tertiary" onPress={() => setText((cur) => (cur ? `${cur}\n${t}` : t))}>
                      {t.length > 42 ? `${t.slice(0, 40)}…` : t}
                    </Button>
                  ))}
                </div>
              ) : null}
              <TextField isRequired={required} value={text} onChange={setText}>
                <Label>{label}</Label>
                <TextArea rows={4} />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">Abbrechen</Button>
              <Button
                isDisabled={required && text.trim().length < 3}
                isPending={pending}
                variant={variant}
                onPress={() => run(() => onConfirm(text), () => { setOpen(false); setText(""); })}
              >
                {confirm}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function Workbench({
  applicationId,
  status,
  feeCents,
  feePaid,
  invoiceHref,
  payment,
  preset,
  issuedCount,
  draft,
}: {
  applicationId: string;
  status: ApplicationStatus;
  feeCents: number;
  feePaid: boolean;
  invoiceHref: string;
  payment: { last4: string; transactionId: string; paidAt: string } | null;
  preset: Preset;
  issuedCount: number;
  draft: DocRender | null;
}) {
  const { pending, run } = useAction();
  const open = ["eingereicht", "in_bearbeitung", "rueckfrage"].includes(status);

  return (
    <div className="flex flex-col gap-4">
      {open ? (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">Entscheidung</Card.Title>
            <Card.Description>Der Bürger wird per Discord benachrichtigt.</Card.Description>
          </Card.Header>
          <Card.Content className="gap-2">
            {status === "eingereicht" ? (
              <Button fullWidth isPending={pending} variant="secondary" onPress={() => run(() => changeStatus(applicationId, "in_bearbeitung"))}>
                <Hand />
                Bearbeitung übernehmen
              </Button>
            ) : null}
            <DecisionModal
              confirm="Genehmigen"
              description="Optional: Hinweis an den Bürger, z. B. zur Abholung."
              label="Nachricht (optional)"
              required={false}
              title="Antrag genehmigen"
              trigger={<Button fullWidth><CircleCheck />Genehmigen</Button>}
              variant="primary"
              onConfirm={(m) => changeStatus(applicationId, "genehmigt", m)}
            />
            <DecisionModal
              confirm="Rückfrage senden"
              description="Der Antrag pausiert, bis der Bürger antwortet."
              label="Ihre Rückfrage"
              templates={[
                "Bitte ergänzen Sie die fehlenden Angaben im Antrag.",
                "Bitte buchen Sie einen Termin zur persönlichen Vorsprache im Bürgerkonto.",
                "Bitte reichen Sie einen Nachweis über die Voraussetzungen nach.",
                "Bitte bestätigen Sie die Angaben zu Ihrem Fahrzeug (FIN, Versicherung).",
              ]}
              required
              title="Rückfrage stellen"
              trigger={<Button fullWidth variant="tertiary"><CircleQuestion />Rückfrage stellen</Button>}
              variant="primary"
              onConfirm={(m) => changeStatus(applicationId, "rueckfrage", m)}
            />
            <DecisionModal
              confirm="Ablehnen"
              description="Die Begründung wird dem Bürger angezeigt."
              label="Begründung"
              templates={[
                "Die gesetzlichen Voraussetzungen liegen nicht vor.",
                "Das Mindestalter ist nicht erreicht.",
                "Die Angaben sind unvollständig oder widersprüchlich.",
                "Es besteht bereits ein gleichartiger Antrag.",
              ]}
              required
              title="Antrag ablehnen"
              trigger={<Button fullWidth variant="danger-soft"><CircleXmark />Ablehnen</Button>}
              variant="danger"
              onConfirm={(m) => changeStatus(applicationId, "abgelehnt", m)}
            />
          </Card.Content>
        </Card>
      ) : null}

      {feeCents > 0 ? (
        <Card>
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Gebühr {formatEuro(feeCents)}</Card.Title>
            <span className={`text-sm ${feePaid ? "text-success" : "text-warning"}`}>{feePaid ? "bezahlt" : "offen"}</span>
          </Card.Header>
          <Card.Content className="text-sm">
            {payment ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted">Zahlart</dt>
                <dd className="m-0">NordPay ···· {payment.last4}</dd>
                <dt className="text-muted">Transaktion</dt>
                <dd className="m-0 font-mono text-xs leading-5">{payment.transactionId}</dd>
                <dt className="text-muted">Eingang</dt>
                <dd className="m-0">{formatDateTime(payment.paidAt)}</dd>
              </dl>
            ) : feePaid ? (
              <p className="text-muted">Bar an der Kasse verbucht.</p>
            ) : (
              <p className="text-muted">Der Bürger kann online mit NordPay zahlen. Bei Barzahlung hier verbuchen.</p>
            )}
          </Card.Content>
          <Card.Footer className="flex-col gap-2">
            {!feePaid ? (
              <Button fullWidth isPending={pending} size="sm" variant="secondary" onPress={() => run(() => markFeePaid(applicationId))}>
                <Receipt />
                Barzahlung verbuchen
              </Button>
            ) : null}
            <ButtonLink fullWidth href={invoiceHref} size="sm" variant="tertiary">
              <FileText />
              Rechnung ansehen
            </ButtonLink>
          </Card.Footer>
        </Card>
      ) : null}

      {preset && status === "genehmigt" ? <IssueDocument applicationId={applicationId} draft={draft} issuedCount={issuedCount} preset={preset} /> : null}

      <MessageBox applicationId={applicationId} />
    </div>
  );
}

function MessageBox({ applicationId }: { applicationId: string }) {
  const [tab, setTab] = useState<"buerger" | "intern">("buerger");
  const [text, setText] = useState("");
  const { pending, run } = useAction();

  return (
    <Card>
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as "buerger" | "intern")}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Nachrichtenart">
            <Tabs.Tab id="buerger">An Bürger<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="intern">Interne Notiz<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <TextField aria-label="Nachricht" value={text} onChange={setText}>
        <TextArea placeholder={tab === "intern" ? "Nur für die Verwaltung sichtbar" : "Wird dem Bürger angezeigt und per Discord gesendet"} rows={3} />
      </TextField>
      <Button
        className="self-end"
        isDisabled={text.trim().length < 2}
        isPending={pending}
        size="sm"
        variant={tab === "intern" ? "tertiary" : "primary"}
        onPress={() => run(() => addMessage(applicationId, text, tab === "intern"), () => setText(""))}
      >
        <PaperPlane />
        {tab === "intern" ? "Notiz speichern" : "Senden"}
      </Button>
    </Card>
  );
}

function IssueDocument({ applicationId, preset, issuedCount, draft }: { applicationId: string; preset: NonNullable<Preset>; issuedCount: number; draft: DocRender | null }) {
  const [title, setTitle] = useState(preset.title);
  const [rows, setRows] = useState(Object.entries(preset.details));
  const [bigPreview, setBigPreview] = useState(false);
  const previewDoc: DocRender | null = draft ? { ...draft, title, details: Object.fromEntries(rows.filter(([k, v]) => k.trim() && v.trim())) } : null;
  const { pending, run } = useAction();

  return (
    <Card>
      <Card.Header className="flex-row items-center gap-2">
        <FileText className="size-4 text-accent" />
        <Card.Title className="text-base">{issuedCount ? "Weiteres Dokument ausstellen" : "Dokument ausstellen"}</Card.Title>
      </Card.Header>
      {previewDoc ? (
        <Modal isOpen={bigPreview} onOpenChange={setBigPreview}>
          <button aria-label="Große Vorschau öffnen" className="group flex flex-col gap-1.5 rounded-2xl bg-default/60 p-3 text-left" type="button">
            <div className="mx-auto w-full" style={{ maxWidth: ["urkunde", "bescheid", "bescheinigung", "genehmigung", "gewerbeschein"].includes(previewDoc.type) ? 150 : undefined }}>
              <DocumentThumb doc={previewDoc} />
            </div>
            <span className="text-center text-xs text-muted group-hover:text-foreground">Live-Vorschau · zum Vergrößern klicken</span>
          </button>
          <Modal.Backdrop>
            <Modal.Container size="lg">
              <Modal.Dialog className="sm:max-w-5xl">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Vorschau: {previewDoc.title}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <DocumentViewer doc={previewDoc} />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const valid = new FormData(e.currentTarget).get("validUntil");

          run(() => issueDocument(applicationId, { title, validUntil: valid ? String(valid) : null, details: Object.fromEntries(rows) }));
        }}
      >
        <TextField isRequired value={title} onChange={setTitle}>
          <Label>Bezeichnung</Label>
          <Input />
        </TextField>
        <DateInput defaultValue={preset.validUntil} label="Gültig bis (leer = unbefristet)" name="validUntil" />
        <Separator />
        <p className="text-xs font-medium text-muted">Angaben auf dem Dokument</p>
        {rows.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2">
            <TextField aria-label="Feld" className="min-w-0" value={k} onChange={(nk) => setRows(rows.map((r, j) => (j === i ? [nk, r[1]] : r)))}>
              <Input placeholder="Feld" />
            </TextField>
            <TextField aria-label="Wert" className="min-w-0" value={v} onChange={(nv) => setRows(rows.map((r, j) => (j === i ? [r[0], nv] : r)))}>
              <Input placeholder="Wert" />
            </TextField>
            <Button aria-label="Zeile entfernen" isIconOnly size="sm" variant="ghost" onPress={() => setRows(rows.filter((_, j) => j !== i))}>
              <TrashBin />
            </Button>
          </div>
        ))}
        <Button className="self-start" size="sm" variant="ghost" onPress={() => setRows([...rows, ["", ""]])}>
          <Plus />
          Angabe hinzufügen
        </Button>
        <Button isPending={pending} type="submit">
          <FileText />
          Ausstellen
        </Button>
      </form>
    </Card>
  );
}

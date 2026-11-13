"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  ArrowLeft,
  CircleCheck,
  CircleXmarkFill,
  CreditCard,
  FileText,
  LockFill,
  ShieldCheck,
  Smartphone,
  TriangleExclamationFill,
  Wallet,
} from "@gravity-ui/icons";
import {
  Alert,
  Button,
  Card,
  Chip,
  FieldError,
  Input,
  InputOTP,
  Label,
  Radio,
  RadioGroup,
  Separator,
  Spinner,
  TextField,
} from "@heroui/react";

import { NordPayLogo, NordStar, StadtbankMark } from "./brand";
import { NordPayCard } from "./nordpay-card";
import { BankPhone } from "./phone";

import { cancelPayment, confirmPayment, startPayment } from "@/app/actions/zahlung";
import { Scaled } from "@/components/documents/document-viewer";
import { A4_H, A4_MM, A4_W } from "@/components/documents/templates/paper";
import { Invoice, type InvoiceData } from "@/components/documents/templates/invoice";
import { ButtonLink } from "@/components/ui/button-link";
import { formatEuro, formatLongDate } from "@/lib/format";
import { formatCardNumber, NORDPAY, realNetwork, validateCard, type CardErrors, type CardInput, type NordPayCard as Card4 } from "@/lib/nordpay";

type Step = "rechnung" | "karte" | "secure" | "fertig";
type Challenge = { paymentId: string; code: string; transactionId: string; last4: string; expiresAt: string };
type Receipt = { transactionId: string; paidAt: string; last4: string };

const STEPS: { id: Step; label: string }[] = [
  { id: "rechnung", label: "Rechnung" },
  { id: "karte", label: "Zahlungsdaten" },
  { id: "secure", label: NORDPAY.secure },
  { id: "fertig", label: "Bestätigung" },
];

const PROCESSING = ["Sichere Verbindung zu NordPay", "Karte bei der Stadtbank Nordverkehr prüfen", `${NORDPAY.secure}-Freigabe anfordern`];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const timeOf = (iso: string) => new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function Stepper({ step }: { step: Step }) {
  const index = STEPS.findIndex((s) => s.id === step);

  return (
    <ol aria-label="Fortschritt der Zahlung" className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-col gap-2">
          <span className={`h-1.5 rounded-full transition-colors duration-500 ${i < index ? "bg-success" : i === index ? "bg-accent" : "bg-default"}`} />
          <span className={`text-xs ${i === index ? "font-semibold text-foreground" : "text-muted"}`}>
            {i + 1}. {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function useCountdown(until: string | null) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!until) return;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(until).getTime() - Date.now()) / 1000)));

    tick();
    const t = setInterval(tick, 1000);

    return () => clearInterval(t);
  }, [until]);

  return left;
}

export function Checkout({ applicationId, slug, invoice, card }: { applicationId: string; slug: string; invoice: InvoiceData; card: Card4 }) {
  const [step, setStep] = useState<Step>("rechnung");
  const [method, setMethod] = useState<"karte" | "bar">("karte");
  const [form, setForm] = useState<CardInput>({ number: "", holder: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<CardErrors>({});
  const [focus, setFocus] = useState<keyof CardInput | null>(null);
  const [filling, setFilling] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [approved, setApproved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const firstStep = useRef(true);
  const left = useCountdown(challenge?.expiresAt ?? null);
  const network = realNetwork(form.number);
  const amount = formatEuro(invoice.amountCents);

  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;

      return;
    }
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const set = (key: keyof CardInput, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Tippt die persönliche Karte Zeichen für Zeichen ein. */
  const fillOwnCard = async () => {
    setFilling(true);
    setErrors({});
    setForm({ number: "", holder: "", expiry: "", cvc: "" });
    const type = async (key: keyof CardInput, text: string, delay: number) => {
      setFocus(key);
      for (let i = 1; i <= text.length; i++) {
        setForm((f) => ({ ...f, [key]: text.slice(0, i) }));
        await sleep(delay);
      }
    };

    await type("number", card.number, 32);
    await type("holder", card.holder, 22);
    await type("expiry", card.expiry, 60);
    await type("cvc", card.cvc, 140);
    await sleep(500);
    setFocus(null);
    setFilling(false);
  };

  const pay = async () => {
    const found = validateCard(form);

    if (Object.keys(found).length) {
      setErrors(found);

      return;
    }
    setFocus(null);
    setFailure(null);
    setProcessing(0);
    const ticker = setInterval(() => setProcessing((p) => (p === null ? p : Math.min(p + 1, PROCESSING.length - 1))), 850);
    const [res] = await Promise.all([startPayment(applicationId, form), sleep(2600)]);

    clearInterval(ticker);
    setProcessing(null);

    if (!res.ok) {
      setErrors(res.errors ?? {});
      setFailure(res.message);

      return;
    }
    setOtp("");
    setOtpError(null);
    setApproved(false);
    setChallenge({ paymentId: res.paymentId, code: res.code, transactionId: res.transactionId, last4: res.last4, expiresAt: res.expiresAt });
    setStep("secure");
  };

  const confirm = async (code: string) => {
    if (!challenge || busy.current) return;
    busy.current = true;
    setVerifying(true);
    setOtpError(null);
    const [res] = await Promise.all([confirmPayment(challenge.paymentId, code), sleep(1100)]);

    busy.current = false;
    setVerifying(false);

    if (res.ok) {
      setReceipt({ transactionId: res.transactionId, paidAt: res.paidAt, last4: res.last4 });
      setStep("fertig");

      return;
    }
    if (res.final) {
      setChallenge(null);
      setFailure(res.message);
      setStep("karte");

      return;
    }
    setOtp("");
    setApproved(false);
    setOtpError(res.message);
    setShake((n) => n + 1);
  };

  const abort = async (message: string | null) => {
    if (challenge) await cancelPayment(challenge.paymentId);
    setChallenge(null);
    setFailure(message);
    setStep("karte");
  };

  return (
    <div ref={top} className="flex scroll-mt-24 flex-col gap-6">
      <Stepper step={step} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {step === "rechnung" ? (
            <Card className="np-fade-up">
              <Card.Header>
                <Card.Title className="text-base">Ihre Rechnung</Card.Title>
                <Card.Description>
                  {invoice.number} vom {formatLongDate(invoice.issuedAt)} · fällig am {formatLongDate(invoice.dueAt)}
                </Card.Description>
              </Card.Header>
              <Card.Content className="gap-5">
                <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                  <NextLink aria-label="Rechnung in voller Größe öffnen" className="block rounded-lg transition hover:-translate-y-0.5" href={`/konto/antraege/${slug}/rechnung`}>
                    <Scaled side={{ id: "rechnung", label: "Rechnung", width: A4_W, height: A4_H, mm: A4_MM, node: <Invoice inv={invoice} /> }} />
                  </NextLink>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                      <span className="font-medium">{invoice.serviceTitle}</span>
                      <span className="text-right font-medium">{amount}</span>
                      <span className="text-xs text-muted">Tarif {invoice.tariff} · {invoice.department.name}</span>
                      <span />
                      <span className="text-muted">Auslagen</span>
                      <span className="text-right text-muted">{formatEuro(0)}</span>
                      <span className="text-muted">Umsatzsteuer</span>
                      <span className="text-right text-muted">entfällt</span>
                    </div>
                    <Separator />
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold">Zu zahlen</span>
                      <span className="text-2xl font-semibold tracking-tight">{amount}</span>
                    </div>
                    <p className="text-xs text-muted">Verwendungszweck {invoice.number} · {invoice.reference}</p>
                  </div>
                </div>
              </Card.Content>
              <Card.Footer className="flex-wrap justify-between gap-2">
                <ButtonLink href={`/konto/antraege/${slug}/rechnung`} variant="tertiary">
                  <FileText />
                  Rechnung als PDF
                </ButtonLink>
                <Button onPress={() => setStep("karte")}>
                  Weiter zur Zahlung
                </Button>
              </Card.Footer>
            </Card>
          ) : null}

          {step === "karte" ? (
            <div className="np-fade-up flex flex-col gap-5">
              {failure ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Zahlung nicht abgeschlossen</Alert.Title>
                    <Alert.Description>{failure} Es wurde nichts abgebucht.</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              <RadioGroup aria-label="Zahlungsart" className="grid gap-3 sm:grid-cols-2" value={method} onChange={(v) => setMethod(v as "karte" | "bar")}>
                <Radio className="rounded-2xl border border-separator bg-surface p-4 data-[selected=true]:border-accent" value="karte">
                  <Radio.Content className="items-start">
                    <Radio.Control className="mt-0.5">
                      <Radio.Indicator />
                    </Radio.Control>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium"><CreditCard className="size-4" />NordPay-Karte</span>
                      <span className="text-xs text-muted">Sofort bezahlt, mit {NORDPAY.secure}-Freigabe</span>
                    </span>
                  </Radio.Content>
                </Radio>
                <Radio className="rounded-2xl border border-separator bg-surface p-4 data-[selected=true]:border-accent" value="bar">
                  <Radio.Content className="items-start">
                    <Radio.Control className="mt-0.5">
                      <Radio.Indicator />
                    </Radio.Control>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium"><Wallet className="size-4" />Bar im Amt</span>
                      <span className="text-xs text-muted">Bei Abholung im {invoice.department.name}</span>
                    </span>
                  </Radio.Content>
                </Radio>
              </RadioGroup>

              {method === "bar" ? (
                <Card className="np-fade-up">
                  <Card.Header>
                    <Card.Title className="text-base">Barzahlung bei Abholung</Card.Title>
                    <Card.Description>
                      Nennen Sie am Schalter Ihr Aktenzeichen {invoice.reference}. Die Sachbearbeitung verbucht die Zahlung, Sie erhalten die Rechnung mit Zahlungsvermerk im Bürgerkonto.
                    </Card.Description>
                  </Card.Header>
                  <Card.Footer className="gap-2">
                    <ButtonLink href={`/konto/antraege/${slug}`} variant="secondary">Zurück zum Antrag</ButtonLink>
                    <ButtonLink href="/konto/termine" variant="tertiary">Termin buchen</ButtonLink>
                  </Card.Footer>
                </Card>
              ) : (
                <Card className="relative overflow-hidden">
                  {processing !== null ? (
                    <div className="np-fade-up absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-surface/95 p-6 backdrop-blur-sm">
                      <div className="relative flex size-20 items-center justify-center">
                        <span className="absolute inset-0 animate-ping rounded-full bg-accent/15" />
                        <NordPayLogo className="relative" size={30} />
                      </div>
                      <ol className="flex w-full max-w-sm flex-col gap-3">
                        {PROCESSING.map((label, i) => (
                          <li key={label} className={`flex items-center gap-3 text-sm transition-opacity ${i > processing ? "opacity-40" : ""}`}>
                            {i < processing ? (
                              <CircleCheck className="np-pop size-5 text-success" />
                            ) : i === processing ? (
                              <Spinner size="sm" />
                            ) : (
                              <span className="size-5 rounded-full border-2 border-default" />
                            )}
                            {label}
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs text-muted">Bitte schließen Sie dieses Fenster nicht.</p>
                    </div>
                  ) : null}

                  <Card.Content className="gap-6">
                    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <NordPayCard
                        cvc={form.cvc}
                        expiry={form.expiry}
                        flipped={focus === "cvc"}
                        focus={focus}
                        holder={form.holder}
                        number={form.number}
                        warning={!!network}
                      />
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-muted">
                          Jede Bürgerin und jeder Bürger hat eine persönliche NordPay-Karte der Stadtbank Nordverkehr. Sie können sie automatisch einsetzen.
                        </p>
                        <Button isDisabled={filling} variant="secondary" onPress={fillOwnCard}>
                          {filling ? <Spinner color="current" size="sm" /> : <NordStar size={16} />}
                          Meine NordPay-Karte einsetzen
                        </Button>
                        <p className="text-xs text-muted">Karte ···· {card.number.slice(-4)} · {card.holder}</p>
                      </div>
                    </div>

                    {network ? (
                      <Alert status="danger">
                        <Alert.Indicator>
                          <TriangleExclamationFill />
                        </Alert.Indicator>
                        <Alert.Content>
                          <Alert.Title>Bitte keine echten Kartendaten!</Alert.Title>
                          <Alert.Description>
                            Diese Nummer sieht nach {network} aus. NordPay ist ein Spiel-Zahlungsdienst: Echte Kartendaten werden hier niemals gebraucht und nicht übertragen. Löschen Sie die Eingabe.
                          </Alert.Description>
                        </Alert.Content>
                      </Alert>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        autoComplete="off"
                        className="sm:col-span-2"
                        isDisabled={filling}
                        isInvalid={!!errors.number || !!network}
                        value={form.number}
                        onBlur={() => setFocus(null)}
                        onChange={(v) => set("number", formatCardNumber(v))}
                        onFocus={() => setFocus("number")}
                      >
                        <Label>Kartennummer</Label>
                        <Input className="font-mono" inputMode="numeric" placeholder="9276 •••• •••• ••••" />
                        <FieldError>{errors.number ?? (network ? "Echte Kartennummern sind nicht erlaubt." : null)}</FieldError>
                      </TextField>
                      <TextField
                        autoComplete="off"
                        className="sm:col-span-2"
                        isDisabled={filling}
                        isInvalid={!!errors.holder}
                        value={form.holder}
                        onBlur={() => setFocus(null)}
                        onChange={(v) => set("holder", v.toUpperCase().slice(0, 40))}
                        onFocus={() => setFocus("holder")}
                      >
                        <Label>Name auf der Karte</Label>
                        <Input placeholder="VORNAME NACHNAME" />
                        <FieldError>{errors.holder}</FieldError>
                      </TextField>
                      <TextField
                        autoComplete="off"
                        isDisabled={filling}
                        isInvalid={!!errors.expiry}
                        value={form.expiry}
                        onBlur={() => setFocus(null)}
                        onChange={(v) => {
                          const d = v.replace(/\D/g, "").slice(0, 4);

                          set("expiry", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                        }}
                        onFocus={() => setFocus("expiry")}
                      >
                        <Label>Gültig bis</Label>
                        <Input className="font-mono" inputMode="numeric" placeholder="MM/JJ" />
                        <FieldError>{errors.expiry}</FieldError>
                      </TextField>
                      <TextField
                        autoComplete="off"
                        isDisabled={filling}
                        isInvalid={!!errors.cvc}
                        value={form.cvc}
                        onBlur={() => setFocus(null)}
                        onChange={(v) => set("cvc", v.replace(/\D/g, "").slice(0, 3))}
                        onFocus={() => setFocus("cvc")}
                        type="password"
                      >
                        <Label>Prüfnummer</Label>
                        <Input className="font-mono" inputMode="numeric" placeholder="•••" />
                        <FieldError>{errors.cvc}</FieldError>
                      </TextField>
                    </div>
                  </Card.Content>
                  <Card.Footer className="flex-wrap items-center justify-between gap-3">
                    <Button variant="tertiary" onPress={() => setStep("rechnung")}>
                      <ArrowLeft />
                      Zurück
                    </Button>
                    <Button isDisabled={filling || !!network || processing !== null} size="lg" onPress={pay}>
                      <LockFill />
                      {amount} bezahlen
                    </Button>
                  </Card.Footer>
                </Card>
              )}
            </div>
          ) : null}

          {step === "secure" && challenge ? (
            <div className="np-fade-up grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <Card key={shake} className={`relative overflow-hidden ${shake ? "np-shake" : ""}`}>
                {verifying ? (
                  <div className="np-fade-up absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/95">
                    <Spinner size="lg" />
                    <p className="text-sm font-medium">Zahlung wird autorisiert …</p>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-b border-separator bg-[#0e3a5c] px-5 py-3 text-white">
                  <span className="flex items-center gap-2.5">
                    <StadtbankMark size={26} />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold">Stadtbank Nordverkehr</span>
                      <span className="block text-[11px] opacity-75">Sicherheitsprüfung Ihrer Bank</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                    <ShieldCheck className="size-3.5" />
                    {NORDPAY.secure}
                  </span>
                </div>
                <Card.Content className="gap-5 pt-5">
                  <div>
                    <h2 className="text-lg font-semibold">Bestätigen Sie Ihre Zahlung</h2>
                    <p className="text-sm text-muted">
                      Wir haben einen sechsstelligen Code an Ihre Stadtbank-App und per Discord-Direktnachricht gesendet. Sie können die Zahlung auch direkt in der App freigeben.
                    </p>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-xl bg-default/60 p-4 text-sm">
                    <dt className="text-muted">Händler</dt>
                    <dd className="m-0 font-medium">Stadtkasse Nordverkehr</dd>
                    <dt className="text-muted">Betrag</dt>
                    <dd className="m-0 font-medium">{amount}</dd>
                    <dt className="text-muted">Karte</dt>
                    <dd className="m-0 font-medium">NordPay ···· {challenge.last4}</dd>
                    <dt className="text-muted">Vorgang</dt>
                    <dd className="m-0 font-mono text-xs leading-5">{challenge.transactionId}</dd>
                  </dl>

                  <div className="flex flex-col items-center gap-3">
                    <Label className="text-sm">Bestätigungscode</Label>
                    <InputOTP
                      autoFocus
                      aria-label="Bestätigungscode"
                      isDisabled={verifying || left === 0}
                      isInvalid={!!otpError}
                      maxLength={6}
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        setOtpError(null);
                      }}
                      onComplete={(v) => confirm(v)}
                    >
                      <InputOTP.Group>
                        <InputOTP.Slot index={0} />
                        <InputOTP.Slot index={1} />
                        <InputOTP.Slot index={2} />
                      </InputOTP.Group>
                      <InputOTP.Separator />
                      <InputOTP.Group>
                        <InputOTP.Slot index={3} />
                        <InputOTP.Slot index={4} />
                        <InputOTP.Slot index={5} />
                      </InputOTP.Group>
                    </InputOTP>
                    {otpError ? <p className="text-sm text-danger">{otpError}</p> : null}
                    <p className={`text-xs ${left < 60 ? "text-warning" : "text-muted"}`}>
                      {left > 0 ? `Code gültig noch ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} Minuten` : "Der Code ist abgelaufen."}
                    </p>
                  </div>
                </Card.Content>
                <Card.Footer className="flex-wrap justify-between gap-2">
                  <Button variant="tertiary" onPress={() => abort(null)}>Abbrechen</Button>
                  {left === 0 ? (
                    <Button
                      onPress={() => {
                        setStep("karte");
                        void pay();
                      }}
                    >
                      Neuen Code anfordern
                    </Button>
                  ) : (
                    <Button isDisabled={otp.length < 6} isPending={verifying} onPress={() => confirm(otp)}>
                      Bestätigen
                    </Button>
                  )}
                </Card.Footer>
              </Card>

              <div className="flex flex-col items-center gap-2">
                <BankPhone
                  amountCents={invoice.amountCents}
                  approved={approved}
                  code={challenge.code}
                  last4={challenge.last4}
                  onApprove={() => {
                    setApproved(true);
                    setOtp(challenge.code);
                    void confirm(challenge.code);
                  }}
                  onDecline={() => abort("Sie haben die Zahlung in der Stadtbank-App abgelehnt.")}
                />
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Smartphone className="size-3.5" />
                  Ihr Handy im Rollenspiel
                </p>
              </div>
            </div>
          ) : null}

          {step === "fertig" && receipt ? (
            <Card className="np-fade-up overflow-hidden">
              <Card.Content className="items-center gap-4 py-10 text-center">
                <div className="relative">
                  {Array.from({ length: 18 }, (_, i) => {
                    const angle = (i / 18) * Math.PI * 2;
                    const dist = 70 + (i % 3) * 22;

                    return (
                      <span
                        key={i}
                        className="np-confetti"
                        style={
                          {
                            background: ["#17803d", "#c41e1e", "#11707f", "#e2b85c"][i % 4],
                            "--x": `${Math.cos(angle) * dist}px`,
                            "--y": `${Math.sin(angle) * dist}px`,
                            "--r": `${i * 47}deg`,
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
                  <svg aria-hidden className="relative" height="96" viewBox="0 0 96 96" width="96">
                    <circle className="np-draw-circle" cx="48" cy="48" fill="none" r="44" stroke="var(--success)" strokeLinecap="round" strokeWidth="5" />
                    <path className="np-draw-check" d="M29 49 l13 13 l25 -27" fill="none" stroke="var(--success)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
                  </svg>
                </div>
                <div className="np-fade-up [animation-delay:.9s]">
                  <h2 className="text-2xl font-semibold tracking-tight">Zahlung erfolgreich</h2>
                  <p className="text-muted">{amount} an die Stadtkasse Nordverkehr</p>
                </div>
                <dl className="np-fade-up grid w-full max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl bg-default/60 p-5 text-left text-sm [animation-delay:1.1s]">
                  <dt className="text-muted">Transaktion</dt>
                  <dd className="m-0 font-mono">{receipt.transactionId}</dd>
                  <dt className="text-muted">Zeitpunkt</dt>
                  <dd className="m-0">{timeOf(receipt.paidAt)}</dd>
                  <dt className="text-muted">Karte</dt>
                  <dd className="m-0">NordPay ···· {receipt.last4}</dd>
                  <dt className="text-muted">Rechnung</dt>
                  <dd className="m-0">{invoice.number}</dd>
                  <dt className="text-muted">Aktenzeichen</dt>
                  <dd className="m-0">{invoice.reference}</dd>
                </dl>
                <p className="np-fade-up max-w-md text-xs text-muted [animation-delay:1.2s]">Die Quittung wurde Ihnen zusätzlich per Discord gesendet. Die Rechnung trägt jetzt den Vermerk „bezahlt“.</p>
                <div className="np-fade-up flex flex-wrap justify-center gap-2 [animation-delay:1.3s]">
                  <ButtonLink href={`/konto/antraege/${slug}/rechnung`} variant="secondary">
                    <FileText />
                    Rechnung mit Zahlungsvermerk
                  </ButtonLink>
                  <ButtonLink href={`/konto/antraege/${slug}`}>Zurück zum Antrag</ButtonLink>
                </div>
              </Card.Content>
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card>
            <Card.Header>
              <Card.Description>Zahlung an</Card.Description>
              <Card.Title className="text-base">Stadtkasse Nordverkehr</Card.Title>
            </Card.Header>
            <Card.Content className="gap-3 text-sm">
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                <span className="min-w-0">{invoice.serviceTitle}</span>
                <span className="text-right">{amount}</span>
                <span className="text-xs text-muted">{invoice.department.name}</span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Gesamt</span>
                <span className="text-xl font-semibold tracking-tight">{amount}</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted">
                <span>Rechnung</span>
                <span className="text-right font-mono">{invoice.number}</span>
                <span>Aktenzeichen</span>
                <span className="text-right">{invoice.reference}</span>
              </div>
            </Card.Content>
            <Card.Footer className="flex-wrap gap-2">
              {step === "fertig" ? (
                <Chip color="success" variant="soft">bezahlt</Chip>
              ) : (
                <>
                  <Chip size="sm" variant="soft"><ShieldCheck className="size-3" />{NORDPAY.secure}</Chip>
                  <Chip size="sm" variant="soft"><LockFill className="size-3" />verschlüsselt</Chip>
                </>
              )}
            </Card.Footer>
          </Card>
          <div className="flex gap-3 rounded-2xl border border-dashed border-warning/60 bg-warning-soft/40 p-4 text-xs text-warning-soft-foreground">
            <TriangleExclamationFill className="mt-0.5 size-4 shrink-0" />
            <p>{NORDPAY.disclaimer}</p>
          </div>
          {step !== "fertig" ? (
            <NextLink className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground" href={`/konto/antraege/${slug}`}>
              <CircleXmarkFill className="size-4" />
              Zahlung abbrechen, zurück zum Antrag
            </NextLink>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

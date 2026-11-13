"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  ArrowRight,
  ArrowRightToSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleCheckFill,
  Clock,
  FileText,
  Flame,
  Handset,
  LayoutCellsLarge,
  Megaphone,
  Receipt,
  SealCheck,
  ShieldCheck,
  Star,
  TrafficLight,
} from "@gravity-ui/icons";
import { Avatar, Button, Card, Chip, Link, Separator, Table } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { Icon } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/page-header";
import { asset } from "@/lib/asset";
import { formatEuro, formatLongDate, formatTime } from "@/lib/format";
import { POST_KINDS } from "@/lib/status";

type PostItem = {
  slug: string;
  kind: keyof typeof POST_KINDS;
  title: string;
  teaser: string;
  imageUrl: string | null;
  gazetteNumber: string | null;
  publishedAt: Date;
};

export type HomeData = {
  stage: PostItem[];
  services: { slug: string; title: string; department: string; feeCents: number; lifeEvent: string; icon: string }[];
  serviceCount: number;
  news: PostItem[];
  notices: PostItem[];
  traffic: { id: string; location: string; category: string; severity: "hoch" | "mittel" | "info"; detail: string }[];
  events: { id: string; title: string; location: string; startsAt: Date }[];
  departments: { slug: string; name: string; address: string; phone: string; status: { label: string; tone: "success" | "warning" | "default" } }[];
  jobs: { slug: string; title: string; organization: string; deadline: string | null }[];
  jobCount: number;
  account: { name: string; openApplications: number } | null;
};

const SEVERITY = { hoch: "danger", mittel: "warning", info: "default" } as const;

export function HomeView({ data }: { data: HomeData }) {
  return (
    <div className="flex flex-col gap-14">
      {data.stage.length > 0 ? <Stage posts={data.stage} /> : null}

      <section aria-labelledby="leistungen">
        <SectionHeading
          action={<Link className="text-sm" href="/leistungen">Alle Leistungen A–Z<Link.Icon><ArrowRight /></Link.Icon></Link>}
          title="Online-Dienstleistungen"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.services.map((s) => (
            <NextLink key={s.slug} className="group rounded-3xl" href={`/leistungen/${s.slug}`}>
              <Card className="h-full gap-3 transition-shadow group-hover:shadow-overlay">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={s.icon} size={20} />
                </span>
                <Card.Header className="gap-1">
                  <Card.Title className="leading-snug">{s.title}</Card.Title>
                  <Card.Description className="text-xs">{s.department}</Card.Description>
                </Card.Header>
                <Card.Footer className="mt-auto">
                  <Chip color="success" size="sm" variant="soft">
                    <CircleCheckFill width={10} />
                    <Chip.Label>Online · {formatEuro(s.feeCents)}</Chip.Label>
                  </Chip>
                </Card.Footer>
              </Card>
            </NextLink>
          ))}
          <NextLink className="group rounded-3xl" href="/pruefen">
            <Card className="h-full gap-3 transition-shadow group-hover:shadow-overlay">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <SealCheck height={20} width={20} />
              </span>
              <Card.Header className="gap-1">
                <Card.Title className="leading-snug">Dokument prüfen</Card.Title>
                <Card.Description className="text-xs">Echtheitsprüfung</Card.Description>
              </Card.Header>
            </Card>
          </NextLink>
          <NextLink className="group rounded-3xl" href="/leistungen">
            <Card className="h-full gap-3" variant="secondary">
              <span className="flex size-10 items-center justify-center rounded-xl bg-default">
                <LayoutCellsLarge height={20} width={20} />
              </span>
              <Card.Header className="gap-1">
                <Card.Title>Alle {data.serviceCount} Leistungen</Card.Title>
                <Card.Description className="text-xs">nach Amt oder A–Z</Card.Description>
              </Card.Header>
            </Card>
          </NextLink>
        </div>
      </section>

      {data.news.length > 0 ? (
        <section>
          <SectionHeading
            action={<Link className="text-sm" href="/aktuelles">Alle Meldungen<Link.Icon><ArrowRight /></Link.Icon></Link>}
            title="Aktuelles"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            {data.news.map((n, i) => (
              <NextLink key={n.slug} className={`group rounded-3xl ${i === 0 ? "md:col-span-2 lg:col-span-1" : ""}`} href={`/aktuelles/${n.slug}`}>
                <Card className="h-full overflow-hidden p-0">
                  <div className="relative overflow-hidden bg-default">
                    {n.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src={asset(n.imageUrl)} />
                    ) : (
                      <div className="aspect-[16/9] w-full" />
                    )}
                    <Chip className="absolute left-3 top-3" color="accent" size="sm" variant="primary">{POST_KINDS[n.kind].label}</Chip>
                  </div>
                  <Card.Header className="gap-1.5 px-5 pb-5">
                    <time className="text-xs text-muted">{formatLongDate(n.publishedAt)}</time>
                    <Card.Title className={i === 0 ? "text-xl leading-snug" : "text-base leading-snug"}>{n.title}</Card.Title>
                    {i === 0 ? <Card.Description>{n.teaser}</Card.Description> : null}
                  </Card.Header>
                </Card>
              </NextLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <ListCard footer={{ href: "/aktuelles?art=bekanntmachung", label: "Zum Amtsblatt" }} icon={<FileText width={18} />} title="Amtliche Bekanntmachungen">
          {data.notices.map((n) => (
            <NextLink key={n.slug} className="block py-3" href={`/aktuelles/${n.slug}`}>
              <p className="text-sm font-medium leading-snug">{n.title}</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <Chip color={n.gazetteNumber ? "accent" : "default"} size="sm" variant="soft">{n.gazetteNumber ?? "Bekanntmachung"}</Chip>
                <span className="tabular-nums">{formatLongDate(n.publishedAt)}</span>
              </div>
            </NextLink>
          ))}
        </ListCard>

        <ListCard footer={{ href: "/aktuelles?art=verkehr", label: "Alle Verkehrsmeldungen" }} icon={<TrafficLight width={18} />} title="Verkehrsmeldungen">
          {data.traffic.map((t) => (
            <div key={t.id} className="py-3">
              <p className="text-sm font-medium leading-snug">{t.location}</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <Chip color={SEVERITY[t.severity]} size="sm" variant="soft">{t.category}</Chip>
                <span>{t.detail}</span>
              </div>
            </div>
          ))}
        </ListCard>

        <ListCard icon={<Star width={18} />} title="Veranstaltungen">
          {data.events.map((e) => {
            const d = new Date(e.startsAt);

            return (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-default leading-none">
                  <span className="text-[0.65rem] font-semibold uppercase text-accent">
                    {d.toLocaleDateString("de-DE", { month: "short", timeZone: "Europe/Berlin" })}
                  </span>
                  <span className="mt-0.5 text-lg font-semibold">{d.toLocaleDateString("de-DE", { day: "numeric", timeZone: "Europe/Berlin" })}</span>
                </span>
                <span>
                  <p className="text-sm font-medium leading-snug">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatTime(e.startsAt)} Uhr · {e.location}</p>
                </span>
              </div>
            );
          })}
        </ListCard>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <SectionHeading
            action={<Link className="text-sm" href="/aemter">Alle Ämter<Link.Icon><ArrowRight /></Link.Icon></Link>}
            title="Ämter & Behörden"
          />
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Ämter und heutige Öffnungszeiten" className="min-w-[560px]">
                <Table.Header>
                  <Table.Column isRowHeader>Amt</Table.Column>
                  <Table.Column>Heute</Table.Column>
                  <Table.Column>Anschrift</Table.Column>
                  <Table.Column>Telefon</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.departments.map((d) => (
                    <Table.Row key={d.slug} href={`/aemter/${d.slug}`} id={d.slug}>
                      <Table.Cell><span className="font-medium">{d.name}</span></Table.Cell>
                      <Table.Cell>
                        <Chip color={d.status.tone} size="sm" variant="soft">
                          <Clock width={10} />
                          <Chip.Label>{d.status.label}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell><span className="text-muted">{d.address}</span></Table.Cell>
                      <Table.Cell><span className="whitespace-nowrap tabular-nums text-muted">{d.phone}</span></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        <aside className="flex flex-col gap-4 lg:pt-12">
          <Card>
            <Card.Header>
              <Card.Title>Bürgerkonto</Card.Title>
              <Card.Description>
                {data.account
                  ? `Angemeldet als ${data.account.name}.`
                  : "Anträge, Bescheide und Dokumente an einem Ort."}
              </Card.Description>
            </Card.Header>
            {data.account ? (
              <Card.Content className="text-sm">
                <span className="flex items-center gap-2.5">
                  <Receipt className="text-accent" width={16} />
                  {data.account.openApplications === 1
                    ? "1 offener Antrag"
                    : `${data.account.openApplications} offene Anträge`}
                </span>
              </Card.Content>
            ) : (
              <Card.Content className="gap-2.5 text-sm">
                <span className="flex items-center gap-2.5"><Receipt className="text-accent" width={16} />Anträge stellen und verfolgen</span>
                <span className="flex items-center gap-2.5"><ShieldCheck className="text-accent" width={16} />Ausweis, Führerschein, Urkunden</span>
                <span className="flex items-center gap-2.5"><Calendar className="text-accent" width={16} />Termine im Rathaus</span>
              </Card.Content>
            )}
            <Card.Footer className="flex-col items-stretch gap-2">
              {data.account ? (
                <ButtonLink fullWidth href="/konto">Zum Bürgerkonto<ArrowRight /></ButtonLink>
              ) : (
                <>
                  <ButtonLink fullWidth href="/anmelden"><ArrowRightToSquare />Mit Discord anmelden</ButtonLink>
                  <span className="text-center text-xs text-muted">Für Bürgerinnen und Bürger mit Whitelist</span>
                </>
              )}
            </Card.Footer>
          </Card>

          <Card>
            <Card.Header><Card.Title>Notrufe</Card.Title></Card.Header>
            <Card.Content className="grid grid-cols-3 gap-2">
              {[
                { n: "110", l: "Polizei", I: Megaphone },
                { n: "112", l: "Feuerwehr", I: Flame },
                { n: "115", l: "Behörden", I: Handset },
              ].map(({ n, l, I }) => (
                <div key={n} className="flex flex-col items-center gap-0.5 rounded-xl bg-default py-3">
                  <I className="text-accent" width={16} />
                  <span className="text-xl font-semibold tabular-nums">{n}</span>
                  <span className="text-xs text-muted">{l}</span>
                </div>
              ))}
            </Card.Content>
          </Card>

          {data.jobs.length > 0 ? (
            <Card>
              <Card.Header className="flex-row items-center justify-between">
                <Card.Title>Stellenangebote</Card.Title>
                <Chip size="sm" variant="soft">{data.jobCount} offen</Chip>
              </Card.Header>
              <Card.Content className="gap-0">
                {data.jobs.map((j, i) => (
                  <div key={j.slug}>
                    {i > 0 ? <Separator /> : null}
                    <NextLink className="flex items-center gap-3 py-2.5" href={`/karriere/${j.slug}`}>
                      <Avatar color="accent" size="sm" variant="soft">
                        <Avatar.Fallback>{j.organization.slice(0, 1)}</Avatar.Fallback>
                      </Avatar>
                      <span className="flex-1">
                        <p className="text-sm font-medium">{j.title}</p>
                        <p className="text-xs text-muted">
                          {j.organization} · {j.deadline ? `bis ${formatLongDate(j.deadline)}` : "laufend"}
                        </p>
                      </span>
                      <ChevronRight className="text-muted" width={14} />
                    </NextLink>
                  </div>
                ))}
              </Card.Content>
            </Card>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function ListCard({
  title,
  icon,
  footer,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  footer?: { href: string; label: string };
  children: React.ReactNode[];
}) {
  return (
    <Card>
      <Card.Header className="flex-row items-center gap-2">
        <span className="text-accent">{icon}</span>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-0">
        {children.length === 0 ? <p className="py-3 text-sm text-muted">Derzeit keine Einträge.</p> : null}
        {children.map((child, i) => (
          <div key={i}>
            {i > 0 ? <Separator /> : null}
            {child}
          </div>
        ))}
      </Card.Content>
      {footer ? (
        <Card.Footer>
          <Link className="text-sm" href={footer.href}>{footer.label}<Link.Icon><ArrowRight /></Link.Icon></Link>
        </Card.Footer>
      ) : null}
    </Card>
  );
}

function Stage({ posts }: { posts: PostItem[] }) {
  const [index, setIndex] = useState(0);
  const post = posts[index];
  const go = (d: number) => setIndex((i) => (i + d + posts.length) % posts.length);

  return (
    <section aria-label="Top-Thema" className="relative overflow-hidden rounded-3xl bg-[#1d2633]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-[300px] w-full object-cover md:h-[440px]" src={asset(post.imageUrl ?? "/images/hafen-abend.svg")} />
      <div className="p-3 md:absolute md:bottom-6 md:left-6 md:max-w-[540px] md:p-0">
        <Card>
          <Card.Header>
            <Chip color="accent" size="sm" variant="soft">{post.gazetteNumber ?? POST_KINDS[post.kind].label}</Chip>
            <Card.Title className="mt-2 text-xl font-semibold leading-snug md:text-2xl">{post.title}</Card.Title>
            <Card.Description>{post.teaser}</Card.Description>
          </Card.Header>
          <Card.Footer className="flex items-center justify-between gap-3">
            <Link href={`/aktuelles/${post.slug}`}>Weiterlesen<Link.Icon><ArrowRight /></Link.Icon></Link>
            {posts.length > 1 ? (
              <div className="flex items-center gap-1">
                <Button aria-label="Vorheriges Thema" isIconOnly size="sm" variant="tertiary" onPress={() => go(-1)}><ChevronLeft /></Button>
                <span aria-live="polite" className="w-12 text-center text-sm tabular-nums text-muted">{index + 1} / {posts.length}</span>
                <Button aria-label="Nächstes Thema" isIconOnly size="sm" variant="tertiary" onPress={() => go(1)}><ChevronRight /></Button>
              </div>
            ) : null}
          </Card.Footer>
        </Card>
      </div>
    </section>
  );
}

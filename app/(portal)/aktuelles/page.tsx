import type { Metadata } from "next";
import NextLink from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, Chip, Tabs } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { posts, postKind, type PostKind } from "@/db/schema";
import { asset } from "@/lib/asset";
import { formatLongDate } from "@/lib/format";
import { POST_KINDS } from "@/lib/status";

export const metadata: Metadata = { title: "Aktuelles & Amtsblatt" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ art?: string }> }) {
  const { art } = await searchParams;
  const kind = postKind.enumValues.includes(art as PostKind) ? (art as PostKind) : null;
  const list = await db
    .select()
    .from(posts)
    .where(kind ? eq(posts.kind, kind) : undefined)
    .orderBy(desc(posts.publishedAt))
    .limit(60);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Aktuelles & Amtsblatt" }]}
        description="Pressemitteilungen, amtliche Bekanntmachungen und Verkehrsmeldungen der Stadt."
        title="Aktuelles & Amtsblatt"
      />
      <Tabs className="mb-6" selectedKey={kind ?? "alle"}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Art der Meldung" className="w-fit">
            <Tabs.Tab className="whitespace-nowrap" href="/aktuelles" id="alle">Alle<Tabs.Indicator /></Tabs.Tab>
            {postKind.enumValues.map((k) => (
              <Tabs.Tab key={k} className="whitespace-nowrap" href={`/aktuelles?art=${k}`} id={k}>
                {POST_KINDS[k].plural}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {list.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <Card.Title>Noch keine Meldungen</Card.Title>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {list.map((p) => (
          <NextLink key={p.id} className="group rounded-3xl" href={`/aktuelles/${p.slug}`}>
            <Card className="flex-col gap-4 overflow-hidden transition-shadow group-hover:shadow-overlay sm:flex-row sm:items-center">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-[16/9] w-full shrink-0 rounded-2xl object-cover sm:w-56" src={asset(p.imageUrl)} />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Chip color={p.kind === "bekanntmachung" ? "accent" : "default"} size="sm" variant="soft">
                    {p.gazetteNumber ?? POST_KINDS[p.kind].label}
                  </Chip>
                  <time>{formatLongDate(p.publishedAt)}</time>
                </div>
                <Card.Title className="text-base leading-snug">{p.title}</Card.Title>
                <Card.Description className="line-clamp-2">{p.teaser}</Card.Description>
              </div>
            </Card>
          </NextLink>
        ))}
      </div>
    </>
  );
}

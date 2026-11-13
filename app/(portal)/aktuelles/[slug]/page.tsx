import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, posts } from "@/db/schema";
import { asset } from "@/lib/asset";
import { formatLongDate } from "@/lib/format";
import { POST_KINDS } from "@/lib/status";

async function load(slug: string) {
  const [row] = await db
    .select({ post: posts, department: departments.name })
    .from(posts)
    .leftJoin(departments, eq(posts.departmentId, departments.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const row = await load((await params).slug);

  return row ? { title: row.post.title, description: row.post.teaser } : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const row = await load((await params).slug);

  if (!row) notFound();
  const { post: p, department } = row;

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        crumbs={[{ label: "Aktuelles", href: "/aktuelles" }, { label: POST_KINDS[p.kind].label }]}
        description={p.teaser}
        title={p.title}
      />
      <div className="-mt-4 mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Chip color={p.kind === "bekanntmachung" ? "accent" : "default"} size="sm" variant="soft">
          {p.gazetteNumber ?? POST_KINDS[p.kind].label}
        </Chip>
        <time>{formatLongDate(p.publishedAt)}</time>
        {department ? <span>· {department}</span> : null}
      </div>
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="mb-6 aspect-[16/8] w-full rounded-3xl object-cover" src={asset(p.imageUrl)} />
      ) : null}
      <Card>
        <Card.Content className="gap-4 text-[15px] leading-relaxed">
          {p.body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </Card.Content>
      </Card>
      <ButtonLink className="mt-6" href="/aktuelles" variant="tertiary">
        <ArrowLeft />
        Alle Meldungen
      </ButtonLink>
    </article>
  );
}

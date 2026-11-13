import { desc, eq } from "drizzle-orm";
import { Plus } from "@gravity-ui/icons";
import { Chip, Table } from "@heroui/react";

import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { TrafficManager } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { departments, posts, trafficNotices } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { POST_KINDS } from "@/lib/status";
import { requireStaff } from "@/lib/viewer";

export default async function AdminPostsPage() {
  await requireStaff("/verwaltung/amtsblatt");
  const [list, traffic] = await Promise.all([
    db
      .select({ p: posts, department: departments.name })
      .from(posts)
      .leftJoin(departments, eq(posts.departmentId, departments.id))
      .orderBy(desc(posts.publishedAt))
      .limit(100),
    db.select().from(trafficNotices).where(eq(trafficNotices.isActive, true)),
  ]);

  return (
    <>
      <PageHeader
        actions={<ButtonLink href="/verwaltung/amtsblatt/neu"><Plus />Neue Meldung</ButtonLink>}
        description="Pressemitteilungen, amtliche Bekanntmachungen und Verkehrsmeldungen."
        title="Aktuelles & Amtsblatt"
      />
      <div className="flex flex-col gap-6">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Meldungen" className="min-w-[680px]">
              <Table.Header>
                <Table.Column isRowHeader>Überschrift</Table.Column>
                <Table.Column>Art</Table.Column>
                <Table.Column>Herausgeber</Table.Column>
                <Table.Column>Datum</Table.Column>
              </Table.Header>
              <Table.Body>
                {list.map(({ p, department }) => (
                  <Table.Row key={p.id} href={`/verwaltung/amtsblatt/${p.id}`} id={p.id}>
                    <Table.Cell>
                      <p className="font-medium">{p.title}</p>
                      {p.isFeatured ? <p className="text-xs text-accent">Top-Thema</p> : null}
                    </Table.Cell>
                    <Table.Cell><Chip size="sm" variant="soft">{p.gazetteNumber ?? POST_KINDS[p.kind].label}</Chip></Table.Cell>
                    <Table.Cell><span className="text-muted">{department ?? "–"}</span></Table.Cell>
                    <Table.Cell><span className="tabular-nums text-muted">{formatDate(p.publishedAt)}</span></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        <TrafficManager items={traffic} />
      </div>
    </>
  );
}

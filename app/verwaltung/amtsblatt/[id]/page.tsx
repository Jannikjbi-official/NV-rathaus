import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { PageHeader } from "@/components/ui/page-header";
import { PostEditor } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { requireStaff } from "@/lib/viewer";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireStaff("/verwaltung/amtsblatt");
  const departments = viewer.staffDepartments.map((d) => ({ id: d.id, name: d.name }));

  if (id === "neu") {
    return (
      <>
        <PageHeader root={{ label: "Verwaltung", href: "/verwaltung" }} crumbs={[{ label: "Amtsblatt", href: "/verwaltung/amtsblatt" }, { label: "Neu" }]} title="Neue Meldung" />
        <PostEditor
          departments={departments}
          initial={{ kind: "pressemitteilung", title: "", teaser: "", body: "", imageUrl: null, gazetteNumber: null, departmentId: departments[0]?.id ?? null, isFeatured: false }}
        />
      </>
    );
  }

  const [p] = /^[0-9a-f-]{36}$/.test(id) ? await db.select().from(posts).where(eq(posts.id, id)).limit(1) : [];

  if (!p) notFound();

  return (
    <>
      <PageHeader root={{ label: "Verwaltung", href: "/verwaltung" }} crumbs={[{ label: "Amtsblatt", href: "/verwaltung/amtsblatt" }, { label: "Bearbeiten" }]} title={p.title} />
      <PostEditor
        departments={departments}
        initial={{ id: p.id, kind: p.kind, title: p.title, teaser: p.teaser, body: p.body, imageUrl: p.imageUrl, gazetteNumber: p.gazetteNumber, departmentId: p.departmentId, isFeatured: p.isFeatured }}
      />
    </>
  );
}

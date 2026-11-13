import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { PageHeader } from "@/components/ui/page-header";
import { JobEditor } from "@/components/verwaltung/content-editors";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { requireStaff } from "@/lib/viewer";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireStaff("/verwaltung/stellen");
  const departments = viewer.staffDepartments.map((d) => ({ id: d.id, name: d.name }));

  if (id === "neu") {
    return (
      <>
        <PageHeader root={{ label: "Verwaltung", href: "/verwaltung" }} crumbs={[{ label: "Stellen", href: "/verwaltung/stellen" }, { label: "Neu" }]} title="Neue Stelle" />
        <JobEditor
          departments={departments}
          initial={{ title: "", organization: "Stadtverwaltung", departmentId: departments[0]?.id ?? null, employment: "Teilzeit", summary: "", description: "", tasks: [], requirements: [], deadline: null, isOpen: true }}
        />
      </>
    );
  }

  const [j] = /^[0-9a-f-]{36}$/.test(id) ? await db.select().from(jobs).where(eq(jobs.id, id)).limit(1) : [];

  if (!j) notFound();

  return (
    <>
      <PageHeader root={{ label: "Verwaltung", href: "/verwaltung" }} crumbs={[{ label: "Stellen", href: "/verwaltung/stellen" }, { label: j.title }]} title={j.title} />
      <JobEditor
        departments={departments}
        initial={{ id: j.id, title: j.title, organization: j.organization, departmentId: j.departmentId, employment: j.employment, summary: j.summary, description: j.description, tasks: j.tasks, requirements: j.requirements, deadline: j.deadline, isOpen: j.isOpen }}
      />
    </>
  );
}

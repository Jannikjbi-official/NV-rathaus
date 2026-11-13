import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { PageHeader } from "@/components/ui/page-header";
import { ServiceEditor } from "@/components/verwaltung/service-editor";
import { db } from "@/db";
import { services } from "@/db/schema";
import { canHandle, requireStaff } from "@/lib/viewer";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await requireStaff(`/verwaltung/leistungen/${slug}`);
  const departments = viewer.staffDepartments.map((d) => ({ id: d.id, name: d.name }));

  if (slug === "neu") {
    return (
      <>
        <PageHeader description="Legen Sie eine neue Leistung mit eigenem Antragsformular an." title="Neue Leistung" />
        <ServiceEditor
          departments={departments}
          initial={{
            departmentId: departments[0]?.id ?? "",
            title: "",
            summary: "",
            description: "",
            lifeEvent: "anliegen",
            requirements: [],
            documentsNeeded: [],
            keywords: [],
            feeCents: 0,
            feeNote: null,
            processingDays: 3,
            issuesDocument: null,
            documentValidityYears: null,
            needsAppointment: false,
            isActive: true,
            isFeatured: false,
            fields: [{ id: "wahrheit", type: "checkbox", label: "Ich versichere, dass alle Angaben wahrheitsgemäß und vollständig sind.", required: true }],
          }}
        />
      </>
    );
  }

  const [s] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);

  if (!s || !canHandle(viewer, s.departmentId)) notFound();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Leistungen", href: "/verwaltung/leistungen" }, { label: s.title }]}
        description={`Formular-Version ${s.version}. Öffentlich unter /leistungen/${s.slug}`}
        title={s.title}
      />
      <ServiceEditor
        departments={departments}
        initial={{
          id: s.id,
          slug: s.slug,
          departmentId: s.departmentId,
          title: s.title,
          summary: s.summary,
          description: s.description,
          lifeEvent: s.lifeEvent,
          requirements: s.requirements,
          documentsNeeded: s.documentsNeeded,
          keywords: s.keywords,
          feeCents: s.feeCents,
          feeNote: s.feeNote,
          processingDays: s.processingDays,
          issuesDocument: s.issuesDocument,
          documentValidityYears: s.documentValidityYears,
          needsAppointment: s.needsAppointment,
          isActive: s.isActive,
          isFeatured: s.isFeatured,
          fields: s.fields,
        }}
      />
    </>
  );
}

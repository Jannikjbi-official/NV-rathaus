import { PageHeader } from "@/components/ui/page-header";
import { ApplicationsInbox } from "@/components/verwaltung/applications-inbox";
import { requireStaff } from "@/lib/viewer";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string; amt?: string; q?: string }> }) {
  const [viewer, params] = await Promise.all([requireStaff("/verwaltung/posteingang"), searchParams]);

  return (
    <>
      <PageHeader
        description={`Anträge für ${viewer.isAdmin ? "alle Ämter" : viewer.staffDepartments.map((d) => d.name).join(", ")}.`}
        title="Posteingang"
      />
      <ApplicationsInbox basePath="/verwaltung/posteingang" defaultTab="neu" params={params} viewer={viewer} />
    </>
  );
}

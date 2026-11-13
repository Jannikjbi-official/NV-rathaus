import { PageHeader } from "@/components/ui/page-header";
import { ApplicationsInbox } from "@/components/verwaltung/applications-inbox";
import { requireStaff } from "@/lib/viewer";

export default async function AllApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string; amt?: string; q?: string }> }) {
  const [viewer, params] = await Promise.all([requireStaff("/verwaltung/antraege"), searchParams]);

  return (
    <>
      <PageHeader description="Alle Anträge Ihrer Ämter, auch abgeschlossene." title="Alle Anträge" />
      <ApplicationsInbox basePath="/verwaltung/antraege" defaultTab="alle" params={params} viewer={viewer} />
    </>
  );
}

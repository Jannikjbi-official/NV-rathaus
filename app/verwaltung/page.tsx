import { Alert } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { ApplicationsInbox } from "@/components/verwaltung/applications-inbox";
import { requireStaff } from "@/lib/viewer";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string; amt?: string; q?: string; hinweis?: string }> }) {
  const [viewer, params] = await Promise.all([requireStaff(), searchParams]);

  return (
    <>
      <PageHeader
        description={`Anträge für ${viewer.isAdmin ? "alle Ämter" : viewer.staffDepartments.map((d) => d.name).join(", ")}.`}
        title="Posteingang"
      />
      {params.hinweis === "nur-admin" ? (
        <Alert className="mb-5" status="warning">
          <Alert.Indicator />
          <Alert.Content><Alert.Title>Dieser Bereich ist nur für Admins.</Alert.Title></Alert.Content>
        </Alert>
      ) : null}
      <ApplicationsInbox basePath="/verwaltung" defaultTab="neu" params={params} viewer={viewer} />
    </>
  );
}

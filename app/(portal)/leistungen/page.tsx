import type { Metadata } from "next";

import { ServicesBrowser } from "@/components/portal/services-browser";
import { PageHeader } from "@/components/ui/page-header";
import { getDepartments, getServiceIndex } from "@/lib/queries";

export const metadata: Metadata = { title: "Leistungen A–Z" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string; amt?: string }> }) {
  const [{ q = "", amt = "" }, services, departments] = await Promise.all([searchParams, getServiceIndex(), getDepartments()]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Leistungen A–Z" }]}
        description="Alle Dienstleistungen der Stadtverwaltung. Jede Leistung können Sie online im Bürgerkonto beantragen."
        title="Leistungen A–Z"
      />
      <ServicesBrowser
        departments={departments.map((d) => ({ slug: d.slug, name: d.name }))}
        initialDepartment={amt}
        initialQuery={q}
        items={services}
      />
    </>
  );
}

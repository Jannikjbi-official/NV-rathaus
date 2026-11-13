import { SiteFooter } from "@/components/portal/site-footer";
import { SiteHeader } from "@/components/portal/site-header";
import { getServiceIndex } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [viewer, services] = await Promise.all([getViewer(), getServiceIndex()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        account={viewer ? { name: viewer.name, avatarUrl: viewer.user.avatarUrl, isStaff: viewer.isStaff } : null}
        services={services.map((s) => ({ slug: s.slug, title: s.title, department: s.department, keywords: s.keywords }))}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6">{children}</main>
      <SiteFooter />
    </div>
  );
}

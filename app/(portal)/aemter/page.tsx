import type { Metadata } from "next";
import NextLink from "next/link";
import { count, eq } from "drizzle-orm";
import { ChevronRight, Clock, Handset, MapPin } from "@gravity-ui/icons";
import { Card, Chip } from "@heroui/react";

import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { departments, services } from "@/db/schema";
import { openingStatus } from "@/lib/format";

export const metadata: Metadata = { title: "Ämter & Kontakt" };

export default async function DepartmentsPage() {
  const rows = await db
    .select({ d: departments, n: count(services.id) })
    .from(departments)
    .leftJoin(services, eq(services.departmentId, departments.id))
    .groupBy(departments.id)
    .orderBy(departments.sortOrder);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Ämter & Kontakt" }]}
        description="Alle Ämter der Stadtverwaltung mit Anschrift, Telefon und Öffnungszeiten."
        title="Ämter & Kontakt"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ d, n }) => {
          const status = openingStatus(d.openingHours);

          return (
            <NextLink key={d.id} className="group rounded-3xl" href={`/aemter/${d.slug}`}>
              <Card className="h-full transition-shadow group-hover:shadow-overlay">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon name={d.icon} size={20} />
                  </span>
                  <Chip color={status.tone} size="sm" variant="soft">
                    <Clock width={10} />
                    <Chip.Label>{status.label}</Chip.Label>
                  </Chip>
                </div>
                <Card.Header className="gap-1">
                  <Card.Title className="text-base">{d.name}</Card.Title>
                  <Card.Description>{d.summary}</Card.Description>
                </Card.Header>
                <Card.Content className="gap-1.5 text-sm text-muted">
                  <span className="flex items-center gap-2"><MapPin className="size-3.5" />{d.address}</span>
                  <span className="flex items-center gap-2"><Handset className="size-3.5" />{d.phone}</span>
                </Card.Content>
                <Card.Footer className="justify-between text-sm">
                  <span className="text-muted">{n} Leistungen</span>
                  <ChevronRight className="size-4 text-muted" />
                </Card.Footer>
              </Card>
            </NextLink>
          );
        })}
      </div>
    </>
  );
}

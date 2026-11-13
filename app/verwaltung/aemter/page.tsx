import { Alert } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { DepartmentEditor } from "@/components/verwaltung/content-editors";
import { discordConfig } from "@/lib/discord";
import { getDepartments } from "@/lib/queries";
import { requireAdmin } from "@/lib/viewer";

export default async function DepartmentsAdminPage() {
  await requireAdmin("/verwaltung/aemter");
  const list = await getDepartments();
  const missing = [
    !discordConfig.guildId && "DISCORD_GUILD_ID",
    !discordConfig.citizenRoleId && "DISCORD_CITIZEN_ROLE_ID",
    !discordConfig.adminRoleIds.length && "DISCORD_ADMIN_ROLE_ID",
    !discordConfig.botToken && "DISCORD_BOT_TOKEN",
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        description="Ordnen Sie jedem Amt eine Discord-Rolle zu. Wer die Rolle hat, sieht und bearbeitet die Anträge dieses Amts. Die Rollen-ID kopieren Sie im Discord per Rechtsklick auf die Rolle (Entwicklermodus)."
        title="Ämter & Rollen"
      />
      {missing.length ? (
        <Alert className="mb-6" status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Discord ist noch nicht vollständig eingerichtet</Alert.Title>
            <Alert.Description>Fehlende Umgebungsvariablen: {missing.join(", ")}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="grid gap-6 2xl:grid-cols-2">
        {list.map((d) => (
          <DepartmentEditor
            key={d.id}
            initial={{
              id: d.id,
              discordRoleId: d.discordRoleId ?? "",
              address: d.address,
              phone: d.phone,
              email: d.email ?? "",
              summary: d.summary,
              openingHours: d.openingHours,
            }}
            name={d.name}
          />
        ))}
      </div>
    </>
  );
}

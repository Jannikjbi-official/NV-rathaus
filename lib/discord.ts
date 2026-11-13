import "server-only";

const API = "https://discord.com/api/v10";

export type GuildMember = {
  roles: string[];
  nick: string | null;
  avatar: string | null;
  user?: { id: string; username: string; global_name: string | null; avatar: string | null };
};

export const discordConfig = {
  guildId: process.env.DISCORD_GUILD_ID ?? "",
  citizenRoleId: process.env.DISCORD_CITIZEN_ROLE_ID ?? "",
  /** Eine oder mehrere Rollen mit Vollzugriff, kommagetrennt (z. B. Owner, Admin). */
  adminRoleIds: (process.env.DISCORD_ADMIN_ROLE_ID ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean),
  botToken: process.env.DISCORD_BOT_TOKEN ?? "",
  inviteUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/KrfKASTHDp",
};

/** Mitgliedschaft des angemeldeten Nutzers (OAuth-Scope guilds.members.read). */
export async function fetchOwnMember(accessToken: string): Promise<GuildMember | null> {
  const res = await fetch(`${API}/users/@me/guilds/${discordConfig.guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord member lookup failed: ${res.status}`);

  return res.json();
}

/** Mitgliedschaft per Bot-Token, für den regelmäßigen Rollenabgleich. */
export async function fetchMember(userId: string): Promise<GuildMember | null | undefined> {
  if (!discordConfig.botToken) return undefined;
  const res = await fetch(`${API}/guilds/${discordConfig.guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${discordConfig.botToken}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) return undefined;

  return res.json();
}

export function avatarUrl(userId: string, avatar: string | null | undefined) {
  if (!avatar) return null;

  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
}

export type DirectMessage = {
  title: string;
  description: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
};

/**
 * Schickt eine Direktnachricht über den Bot. Fehler werden geschluckt:
 * Eine fehlende DM darf nie eine Antragsbearbeitung scheitern lassen.
 */
export async function sendDirectMessage(userId: string, message: DirectMessage) {
  if (!discordConfig.botToken || userId.startsWith("dev-")) return false;
  const headers = { Authorization: `Bot ${discordConfig.botToken}`, "Content-Type": "application/json" };

  try {
    const channel = await fetch(`${API}/users/@me/channels`, {
      method: "POST",
      headers,
      body: JSON.stringify({ recipient_id: userId }),
    }).then((r) => (r.ok ? r.json() : null));

    if (!channel?.id) return false;

    const res = await fetch(`${API}/channels/${channel.id}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        embeds: [
          {
            title: message.title,
            description: message.description,
            url: message.url,
            color: message.color ?? 0xc41e1e,
            fields: message.fields,
            footer: { text: "Rathaus Nordverkehr · Bürgerportal" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

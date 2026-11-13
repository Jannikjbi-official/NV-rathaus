import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { departments, users } from "@/db/schema";
import { avatarUrl, discordConfig, fetchMember, fetchOwnMember } from "@/lib/discord";

/** Rollen werden höchstens alle 10 Minuten per Bot neu abgeglichen. */
const ROLE_SYNC_MS = 10 * 60 * 1000;

/** Lokaler Testzugang ohne Discord. In Produktion immer aus. */
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "true";

async function staffRoleIds() {
  const rows = await db
    .select({ roleId: departments.discordRoleId })
    .from(departments)
    .where(isNotNull(departments.discordRoleId));

  return rows.map((r) => r.roleId!).filter(Boolean);
}

function accessFromRoles(roles: string[], staffRoles: string[]) {
  const isAdmin = !!discordConfig.adminRoleId && roles.includes(discordConfig.adminRoleId);
  const isCitizen = !!discordConfig.citizenRoleId && roles.includes(discordConfig.citizenRoleId);
  const isStaff = roles.some((r) => staffRoles.includes(r));

  return { isAdmin, isCitizen, hasAccess: isAdmin || isCitizen || isStaff };
}

async function upsertUser(values: typeof users.$inferInsert) {
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: values.username,
        displayName: values.displayName,
        avatarUrl: values.avatarUrl,
        discordRoles: values.discordRoles,
        isCitizen: values.isCitizen,
        isAdmin: values.isAdmin,
        rolesSyncedAt: values.rolesSyncedAt,
        lastLoginAt: values.lastLoginAt,
      },
    });
}

const DEV_PERSONAS = {
  buerger: { username: "test.buerger", displayName: "Test-Bürger", isCitizen: true, isAdmin: false },
  admin: { username: "test.admin", displayName: "Test-Verwaltung", isCitizen: true, isAdmin: true },
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/anmelden", error: "/anmelden" },
  providers: [
    Discord({ authorization: { params: { scope: "identify guilds.members.read" } } }),
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev",
            name: "Testzugang",
            credentials: { persona: {} },
            async authorize(credentials) {
              const key = String(credentials?.persona ?? "") as keyof typeof DEV_PERSONAS;
              const persona = DEV_PERSONAS[key];

              if (!persona) throw new CredentialsSignin();
              const id = `dev-${key}`;

              await upsertUser({
                id,
                ...persona,
                avatarUrl: null,
                discordRoles: [],
                rolesSyncedAt: new Date(),
                lastLoginAt: new Date(),
              });

              return { id, name: persona.displayName };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "dev") return true;
      if (account?.provider !== "discord" || !account.access_token || !profile?.id) return false;

      const member = await fetchOwnMember(account.access_token).catch(() => undefined);

      if (member === undefined) return "/kein-zugang?grund=fehler";
      if (member === null) return "/kein-zugang?grund=server";

      const access = accessFromRoles(member.roles, await staffRoleIds());

      if (!access.hasAccess) return "/kein-zugang?grund=rolle";

      const id = String(profile.id);

      await upsertUser({
        id,
        username: String(profile.username ?? ""),
        displayName: member.nick ?? (profile.global_name as string | null) ?? null,
        avatarUrl: avatarUrl(id, profile.avatar as string | null),
        discordRoles: member.roles,
        isCitizen: access.isCitizen,
        isAdmin: access.isAdmin,
        rolesSyncedAt: new Date(),
        lastLoginAt: new Date(),
      });

      return true;
    },

    async jwt({ token, account, profile, user }) {
      if (account) {
        token.sub = account.provider === "discord" ? String(profile?.id) : user?.id;
        token.syncedAt = Date.now();

        return token;
      }

      const uid = token.sub;
      const syncedAt = (token.syncedAt as number | undefined) ?? 0;

      if (uid && !uid.startsWith("dev-") && Date.now() - syncedAt > ROLE_SYNC_MS) {
        const member = await fetchMember(uid);

        // undefined = kein Bot-Token oder Discord nicht erreichbar → nichts ändern
        if (member === null) return null;
        if (member) {
          const access = accessFromRoles(member.roles, await staffRoleIds());

          if (!access.hasAccess) return null;
          await db
            .update(users)
            .set({
              discordRoles: member.roles,
              isCitizen: access.isCitizen,
              isAdmin: access.isAdmin,
              displayName: member.nick ?? member.user?.global_name ?? undefined,
              rolesSyncedAt: new Date(),
            })
            .where(eq(users.id, uid));
        }
        token.syncedAt = Date.now();
      }

      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;

      return session;
    },

    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/konto") || pathname.startsWith("/verwaltung")) return !!auth?.user;

      return true;
    },
  },
});

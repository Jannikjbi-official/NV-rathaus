"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  appointments,
  appointmentSlots,
  auditLog,
  departments,
  documentType,
  jobs,
  postKind,
  posts,
  services,
  trafficNotices,
} from "@/db/schema";
import { FIELD_TYPES } from "@/lib/forms/types";
import { canHandle, requireAdmin, requireStaff } from "@/lib/viewer";

export type SaveResult = { ok: boolean; message: string; slug?: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function firstIssue(e: z.ZodError) {
  const i = e.issues[0];

  return `${i.path.join(".") || "Eingabe"}: ${i.message}`;
}

/* ------------------------------- Leistungen ------------------------------- */

const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{1,40}$/, "nur a–z, 0–9 und _"),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1, "Beschriftung fehlt").max(160),
  description: z.string().trim().max(400).optional(),
  placeholder: z.string().trim().max(80).optional(),
  required: z.boolean().optional(),
  half: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  departmentId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(3).max(240),
  description: z.string().trim().max(4000),
  lifeEvent: z.string().min(1),
  requirements: z.array(z.string().trim().min(1)).max(20),
  documentsNeeded: z.array(z.string().trim().min(1)).max(20),
  keywords: z.array(z.string().trim().min(1)).max(30),
  feeCents: z.number().int().min(0).max(10_000_000),
  feeNote: z.string().trim().max(200).nullable(),
  processingDays: z.number().int().min(0).max(90),
  issuesDocument: z.enum(documentType.enumValues).nullable(),
  documentValidityYears: z.number().int().min(1).max(30).nullable(),
  needsAppointment: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  fields: z.array(fieldSchema).max(60),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export async function saveService(input: ServiceInput): Promise<SaveResult> {
  const viewer = await requireStaff("/verwaltung/leistungen");
  const parsed = serviceSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  if (!canHandle(viewer, data.departmentId)) return { ok: false, message: "Keine Berechtigung für dieses Amt." };

  const ids = data.fields.map((f) => f.id);

  if (new Set(ids).size !== ids.length) return { ok: false, message: "Feld-Schlüssel müssen eindeutig sein." };
  for (const f of data.fields) {
    if (["select", "radio", "checkboxes"].includes(f.type) && !f.options?.length)
      return { ok: false, message: `„${f.label}“ braucht mindestens eine Option.` };
  }

  const values = { ...data, id: undefined, slug: undefined, updatedAt: new Date() };

  if (data.id) {
    const [current] = await db.select().from(services).where(eq(services.id, data.id)).limit(1);

    if (!current || !canHandle(viewer, current.departmentId)) return { ok: false, message: "Keine Berechtigung." };
    const fieldsChanged = JSON.stringify(current.fields) !== JSON.stringify(data.fields);

    await db
      .update(services)
      .set({ ...values, version: fieldsChanged ? current.version + 1 : current.version })
      .where(eq(services.id, data.id));
    await db.insert(auditLog).values({ actorId: viewer.user.id, action: "service:update", entity: "service", entityId: current.slug });
    revalidatePath("/", "layout");

    return { ok: true, message: fieldsChanged ? `Gespeichert (Formular Version ${current.version + 1}).` : "Gespeichert.", slug: current.slug };
  }

  const slug = slugify(data.slug || data.title);
  const [taken] = await db.select({ id: services.id }).from(services).where(eq(services.slug, slug)).limit(1);

  if (!slug || taken) return { ok: false, message: "Dieser Kurzname ist bereits vergeben." };
  await db.insert(services).values({ ...values, slug });
  await db.insert(auditLog).values({ actorId: viewer.user.id, action: "service:create", entity: "service", entityId: slug });
  revalidatePath("/", "layout");

  return { ok: true, message: "Leistung angelegt.", slug };
}

/* ------------------------------- Amtsblatt ------------------------------- */

const postSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(postKind.enumValues),
  title: z.string().trim().min(5).max(160),
  teaser: z.string().trim().min(10).max(320),
  body: z.string().trim().min(10).max(20000),
  imageUrl: z.string().trim().max(500).nullable(),
  gazetteNumber: z.string().trim().max(40).nullable(),
  departmentId: z.string().uuid().nullable(),
  isFeatured: z.boolean(),
});

export type PostInput = z.infer<typeof postSchema>;

export async function savePost(input: PostInput): Promise<SaveResult> {
  const viewer = await requireStaff("/verwaltung/amtsblatt");
  const parsed = postSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  if (data.departmentId && !canHandle(viewer, data.departmentId)) return { ok: false, message: "Keine Berechtigung für dieses Amt." };
  if (data.imageUrl && !/^(https:\/\/|\/images\/)/.test(data.imageUrl)) return { ok: false, message: "Bild-Adresse muss mit https:// oder /images/ beginnen." };

  if (data.id) {
    await db.update(posts).set({ ...data, id: undefined }).where(eq(posts.id, data.id));
  } else {
    let slug = slugify(data.title);
    const [taken] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);

    if (taken) slug = `${slug}-${Date.now().toString(36)}`;
    await db.insert(posts).values({ ...data, id: undefined, slug, authorId: viewer.user.id });
  }
  revalidatePath("/", "layout");

  return { ok: true, message: "Meldung gespeichert." };
}

export async function deletePost(id: string): Promise<SaveResult> {
  const viewer = await requireStaff();
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!post) return { ok: false, message: "Nicht gefunden." };
  if (!viewer.isAdmin && post.departmentId && !canHandle(viewer, post.departmentId)) return { ok: false, message: "Keine Berechtigung." };
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/", "layout");

  return { ok: true, message: "Meldung gelöscht." };
}

const trafficSchema = z.object({
  location: z.string().trim().min(3).max(120),
  category: z.string().trim().min(3).max(60),
  severity: z.enum(["hoch", "mittel", "info"]),
  detail: z.string().trim().min(2).max(200),
});

export async function addTrafficNotice(input: z.infer<typeof trafficSchema>): Promise<SaveResult> {
  await requireStaff();
  const parsed = trafficSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  await db.insert(trafficNotices).values(parsed.data);
  revalidatePath("/", "layout");

  return { ok: true, message: "Verkehrsmeldung veröffentlicht." };
}

export async function endTrafficNotice(id: string): Promise<SaveResult> {
  await requireStaff();
  await db.update(trafficNotices).set({ isActive: false }).where(eq(trafficNotices.id, id));
  revalidatePath("/", "layout");

  return { ok: true, message: "Verkehrsmeldung beendet." };
}

/* -------------------------------- Stellen -------------------------------- */

const jobSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(120),
  organization: z.string().trim().min(2).max(80),
  departmentId: z.string().uuid().nullable(),
  employment: z.string().trim().min(2).max(40),
  summary: z.string().trim().min(5).max(240),
  description: z.string().trim().min(5).max(4000),
  tasks: z.array(z.string().trim().min(1)).max(20),
  requirements: z.array(z.string().trim().min(1)).max(20),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  isOpen: z.boolean(),
});

export type JobInput = z.infer<typeof jobSchema>;

export async function saveJob(input: JobInput): Promise<SaveResult> {
  const viewer = await requireStaff("/verwaltung/stellen");
  const parsed = jobSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  if (data.departmentId && !canHandle(viewer, data.departmentId)) return { ok: false, message: "Keine Berechtigung für dieses Amt." };
  if (!data.departmentId && !viewer.isAdmin) return { ok: false, message: "Stellen ohne Amt (Polizei, Feuerwehr) legen Admins an." };

  if (data.id) {
    await db.update(jobs).set({ ...data, id: undefined }).where(eq(jobs.id, data.id));
  } else {
    const slug = slugify(data.title);
    const [taken] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.slug, slug)).limit(1);

    await db.insert(jobs).values({ ...data, id: undefined, slug: taken ? `${slug}-${Date.now().toString(36)}` : slug });
  }
  revalidatePath("/", "layout");

  return { ok: true, message: "Stelle gespeichert." };
}

/* -------------------------------- Termine -------------------------------- */

const slotsSchema = z.object({
  departmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  from: z.string().regex(/^\d{2}:\d{2}$/),
  to: z.string().regex(/^\d{2}:\d{2}$/),
  interval: z.number().int().min(10).max(120),
  capacity: z.number().int().min(1).max(20),
});

/** Ortszeit Europe/Berlin (Sommer-/Winterzeit korrekt) als UTC-Zeitpunkt. */
function berlinTime(date: string, hh: string, mm: string) {
  const guess = new Date(`${date}T${hh}:${mm}:00Z`);
  const asBerlin = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));

  return new Date(guess.getTime() - (asBerlin.getTime() - asUtc.getTime()));
}

export async function createSlots(input: z.infer<typeof slotsSchema>): Promise<SaveResult> {
  const viewer = await requireStaff("/verwaltung/termine");
  const parsed = slotsSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { departmentId, date, from, to, interval, capacity } = parsed.data;

  if (!canHandle(viewer, departmentId)) return { ok: false, message: "Keine Berechtigung für dieses Amt." };

  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const rows: (typeof appointmentSlots.$inferInsert)[] = [];

  for (let m = toMin(from); m + interval <= toMin(to); m += interval) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    rows.push({ departmentId, startsAt: berlinTime(date, hh, mm), durationMinutes: interval, capacity });
  }
  if (rows.length === 0) return { ok: false, message: "Im gewählten Zeitraum passt kein Termin." };
  await db.insert(appointmentSlots).values(rows);
  revalidatePath("/verwaltung/termine");
  revalidatePath("/konto/termine");

  return { ok: true, message: `${rows.length} Termine angelegt.` };
}

export async function setAppointmentStatus(id: string, status: "erschienen" | "storniert"): Promise<SaveResult> {
  const viewer = await requireStaff("/verwaltung/termine");
  const [row] = await db
    .select({ departmentId: appointmentSlots.departmentId })
    .from(appointments)
    .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
    .where(eq(appointments.id, id))
    .limit(1);

  if (!row || !canHandle(viewer, row.departmentId)) return { ok: false, message: "Keine Berechtigung." };
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  revalidatePath("/verwaltung/termine");

  return { ok: true, message: status === "erschienen" ? "Als erschienen markiert." : "Termin storniert." };
}

/* --------------------------------- Ämter --------------------------------- */

const departmentSchema = z.object({
  id: z.string().uuid(),
  discordRoleId: z.string().trim().regex(/^\d{17,20}$/, "Discord-Rollen-ID: 17–20 Ziffern").or(z.literal("")),
  address: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(3).max(30),
  email: z.string().trim().max(120),
  summary: z.string().trim().min(3).max(240),
  openingHours: z.object({
    days: z.array(z.object({ day: z.number().int().min(0).max(6), open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) })),
    note: z.string().trim().max(120).optional(),
  }),
});

export async function saveDepartment(input: z.infer<typeof departmentSchema>): Promise<SaveResult> {
  const viewer = await requireAdmin("/verwaltung/aemter");
  const parsed = departmentSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, discordRoleId, ...rest } = parsed.data;

  if (discordRoleId) {
    const [dup] = await db
      .select({ name: departments.name })
      .from(departments)
      .where(and(eq(departments.discordRoleId, discordRoleId), ne(departments.id, id)))
      .limit(1);

    if (dup) return { ok: false, message: `Diese Rolle ist schon dem ${dup.name} zugeordnet.` };
  }
  await db
    .update(departments)
    .set({ ...rest, email: rest.email || null, discordRoleId: discordRoleId || null })
    .where(eq(departments.id, id));
  await db.insert(auditLog).values({ actorId: viewer.user.id, action: "department:update", entity: "department", entityId: id });
  revalidatePath("/", "layout");

  return { ok: true, message: "Amt gespeichert." };
}

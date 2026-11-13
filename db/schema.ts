import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { FormField } from "@/lib/forms/types";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const applicationStatus = pgEnum("application_status", [
  "eingereicht",
  "in_bearbeitung",
  "rueckfrage",
  "genehmigt",
  "abgelehnt",
  "zurueckgezogen",
]);

export const eventType = pgEnum("application_event_type", [
  "eingereicht",
  "status",
  "nachricht",
  "antwort",
  "gebuehr",
  "dokument",
  "zuweisung",
]);

export const documentType = pgEnum("document_type", [
  "personalausweis",
  "reisepass",
  "fuehrerschein",
  "fahrzeugschein",
  "gewerbeschein",
  "waffenschein",
  "waffenbesitzkarte",
  "jagdschein",
  "fischereischein",
  "urkunde",
  "bescheinigung",
  "genehmigung",
  "bescheid",
]);

export const postKind = pgEnum("post_kind", [
  "pressemitteilung",
  "bekanntmachung",
  "verkehr",
  "stadtleben",
]);

export const trafficSeverity = pgEnum("traffic_severity", ["hoch", "mittel", "info"]);

export const appointmentStatus = pgEnum("appointment_status", [
  "gebucht",
  "storniert",
  "erschienen",
]);

/* -------------------------------------------------------------------------- */
/* Personen                                                                   */
/* -------------------------------------------------------------------------- */

/** Discord-Konto. Die ID ist die Discord-User-ID. */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  discordRoles: text("discord_roles").array().notNull().default([]),
  isCitizen: boolean("is_citizen").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  rolesSyncedAt: timestamp("roles_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** Meldedaten des RP-Charakters. Ein Charakter pro Discord-Konto. */
export const citizens = pgTable("citizens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  citizenNumber: text("citizen_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthName: text("birth_name"),
  birthDate: date("birth_date").notNull(),
  birthPlace: text("birth_place").notNull(),
  gender: text("gender").notNull(),
  nationality: text("nationality").notNull().default("deutsch"),
  heightCm: integer("height_cm"),
  eyeColor: text("eye_color"),
  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  district: text("district").notNull(),
  phone: text("phone"),
  maritalStatus: text("marital_status").notNull().default("ledig"),
  occupation: text("occupation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Verwaltung                                                                 */
/* -------------------------------------------------------------------------- */

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("FileText"),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  openingHours: jsonb("opening_hours").$type<OpeningHours>().notNull(),
  discordRoleId: text("discord_role_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type OpeningHours = {
  /** 0 = Sonntag … 6 = Samstag, Zeiten als "HH:MM" */
  days: { day: number; open: string; close: string }[];
  note?: string;
};

/** Dienstleistung = Antragsart mit eigenem Formular. */
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    lifeEvent: text("life_event").notNull(),
    requirements: text("requirements").array().notNull().default([]),
    documentsNeeded: text("documents_needed").array().notNull().default([]),
    keywords: text("keywords").array().notNull().default([]),
    feeCents: integer("fee_cents").notNull().default(0),
    feeNote: text("fee_note"),
    processingDays: integer("processing_days").notNull().default(2),
    fields: jsonb("fields").$type<FormField[]>().notNull().default([]),
    issuesDocument: documentType("issues_document"),
    documentValidityYears: integer("document_validity_years"),
    needsAppointment: boolean("needs_appointment").notNull().default(false),
    isOnline: boolean("is_online").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    version: integer("version").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("services_department_idx").on(t.departmentId)],
);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  employment: text("employment").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  tasks: text("tasks").array().notNull().default([]),
  requirements: text("requirements").array().notNull().default([]),
  deadline: date("deadline"),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Anträge                                                                    */
/* -------------------------------------------------------------------------- */

/** Laufende Nummer für Aktenzeichen (AZ 2026-004812). */
export const applicationReferenceSeq = pgSequence("application_reference_seq", {
  startWith: 4800,
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    citizenId: uuid("citizen_id")
      .notNull()
      .references(() => citizens.id),
    jobId: uuid("job_id").references(() => jobs.id),
    status: applicationStatus("status").notNull().default("eingereicht"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    fieldsSnapshot: jsonb("fields_snapshot").$type<FormField[]>().notNull(),
    citizenSnapshot: jsonb("citizen_snapshot").$type<Record<string, unknown>>().notNull(),
    serviceVersion: integer("service_version").notNull(),
    feeCents: integer("fee_cents").notNull().default(0),
    feePaidAt: timestamp("fee_paid_at", { withTimezone: true }),
    assigneeId: text("assignee_id").references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    index("applications_citizen_idx").on(t.citizenId),
    index("applications_department_status_idx").on(t.departmentId, t.status),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: eventType("type").notNull(),
    authorId: text("author_id").references(() => users.id),
    fromStatus: applicationStatus("from_status"),
    toStatus: applicationStatus("to_status"),
    message: text("message"),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("application_events_application_idx").on(t.applicationId)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    type: documentType("type").notNull(),
    title: text("title").notNull(),
    citizenId: uuid("citizen_id")
      .notNull()
      .references(() => citizens.id),
    applicationId: uuid("application_id").references(() => applications.id),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    details: jsonb("details").$type<Record<string, string>>().notNull().default({}),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    validUntil: date("valid_until"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    issuedById: text("issued_by_id").references(() => users.id),
  },
  (t) => [index("documents_citizen_idx").on(t.citizenId)],
);

/* -------------------------------------------------------------------------- */
/* Stadt-Inhalte                                                              */
/* -------------------------------------------------------------------------- */

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    kind: postKind("kind").notNull(),
    title: text("title").notNull(),
    teaser: text("teaser").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    gazetteNumber: text("gazette_number"),
    departmentId: uuid("department_id").references(() => departments.id),
    isFeatured: boolean("is_featured").notNull().default(false),
    authorId: text("author_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_published_idx").on(t.publishedAt)],
);

export const trafficNotices = pgTable("traffic_notices", {
  id: uuid("id").primaryKey().defaultRandom(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  severity: trafficSeverity("severity").notNull().default("mittel"),
  detail: text("detail").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cityEvents = pgTable("city_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  description: text("description"),
});

/* -------------------------------------------------------------------------- */
/* Termine                                                                    */
/* -------------------------------------------------------------------------- */

export const appointmentSlots = pgTable(
  "appointment_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(15),
    capacity: integer("capacity").notNull().default(1),
    location: text("location"),
  },
  (t) => [index("appointment_slots_department_idx").on(t.departmentId, t.startsAt)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => appointmentSlots.id, { onDelete: "cascade" }),
    citizenId: uuid("citizen_id")
      .notNull()
      .references(() => citizens.id),
    applicationId: uuid("application_id").references(() => applications.id),
    purpose: text("purpose").notNull(),
    status: appointmentStatus("status").notNull().default("gebucht"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("appointments_slot_citizen_idx").on(t.slotId, t.citizenId)],
);

/* -------------------------------------------------------------------------- */
/* Protokoll                                                                  */
/* -------------------------------------------------------------------------- */

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Citizen = typeof citizens.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];
export type CityDocument = typeof documents.$inferSelect;
export type DocumentType = (typeof documentType.enumValues)[number];
export type Post = typeof posts.$inferSelect;
export type PostKind = (typeof postKind.enumValues)[number];
export type Job = typeof jobs.$inferSelect;
export type TrafficNotice = typeof trafficNotices.$inferSelect;
export type CityEvent = typeof cityEvents.$inferSelect;
export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;

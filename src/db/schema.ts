import { bigint, boolean, date, index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

// Tables required by Better Auth (core + admin plugin). Column names mirror the
// Better Auth field names so the drizzle adapter maps them without overrides.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Shared rate-limit storage so limits hold across serverless instances.
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ---------------------------------------------------------------------------------------------
// Business ("Werkbank") — see docs/konzept/markenkonzept.md. IDs are app-generated UUIDs, enum-like
// columns are plain text validated in src/lib/business. Prices are stored net in cents; null means
// "not configured", and an unconfigured price is never shown on the website.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Single-row settings document (id "main"), parsed and completed with defaults in code. */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Overrides for the service catalog. Rows are keyed by the catalog slug; unknown ids are custom services. */
export const service = pgTable("service", {
  id: text("id").primaryKey(),
  groupKey: text("group_key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceType: text("price_type").notNull().default("fest"),
  priceCents: integer("price_cents"),
  visible: boolean("visible").notNull().default(true),
  requiresMasterPartner: boolean("requires_master_partner").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const customer = pgTable("customer", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("privat"),
  email: text("email"),
  phone: text("phone"),
  street: text("street"),
  postalCode: text("postal_code"),
  city: text("city"),
  notes: text("notes"),
  ...timestamps,
});

export const partner = pgTable("partner", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  trade: text("trade"),
  region: text("region"),
  /** Parkettleger-Meisterbetrieb: unlocks the Meister services on the website while active. */
  isMasterPartner: boolean("is_master_partner").notNull().default(false),
  status: text("status").notNull().default("bewerbung"),
  notes: text("notes"),
  ...timestamps,
});

/** Inbound requests from the website: Boden-Check, project and partner applications, emergencies. */
export const lead = pgTable(
  "lead",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("neu"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    postalCode: text("postal_code"),
    message: text("message"),
    payload: jsonb("payload"),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("lead_created_at_idx").on(table.createdAt)],
);

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  floorType: text("floor_type"),
  areaM2: real("area_m2"),
  city: text("city"),
  status: text("status").notNull().default("anfrage"),
  /** Projektplatz: the contingent year and month this project occupies. */
  slotYear: integer("slot_year"),
  slotMonth: integer("slot_month"),
  notes: text("notes"),
  ...timestamps,
});

export const tool = pgTable("tool", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  status: text("status").notNull().default("verfuegbar"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Monthly live webinar ("Boden-Sprechstunde"). */
export const officeHour = pgTable("office_hour", {
  id: text("id").primaryKey(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(45),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("geplant"),
  ...timestamps,
});

export const officeHourRegistration = pgTable(
  "office_hour_registration",
  {
    id: text("id").primaryKey(),
    officeHourId: text("office_hour_id")
      .notNull()
      .references(() => officeHour.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    email: text("email").notNull(),
    newsletterConsent: boolean("newsletter_consent").notNull().default(false),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    attended: boolean("attended").notNull().default(false),
    watchedRecording: boolean("watched_recording").notNull().default(false),
    voucherCode: text("voucher_code").unique(),
    voucherIssuedAt: timestamp("voucher_issued_at", { withTimezone: true }),
    voucherRedeemedAt: timestamp("voucher_redeemed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("office_hour_registration_office_hour_idx").on(table.officeHourId)],
);

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  status: text("status").notNull().default("aktiv"),
  startedAt: date("started_at", { mode: "string" }),
  minTermMonths: integer("min_term_months"),
  areaM2: real("area_m2"),
  notes: text("notes"),
  ...timestamps,
});

/** Digital floor passport: what was laid, when, and how to care for it. */
export const floorPass = pgTable("floor_pass", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  wood: text("wood"),
  surface: text("surface"),
  batch: text("batch"),
  areaM2: real("area_m2"),
  installedAt: date("installed_at", { mode: "string" }),
  carePlan: text("care_plan"),
  nextCareAt: date("next_care_at", { mode: "string" }),
  notes: text("notes"),
  ...timestamps,
});

/** Calendar entries. Every entry can link to the records it belongs to. */
export const calendarEvent = pgTable(
  "calendar_event",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").notNull().default(false),
    location: text("location"),
    notes: text("notes"),
    status: text("status").notNull().default("geplant"),
    checklist: jsonb("checklist"),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
    toolId: text("tool_id").references(() => tool.id, { onDelete: "set null" }),
    officeHourId: text("office_hour_id").references(() => officeHour.id, { onDelete: "set null" }),
    subscriptionId: text("subscription_id").references(() => subscription.id, { onDelete: "set null" }),
    leadId: text("lead_id").references(() => lead.id, { onDelete: "set null" }),
    floorPassId: text("floor_pass_id").references(() => floorPass.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("calendar_event_starts_at_idx").on(table.startsAt)],
);

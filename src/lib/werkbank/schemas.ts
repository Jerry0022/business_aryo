import { z } from "zod";
import { EVENT_STATUSES, EVENT_TYPES, timeToMinutes } from "@/lib/business/calendar";
import { PROJECT_STATUSES } from "@/lib/business/contingent";
import { PRICE_TYPES, SERVICE_GROUPS } from "@/lib/business/services";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/business/subscriptions";
import {
  CUSTOMER_KINDS,
  keysOf,
  LEAD_STATUSES,
  OFFICE_HOUR_STATUSES,
  PARTNER_STATUSES,
  TOOL_STATUSES,
} from "./constants";

// Input schemas of the Werkbank server actions. Every action parses its (untrusted) input with one
// of these before touching the database.

export const idSchema = z.string().trim().min(1).max(64);
const optionalId = z.string().trim().max(64).nullable().optional().transform((value) => (value ? value : null));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");
const optionalDate = z
  .union([z.literal(""), isoDate])
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));
const time = z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit im Format HH:MM");
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Höchstens ${max} Zeichen.`)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, `Höchstens ${max} Zeichen.`);
const optionalArea = z
  .number()
  .min(0, "Die Fläche darf nicht negativ sein.")
  .max(100_000, "Die Fläche ist zu groß.")
  .nullable()
  .optional()
  .transform((value) => (value === undefined ? null : value));
const optionalEmail = z
  .union([z.literal(""), z.email("Bitte gib eine gültige E-Mail-Adresse an.").max(160)])
  .nullable()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : null));

export const eventInputSchema = z
  .object({
    id: optionalId,
    type: z.enum(keysOf(EVENT_TYPES)),
    title: required(160, "Bitte gib einen Titel an."),
    date: isoDate,
    endDate: isoDate,
    start: time,
    end: time,
    allDay: z.boolean(),
    location: text(200),
    notes: text(4000),
    status: z.enum(keysOf(EVENT_STATUSES)),
    checklist: z
      .array(z.object({ text: z.string().trim().min(1).max(200), done: z.boolean() }))
      .max(40)
      .default([]),
    customerId: optionalId,
    projectId: optionalId,
    toolId: optionalId,
    officeHourId: optionalId,
    subscriptionId: optionalId,
    leadId: optionalId,
    floorPassId: optionalId,
    confirmed: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.allDay && timeToMinutes(value.end) <= timeToMinutes(value.start)) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "Das Ende muss nach dem Beginn liegen." });
    }
    if (value.allDay && value.endDate < value.date) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Das Enddatum liegt vor dem Beginn." });
    }
  });

export type EventInput = z.input<typeof eventInputSchema>;

export const customerInputSchema = z.object({
  id: optionalId,
  name: required(120, "Bitte gib einen Namen an."),
  kind: z.enum(keysOf(CUSTOMER_KINDS)),
  email: optionalEmail,
  phone: text(40),
  street: text(120),
  postalCode: text(10),
  city: text(80),
  notes: text(4000),
});

export type CustomerInput = z.input<typeof customerInputSchema>;

export const projectInputSchema = z
  .object({
    id: optionalId,
    customerId: optionalId,
    title: required(160, "Bitte gib einen Titel an."),
    floorType: text(120),
    areaM2: optionalArea,
    city: text(80),
    status: z.enum(keysOf(PROJECT_STATUSES)),
    slotYear: z.number().int().min(2025).max(2100).nullable().optional().transform((value) => value ?? null),
    slotMonth: z.number().int().min(1).max(12).nullable().optional().transform((value) => value ?? null),
    notes: text(4000),
  })
  .superRefine((value, ctx) => {
    if (value.slotMonth !== null && value.slotYear === null) {
      ctx.addIssue({ code: "custom", path: ["slotYear"], message: "Zum Monat gehört ein Jahr." });
    }
  });

export type ProjectInput = z.input<typeof projectInputSchema>;

export const floorPassInputSchema = z.object({
  id: optionalId,
  customerId: optionalId,
  projectId: optionalId,
  title: required(160, "Bitte gib einen Titel an."),
  wood: text(120),
  surface: text(120),
  batch: text(80),
  areaM2: optionalArea,
  installedAt: optionalDate,
  carePlan: text(4000),
  nextCareAt: optionalDate,
  notes: text(4000),
});

export type FloorPassInput = z.input<typeof floorPassInputSchema>;

export const toolInputSchema = z.object({
  id: optionalId,
  name: required(120, "Bitte gib einen Namen an."),
  category: text(80),
  status: z.enum(keysOf(TOOL_STATUSES)),
  notes: text(4000),
  sortOrder: z.number().int().min(0).max(100_000).optional().default(0),
});

export type ToolInput = z.input<typeof toolInputSchema>;

export const subscriptionInputSchema = z.object({
  id: optionalId,
  plan: z.enum(keysOf(SUBSCRIPTION_PLANS)),
  customerId: optionalId,
  status: z.enum(keysOf(SUBSCRIPTION_STATUSES)),
  startedAt: optionalDate,
  minTermMonths: z.number().int().min(0).max(60).nullable().optional().transform((value) => value ?? null),
  areaM2: optionalArea,
  notes: text(4000),
});

export type SubscriptionInput = z.input<typeof subscriptionInputSchema>;

export const partnerInputSchema = z.object({
  id: optionalId,
  company: required(120, "Bitte gib den Betrieb an."),
  contactName: text(120),
  email: optionalEmail,
  phone: text(40),
  trade: text(80),
  region: text(120),
  isMasterPartner: z.boolean(),
  status: z.enum(keysOf(PARTNER_STATUSES)),
  notes: text(4000),
});

export type PartnerInput = z.input<typeof partnerInputSchema>;

export const officeHourInputSchema = z.object({
  id: optionalId,
  date: isoDate,
  time,
  durationMinutes: z.number().int().min(15).max(180),
  topic: required(200, "Bitte gib ein Thema an."),
  status: z.enum(keysOf(OFFICE_HOUR_STATUSES)),
});

export type OfficeHourInput = z.input<typeof officeHourInputSchema>;

export const leadStatusSchema = z.enum(keysOf(LEAD_STATUSES));

export const registrationFlagSchema = z.object({
  id: idSchema,
  field: z.enum(["confirmed", "attended", "watchedRecording"]),
  value: z.boolean(),
});

export const voucherFactsSchema = z.object({
  registrationId: idSchema,
  photosReceived: z.boolean(),
  inServiceArea: z.boolean().nullable(),
  areaM2: z.number().min(0).max(100_000).nullable(),
  specialFloor: z.boolean(),
});

export type VoucherFacts = z.input<typeof voucherFactsSchema>;

export const serviceInputSchema = z.object({
  id: idSchema,
  groupKey: z.enum(keysOf(SERVICE_GROUPS)),
  title: required(160, "Bitte gib einen Titel an."),
  description: z.string().trim().max(600, "Höchstens 600 Zeichen."),
  priceType: z.enum(keysOf(PRICE_TYPES)),
  priceCents: z.number().int().min(0).max(1_000_000_000).nullable(),
  visible: z.boolean(),
  requiresMasterPartner: z.boolean(),
  sortOrder: z.number().int().min(0).max(100_000),
});

export type ServiceInput = z.input<typeof serviceInputSchema>;

export const rentalInputSchema = z
  .object({
    toolId: idSchema,
    customerId: optionalId,
    fromDate: isoDate,
    fromTime: time,
    toDate: isoDate,
    toTime: time,
    notes: text(2000),
    handovers: z.boolean(),
    confirmed: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.toDate < value.fromDate) {
      ctx.addIssue({ code: "custom", path: ["toDate"], message: "Die Rückgabe liegt vor der Ausgabe." });
    }
  });

export type RentalInput = z.input<typeof rentalInputSchema>;

/** First error message per field for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

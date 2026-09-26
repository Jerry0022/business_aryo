"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getSettings } from "./data";
import { floorCheckAnswersSchema, recommendFloors } from "./floor-check";
import type { FormState } from "./form-state";
import { mergeOfficeHours } from "./office-hours";
import { isSubscriptionPlanKey } from "./subscriptions";

// Server actions behind the public forms. Each one validates input, drops obvious bots
// (honeypot field + minimum fill time) and stores the request as a lead for the Werkbank.
// Nothing is sent by e-mail yet: an e-mail provider is a go-live item (docs/GO-LIVE.md).

const MIN_FILL_MS = 2500;

const name = z.string().trim().min(2, "Bitte gib deinen Namen an.").max(80, "Der Name ist zu lang.");
const email = z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse an.").max(160);
const optionalText = (max: number) => z.string().trim().max(max, `Höchstens ${max} Zeichen.`).optional().default("");
const postalCode = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Bitte gib eine fünfstellige Postleitzahl an.");
const area = z
  .union([z.literal(""), z.coerce.number().min(1, "Bitte eine Fläche ab 1 m² angeben.").max(100_000)])
  .optional()
  .default("");

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isBot(formData: FormData): boolean {
  if (field(formData, "website").trim() !== "") return true;
  const startedAt = Number(field(formData, "startedAt"));
  return Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

const invalid = (error: z.ZodError): FormState => ({
  status: "error",
  message: "Bitte prüf die markierten Felder.",
  fieldErrors: fieldErrors(error),
});

const failed: FormState = {
  status: "error",
  message: `Das hat gerade nicht geklappt. Bitte versuch es später noch einmal oder schreib mir direkt eine E-Mail.`,
};

async function storeLead(values: {
  kind: "boden-check" | "projekt" | "partner" | "notfall" | "abo";
  name: string;
  email: string;
  phone?: string;
  postalCode?: string;
  message?: string;
  payload: Record<string, unknown>;
}) {
  const now = new Date();
  await getDb()
    .insert(schema.lead)
    .values({
      id: crypto.randomUUID(),
      kind: values.kind,
      status: "neu",
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      postalCode: values.postalCode || null,
      message: values.message || null,
      payload: values.payload,
      createdAt: now,
      updatedAt: now,
    });
}

// ---- Boden-Check -------------------------------------------------------------------------------

const floorCheckSchema = z.object({
  name,
  email,
  postalCode,
  areaM2: area,
  answers: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Die Antworten konnten nicht gelesen werden." });
        return z.NEVER;
      }
    })
    .pipe(floorCheckAnswersSchema),
});

export async function submitFloorCheck(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = floorCheckSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    postalCode: field(formData, "postalCode"),
    areaM2: field(formData, "areaM2"),
    answers: field(formData, "answers") || "{}",
  });
  if (!parsed.success) return invalid(parsed.error);
  const { answers, areaM2, ...contact } = parsed.data;
  if (Object.keys(answers).length === 0) {
    return { status: "error", message: "Bitte beantworte mindestens eine Frage im Boden-Check." };
  }
  try {
    await storeLead({
      kind: "boden-check",
      ...contact,
      payload: { answers, areaM2: areaM2 === "" ? null : areaM2, recommendations: recommendFloors(answers).map((r) => r.name) },
    });
  } catch {
    return failed;
  }
  return {
    status: "success",
    message: "Danke! Dein Bodenprofil ist gespeichert, ich schicke es dir per E-Mail. Nächster Schritt: die Boden-Sprechstunde.",
  };
}

// ---- Boden-Sprechstunde ------------------------------------------------------------------------

const officeHourSchema = z.object({
  officeHourId: z.string().trim().max(64).optional().default(""),
  startsAt: z.string().trim().max(40),
  firstName: z.string().trim().min(2, "Bitte gib deinen Vornamen an.").max(60),
  email,
  newsletter: z.boolean(),
});

export async function registerForOfficeHour(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = officeHourSchema.safeParse({
    officeHourId: field(formData, "officeHourId"),
    startsAt: field(formData, "startsAt"),
    firstName: field(formData, "firstName"),
    email: field(formData, "email"),
    newsletter: field(formData, "newsletter") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  try {
    const db = getDb();
    const now = new Date();
    let officeHourId = input.officeHourId;

    if (officeHourId) {
      const [row] = await db.select().from(schema.officeHour).where(eq(schema.officeHour.id, officeHourId)).limit(1);
      if (!row || row.status === "abgesagt" || row.startsAt.getTime() < now.getTime()) {
        return { status: "error", message: "Diese Sprechstunde ist nicht mehr buchbar. Bitte wähl einen anderen Termin." };
      }
    } else {
      // Default slot: accept only a date the schedule actually offers, then create it once.
      const settings = await getSettings();
      const slot = mergeOfficeHours([], now, settings, 6).find((item) => item.startsAt === input.startsAt);
      if (!slot) return { status: "error", message: "Diesen Termin gibt es nicht. Bitte lad die Seite neu." };
      const startsAt = new Date(slot.startsAt);
      const [existing] = await db.select().from(schema.officeHour).where(eq(schema.officeHour.startsAt, startsAt)).limit(1);
      if (existing) {
        officeHourId = existing.id;
      } else {
        officeHourId = crypto.randomUUID();
        await db.insert(schema.officeHour).values({
          id: officeHourId,
          startsAt,
          durationMinutes: slot.durationMinutes,
          topic: slot.topic,
          status: "geplant",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const [already] = await db
      .select({ id: schema.officeHourRegistration.id })
      .from(schema.officeHourRegistration)
      .where(
        and(
          eq(schema.officeHourRegistration.officeHourId, officeHourId),
          eq(schema.officeHourRegistration.email, input.email),
        ),
      )
      .limit(1);
    if (already) return { status: "success", message: "Du bist für diesen Termin schon angemeldet. Bis bald!" };

    await db.insert(schema.officeHourRegistration).values({
      id: crypto.randomUUID(),
      officeHourId,
      firstName: input.firstName,
      email: input.email,
      newsletterConsent: input.newsletter,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return failed;
  }
  return {
    status: "success",
    message: "Dein Platz ist reserviert. Den Link zur Sprechstunde bekommst du per E-Mail, sobald du deine Anmeldung bestätigt hast.",
  };
}

// ---- Applications and requests -----------------------------------------------------------------

const projectSchema = z.object({
  name,
  email,
  phone: optionalText(40),
  postalCode,
  role: z.enum(["Privat", "Bauherr", "Architektur", "Hausverwaltung", "Gewerbe"]),
  areaM2: area,
  floorWish: optionalText(200),
  timeframe: optionalText(80),
  message: optionalText(2000),
});

export async function submitProjectApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = projectSchema.safeParse(Object.fromEntries(["name", "email", "phone", "postalCode", "role", "areaM2", "floorWish", "timeframe", "message"].map((key) => [key, field(formData, key)])));
  if (!parsed.success) return invalid(parsed.error);
  const { message, phone, postalCode: plz, ...rest } = parsed.data;
  try {
    await storeLead({
      kind: "projekt",
      name: rest.name,
      email: rest.email,
      phone,
      postalCode: plz,
      message,
      payload: { role: rest.role, areaM2: rest.areaM2 === "" ? null : rest.areaM2, floorWish: rest.floorWish, timeframe: rest.timeframe },
    });
  } catch {
    return failed;
  }
  return { status: "success", message: "Danke für deine Bewerbung! Ich melde mich innerhalb von 48 Stunden bei dir." };
}

const PARTNER_NEEDS = ["Material", "Werkzeug", "Planung", "Unterstützung auf der Baustelle", "Meister-Arbeiten übernehmen"] as const;

const partnerSchema = z.object({
  company: z.string().trim().min(2, "Bitte gib deinen Betrieb an.").max(120),
  name,
  email,
  phone: optionalText(40),
  trade: z.string().trim().min(2, "Bitte gib dein Gewerk an.").max(80),
  region: optionalText(120),
  isMasterBusiness: z.boolean(),
  needs: z.array(z.enum(PARTNER_NEEDS)).max(PARTNER_NEEDS.length),
  message: optionalText(2000),
});

export async function submitPartnerApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = partnerSchema.safeParse({
    company: field(formData, "company"),
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    trade: field(formData, "trade"),
    region: field(formData, "region"),
    isMasterBusiness: field(formData, "isMasterBusiness") === "on",
    needs: formData.getAll("needs").filter((value): value is string => typeof value === "string"),
    message: field(formData, "message"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { message, phone, name: contactName, email: contactEmail, ...rest } = parsed.data;
  try {
    await storeLead({ kind: "partner", name: contactName, email: contactEmail, phone, message, payload: rest });
  } catch {
    return failed;
  }
  return { status: "success", message: "Danke für deine Bewerbung! Ich melde mich für ein kurzes Aufnahmegespräch." };
}

const emergencySchema = z.object({
  name,
  email,
  phone: optionalText(40),
  postalCode,
  damage: z.enum(["Wasserschaden", "Kratzer oder Dellen", "Stumpfe Stellen", "Etwas anderes"]),
  message: z.string().trim().min(10, "Beschreib den Schaden bitte in ein paar Worten.").max(2000),
});

export async function submitEmergencyRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = emergencySchema.safeParse(Object.fromEntries(["name", "email", "phone", "postalCode", "damage", "message"].map((key) => [key, field(formData, key)])));
  if (!parsed.success) return invalid(parsed.error);
  const { damage, ...rest } = parsed.data;
  try {
    await storeLead({ kind: "notfall", ...rest, payload: { damage } });
  } catch {
    return failed;
  }
  return {
    status: "success",
    message: "Danke! Schick mir jetzt bitte 2–3 Fotos des Schadens per E-Mail, dann bekommst du eine Einschätzung.",
  };
}

const subscriptionInquirySchema = z.object({
  plan: z.string().refine(isSubscriptionPlanKey, "Unbekanntes Abo."),
  name,
  company: optionalText(120),
  email,
  phone: optionalText(40),
  areaM2: area,
  message: optionalText(2000),
});

export async function submitSubscriptionInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success", message: "Danke!" };
  const parsed = subscriptionInquirySchema.safeParse(Object.fromEntries(["plan", "name", "company", "email", "phone", "areaM2", "message"].map((key) => [key, field(formData, key)])));
  if (!parsed.success) return invalid(parsed.error);
  const { message, phone, name: contactName, email: contactEmail, ...rest } = parsed.data;
  try {
    await storeLead({
      kind: "abo",
      name: contactName,
      email: contactEmail,
      phone,
      message,
      payload: { plan: rest.plan, company: rest.company, areaM2: rest.areaM2 === "" ? null : rest.areaM2 },
    });
  } catch {
    return failed;
  }
  return { status: "success", message: "Danke! Ich melde mich mit einem Vorschlag für dein Abo." };
}

"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { berlinDateKey, berlinToUtc, parseDateKey, todayKey } from "@/lib/business/calendar";
import { foundingContingent, projectContingent } from "@/lib/business/contingent";
import { getSettings } from "@/lib/business/data";
import { defaultOfficeHourTopic, generateVoucherCode, voucherChecks } from "@/lib/business/office-hours";
import { assertAdmin, failure, logActionError, revalidateWerkbank, SAVE_FAILED } from "../guard";
import { projectSlots } from "../repo";
import { fieldErrors, idSchema, officeHourInputSchema, registrationFlagSchema, voucherFactsSchema, type OfficeHourInput, type VoucherFacts } from "../schemas";
import type { ActionResult } from "../types";

// Boden-Sprechstunde: sessions, registrations and the voucher for the Erstberatung.

export async function saveOfficeHour(input: OfficeHourInput): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = officeHourInputSchema.safeParse(input);
  if (!parsed.success) return failure("Bitte prüf die markierten Felder.", fieldErrors(parsed.error));
  const { id: existingId, date, time, ...values } = parsed.data;
  const startsAt = berlinToUtc(date, time);
  const db = getDb();
  const [sameStart] = await db.select({ id: schema.officeHour.id }).from(schema.officeHour).where(eq(schema.officeHour.startsAt, startsAt)).limit(1);
  if (sameStart && sameStart.id !== existingId) return failure("Zu diesem Zeitpunkt gibt es schon eine Sprechstunde.");
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  try {
    if (existingId) await db.update(schema.officeHour).set({ ...values, startsAt, updatedAt: now }).where(eq(schema.officeHour.id, id));
    else await db.insert(schema.officeHour).values({ id, ...values, startsAt, createdAt: now, updatedAt: now });
  } catch (error) {
    logActionError("saveOfficeHour", error);
    return failure(SAVE_FAILED);
  }
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: existingId ? "Sprechstunde gespeichert." : "Sprechstunde angelegt.", data: { id } };
}

const defaultSlotSchema = z.object({ startsAt: z.iso.datetime() });

/** Stores a suggested default session (topic from the yearly plan). */
export async function createDefaultOfficeHour(startsAtIso: string): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = defaultSlotSchema.safeParse({ startsAt: startsAtIso });
  if (!parsed.success) return failure("Ungültiger Termin.");
  const startsAt = new Date(parsed.data.startsAt);
  const db = getDb();
  const [existing] = await db.select({ id: schema.officeHour.id }).from(schema.officeHour).where(eq(schema.officeHour.startsAt, startsAt)).limit(1);
  if (existing) return { ok: true, message: "Diese Sprechstunde ist schon angelegt.", data: { id: existing.id } };
  const settings = await getSettings();
  const { year, month } = parseDateKey(berlinDateKey(startsAt));
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(schema.officeHour).values({
    id,
    startsAt,
    durationMinutes: settings.officeHours.durationMinutes,
    topic: defaultOfficeHourTopic(year, month),
    status: "geplant",
    createdAt: now,
    updatedAt: now,
  });
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Sprechstunde angelegt.", data: { id } };
}

export async function deleteOfficeHour(id: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return failure("Ungültige Sprechstunde.");
  await getDb().delete(schema.officeHour).where(eq(schema.officeHour.id, parsed.data));
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Sprechstunde und ihre Anmeldungen gelöscht." };
}

export async function setRegistrationFlag(id: string, field: string, value: boolean): Promise<ActionResult> {
  await assertAdmin();
  const parsed = registrationFlagSchema.safeParse({ id, field, value });
  if (!parsed.success) return failure("Ungültige Eingabe.");
  const now = new Date();
  const update =
    parsed.data.field === "confirmed"
      ? { confirmedAt: parsed.data.value ? now : null }
      : parsed.data.field === "attended"
        ? { attended: parsed.data.value }
        : { watchedRecording: parsed.data.value };
  await getDb()
    .update(schema.officeHourRegistration)
    .set({ ...update, updatedAt: now })
    .where(eq(schema.officeHourRegistration.id, parsed.data.id));
  revalidateWerkbank();
  return { ok: true };
}

async function contingentFree(): Promise<number> {
  const settings = await getSettings();
  const today = todayKey();
  const consultations = await getDb()
    .select({ type: schema.calendarEvent.type, startsAt: schema.calendarEvent.startsAt, status: schema.calendarEvent.status })
    .from(schema.calendarEvent)
    .where(eq(schema.calendarEvent.type, "erstberatung"));
  const founding = foundingContingent(consultations, settings.contingent.foundingConsultations, settings.contingent.foundingDeadline, today);
  if (founding.open) return founding.free;
  return projectContingent(await projectSlots(), settings.contingent.slotYear, settings.contingent.projectSlotsPerYear).free;
}

/** Issues a voucher code once every enabled condition is met (checked again on the server). */
export async function issueVoucher(facts: VoucherFacts): Promise<ActionResult<{ code: string }>> {
  await assertAdmin();
  const parsed = voucherFactsSchema.safeParse(facts);
  if (!parsed.success) return failure("Ungültige Eingabe.");
  const db = getDb();
  const [registration] = await db
    .select()
    .from(schema.officeHourRegistration)
    .where(eq(schema.officeHourRegistration.id, parsed.data.registrationId))
    .limit(1);
  if (!registration) return failure("Diese Anmeldung gibt es nicht mehr.");
  if (registration.voucherCode) return { ok: true, message: "Der Gutschein ist schon ausgestellt.", data: { code: registration.voucherCode } };
  const [floorCheck] = await db
    .select({ id: schema.lead.id })
    .from(schema.lead)
    .where(and(eq(schema.lead.kind, "boden-check"), eq(schema.lead.email, registration.email.toLowerCase())))
    .limit(1);
  const settings = await getSettings();
  const result = voucherChecks(
    {
      attended: registration.attended,
      watchedRecording: registration.watchedRecording,
      floorCheckDone: Boolean(floorCheck),
      photosReceived: parsed.data.photosReceived,
      inServiceArea: parsed.data.inServiceArea,
      areaM2: parsed.data.areaM2,
      specialFloor: parsed.data.specialFloor,
      contingentFree: await contingentFree(),
    },
    settings,
  );
  if (!result.eligible) {
    const missing = result.checks.filter((check) => !check.ok).map((check) => check.label);
    return failure(`Noch nicht alle Bedingungen erfüllt: ${missing.join(", ")}.`);
  }
  let code = generateVoucherCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await db
        .update(schema.officeHourRegistration)
        .set({ voucherCode: code, voucherIssuedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.officeHourRegistration.id, registration.id));
      revalidateWerkbank();
      return { ok: true, message: `Gutschein ${code} ausgestellt.`, data: { code } };
    } catch (error) {
      logActionError("issueVoucher", error);
      code = generateVoucherCode();
    }
  }
  return failure(SAVE_FAILED);
}

export async function setVoucherRedeemed(id: string, redeemed: boolean): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.object({ id: idSchema, redeemed: z.boolean() }).safeParse({ id, redeemed });
  if (!parsed.success) return failure("Ungültige Eingabe.");
  const db = getDb();
  const [registration] = await db.select().from(schema.officeHourRegistration).where(eq(schema.officeHourRegistration.id, parsed.data.id)).limit(1);
  if (!registration?.voucherCode) return failure("Für diese Anmeldung gibt es keinen Gutschein.");
  await db
    .update(schema.officeHourRegistration)
    .set({ voucherRedeemedAt: parsed.data.redeemed ? new Date() : null, updatedAt: new Date() })
    .where(eq(schema.officeHourRegistration.id, parsed.data.id));
  revalidateWerkbank();
  return { ok: true, message: parsed.data.redeemed ? "Gutschein als eingelöst markiert." : "Einlösung zurückgenommen." };
}

export async function deleteRegistration(id: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return failure("Ungültige Anmeldung.");
  await getDb().delete(schema.officeHourRegistration).where(eq(schema.officeHourRegistration.id, parsed.data));
  revalidateWerkbank();
  return { ok: true, message: "Anmeldung gelöscht." };
}

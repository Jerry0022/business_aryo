"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getServiceCatalog, getSettings, saveSettings } from "@/lib/business/data";
import { DEFAULT_SERVICE_IDS, defaultServices } from "@/lib/business/services";
import { settingsSchema, type Settings } from "@/lib/business/settings";
import { assertAdmin, failure, logActionError, revalidateWerkbank, SAVE_FAILED } from "../guard";
import { fieldErrors, serviceInputSchema, type ServiceInput } from "../schemas";
import type { ActionResult } from "../types";

// Settings document and the service catalog ("Preise & Leistungen").

const SECTIONS = Object.keys(settingsSchema.shape) as [keyof Settings, ...(keyof Settings)[]];

/** Replaces one section of the settings document; the other sections stay as stored. */
export async function saveSettingsSection<K extends keyof Settings>(section: K, value: Settings[K]): Promise<ActionResult> {
  await assertAdmin();
  const key = z.enum(SECTIONS).safeParse(section);
  if (!key.success) return failure("Unbekannter Bereich.");
  const parsed = settingsSchema.shape[key.data].safeParse(value);
  if (!parsed.success) return failure("Bitte prüf die markierten Felder.", nestedErrors(parsed.error));
  const current = await getSettings();
  const next = { ...current, [key.data]: parsed.data } as Settings;
  try {
    await saveSettings(next);
  } catch (error) {
    logActionError("saveSettingsSection", error);
    return failure(SAVE_FAILED);
  }
  revalidateWerkbank({ publicSite: true, studio: key.data === "analytics" });
  return { ok: true, message: "Gespeichert. Die Website nutzt die neuen Werte ab sofort." };
}

function nestedErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "form";
    errors[path] ??= issue.message;
  }
  return errors;
}

const servicesSchema = z.array(serviceInputSchema).min(1).max(200);

/** Stores the edited catalog entries as overrides (default ids) or custom services. */
export async function saveServices(items: ServiceInput[]): Promise<ActionResult> {
  await assertAdmin();
  const parsed = servicesSchema.safeParse(items);
  if (!parsed.success) return failure("Bitte prüf die markierten Felder.", fieldErrors(parsed.error));
  const defaults = new Map(defaultServices().map((item) => [item.id, item]));
  const now = new Date();
  try {
    const db = getDb();
    for (const item of parsed.data) {
      // Default services keep their group; only custom services can live in any group.
      const values = { ...item, groupKey: defaults.get(item.id)?.groupKey ?? item.groupKey, updatedAt: now };
      await db
        .insert(schema.service)
        .values({ ...values, createdAt: now })
        .onConflictDoUpdate({ target: schema.service.id, set: values });
    }
  } catch (error) {
    logActionError("saveServices", error);
    return failure(SAVE_FAILED);
  }
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: `${parsed.data.length === 1 ? "1 Leistung" : `${parsed.data.length} Leistungen`} gespeichert. Die Website ist aktualisiert.` };
}

const newServiceSchema = z.object({
  groupKey: serviceInputSchema.shape.groupKey,
  title: serviceInputSchema.shape.title,
});

export async function createService(groupKey: string, title: string): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = newServiceSchema.safeParse({ groupKey, title });
  if (!parsed.success) return failure("Bitte gib einen Titel an.", fieldErrors(parsed.error));
  const catalog = await getServiceCatalog();
  const id = `eigene-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date();
  await getDb()
    .insert(schema.service)
    .values({
      id,
      groupKey: parsed.data.groupKey,
      title: parsed.data.title,
      description: "",
      priceType: "fest",
      priceCents: null,
      visible: true,
      requiresMasterPartner: false,
      sortOrder: Math.max(0, ...catalog.map((item) => item.sortOrder)) + 10,
      createdAt: now,
      updatedAt: now,
    });
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Leistung angelegt.", data: { id } };
}

/** Default service: back to the catalog text without price. Custom service: deleted. */
export async function resetService(id: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.string().trim().min(1).max(64).safeParse(id);
  if (!parsed.success) return failure("Unbekannte Leistung.");
  await getDb().delete(schema.service).where(eq(schema.service.id, parsed.data));
  revalidateWerkbank({ publicSite: true });
  return {
    ok: true,
    message: DEFAULT_SERVICE_IDS.has(parsed.data) ? "Leistung auf den Standard zurückgesetzt." : "Eigene Leistung gelöscht.",
  };
}

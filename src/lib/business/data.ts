import "server-only";
import { asc, eq, gte, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { todayKey } from "./calendar";
import {
  foundingContingent,
  projectContingent,
  subscriptionSlotsUsed,
  type FoundingContingent,
  type ProjectContingent,
} from "./contingent";
import { mergeOfficeHours, voucherConditionTexts, type PublicOfficeHour } from "./office-hours";
import {
  defaultServices,
  isServiceShown,
  mergeServices,
  publicPriceLine,
  SERVICE_GROUPS,
  subscriptionDiscountLine,
  type ServiceGroupKey,
  type ServiceItem,
} from "./services";
import { DEFAULT_SETTINGS, resolveSettings, type Settings } from "./settings";
import { SUBSCRIPTION_PLANS } from "./subscriptions";

// Read access shared by the public site and the Werkbank. Every public read degrades to defaults
// when the database is unreachable or not migrated yet (e.g. preview deployments), so the website
// never breaks because of missing business data.

const SETTINGS_ID = "main";

export async function getSettings(): Promise<Settings> {
  try {
    const [row] = await getDb().select().from(schema.appSettings).where(eq(schema.appSettings.id, SETTINGS_ID)).limit(1);
    return resolveSettings(row?.data);
  } catch (error) {
    logFallback("settings", error);
    return DEFAULT_SETTINGS;
  }
}

/** Persists the full settings document. Callers must check authorization first. */
export async function saveSettings(settings: Settings): Promise<void> {
  const data = resolveSettings(settings);
  await getDb()
    .insert(schema.appSettings)
    .values({ id: SETTINGS_ID, data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.appSettings.id, set: { data, updatedAt: new Date() } });
}

export async function getServiceCatalog(): Promise<ServiceItem[]> {
  try {
    const rows = await getDb().select().from(schema.service);
    return mergeServices(rows as Partial<ServiceItem>[]);
  } catch (error) {
    logFallback("services", error);
    return defaultServices();
  }
}

export async function hasActiveMasterPartner(): Promise<boolean> {
  try {
    const rows = await getDb()
      .select({ id: schema.partner.id, isMaster: schema.partner.isMasterPartner })
      .from(schema.partner)
      .where(eq(schema.partner.status, "aktiv"));
    return rows.some((row) => row.isMaster);
  } catch (error) {
    logFallback("partners", error);
    return false;
  }
}

export interface PublicService {
  id: string;
  title: string;
  description: string;
  /** Consumer price incl. VAT, or null when no price is configured. */
  priceLine: string | null;
  /** Laying price with Boden-Pass Plus, only when price and discount are configured. */
  discountLine: string | null;
  viaMasterPartner: boolean;
}

export interface PublicServiceGroup {
  key: ServiceGroupKey;
  label: string;
  lead: string;
  items: PublicService[];
}

export interface PublicPlan {
  key: string;
  name: string;
  audience: string;
  pitch: string;
  features: string[];
  priceLine: string | null;
  minTermMonths: number | null;
  private: boolean;
}

export interface PublicSiteData {
  settings: Settings;
  serviceGroups: PublicServiceGroup[];
  anyPriceShown: boolean;
  hasMasterPartner: boolean;
  projects: ProjectContingent;
  founding: FoundingContingent;
  subscriptionSlots: { total: number; used: number; free: number };
  officeHours: PublicOfficeHour[];
  voucherConditions: string[];
  voucherValue: string | null;
  plans: PublicPlan[];
  /** false when the page runs on defaults because the database could not be read. */
  live: boolean;
}

/** Everything the public landing page needs, computed per request. */
export async function getPublicSiteData(now: Date = new Date()): Promise<PublicSiteData> {
  await connection();
  const settings = await getSettings();
  const [services, hasMasterPartner] = await Promise.all([getServiceCatalog(), hasActiveMasterPartner()]);
  const today = todayKey(now);
  const priceOptions = { vatPercent: settings.pricing.vatPercent, gross: true };

  let live = true;
  let projectRows: { status: string; slotYear: number | null; slotMonth: number | null }[] = [];
  let consultationRows: { type: string; startsAt: Date; status: string }[] = [];
  let subscriptionRows: { plan: string; status: string }[] = [];
  let officeHourRows: { id: string; startsAt: Date; durationMinutes: number; topic: string }[] = [];
  try {
    const db = getDb();
    [projectRows, consultationRows, subscriptionRows, officeHourRows] = await Promise.all([
      db
        .select({ status: schema.project.status, slotYear: schema.project.slotYear, slotMonth: schema.project.slotMonth })
        .from(schema.project)
        .where(eq(schema.project.slotYear, settings.contingent.slotYear)),
      db
        .select({ type: schema.calendarEvent.type, startsAt: schema.calendarEvent.startsAt, status: schema.calendarEvent.status })
        .from(schema.calendarEvent)
        .where(eq(schema.calendarEvent.type, "erstberatung")),
      db
        .select({ plan: schema.subscription.plan, status: schema.subscription.status })
        .from(schema.subscription)
        .where(inArray(schema.subscription.status, ["aktiv"])),
      db
        .select({
          id: schema.officeHour.id,
          startsAt: schema.officeHour.startsAt,
          durationMinutes: schema.officeHour.durationMinutes,
          topic: schema.officeHour.topic,
        })
        .from(schema.officeHour)
        .where(gte(schema.officeHour.startsAt, new Date(now.getTime() - 60 * 60_000)))
        .orderBy(asc(schema.officeHour.startsAt))
        .limit(8),
    ]);
  } catch (error) {
    live = false;
    logFallback("public data", error);
  }

  const serviceGroups: PublicServiceGroup[] = SERVICE_GROUPS.map((group) => ({
    ...group,
    items: services
      .filter((item) => item.groupKey === group.key && isServiceShown(item, hasMasterPartner))
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priceLine: publicPriceLine(item, priceOptions),
        discountLine:
          item.id === "verlegung"
            ? subscriptionDiscountLine(item, settings.pricing.subscriptionDiscountPercent, priceOptions)
            : null,
        viaMasterPartner: item.requiresMasterPartner,
      })),
  })).filter((group) => group.items.length > 0);

  const serviceById = new Map(services.map((item) => [item.id, item]));
  const plans: PublicPlan[] = SUBSCRIPTION_PLANS.filter((plan) => plan.status === "aktiv").map((plan) => {
    const item = plan.serviceId ? serviceById.get(plan.serviceId) : undefined;
    return {
      key: plan.key,
      name: plan.name,
      audience: plan.audience,
      pitch: plan.pitch,
      features: [...plan.features],
      priceLine: item ? publicPriceLine(item, priceOptions) : null,
      minTermMonths: settings.subscriptions.minTermMonths[plan.key] ?? null,
      private: plan.private,
    };
  });

  const subscriptionUsed = subscriptionSlotsUsed(subscriptionRows);

  return {
    settings,
    serviceGroups,
    anyPriceShown:
      serviceGroups.some((group) => group.items.some((item) => item.priceLine)) || plans.some((plan) => plan.priceLine),
    hasMasterPartner,
    projects: projectContingent(projectRows, settings.contingent.slotYear, settings.contingent.projectSlotsPerYear),
    founding: foundingContingent(
      consultationRows,
      settings.contingent.foundingConsultations,
      settings.contingent.foundingDeadline,
      today,
    ),
    subscriptionSlots: {
      total: settings.contingent.subscriptionSlots,
      used: subscriptionUsed,
      free: Math.max(0, settings.contingent.subscriptionSlots - subscriptionUsed),
    },
    officeHours: mergeOfficeHours(officeHourRows, now, settings),
    voucherConditions: voucherConditionTexts(settings),
    voucherValue:
      settings.voucher.valueCents !== null
        ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
            Math.round(settings.voucher.valueCents * (1 + settings.pricing.vatPercent / 100)) / 100,
          )
        : null,
    plans,
    live,
  };
}

function logFallback(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "test") return;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[business] ${scope}: falling back to defaults (${message})`);
}

"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { subscriptionSlotsUsed } from "@/lib/business/contingent";
import { getSettings } from "@/lib/business/data";
import { CUSTOMER_KINDS, labelOf } from "../constants";
import { assertAdmin } from "../guard";
import { buildRecordDetail } from "../records";
import {
  allCustomers,
  allProjects,
  allSubscriptions,
  allTools,
  projectSlots,
  type CustomerRow,
  type FloorPassRow,
  type OfficeHourRow,
  type PartnerRow,
  type ProjectRow,
  type SubscriptionRow,
  type ToolRow,
} from "../repo";
import type { RecordDetail, RecordKind, SelectOption } from "../types";

// Read actions behind the drawer: record details with their links, and the data an edit form needs.

const RECORD_KINDS = ["event", "customer", "project", "lead", "tool", "officeHour", "subscription", "floorPass", "partner"] as const satisfies readonly RecordKind[];

const refSchema = z.object({ kind: z.enum(RECORD_KINDS), id: z.string().trim().min(1).max(64) });

export async function loadRecord(ref: { kind: RecordKind; id: string }): Promise<RecordDetail | null> {
  await assertAdmin();
  const parsed = refSchema.safeParse(ref);
  if (!parsed.success) return null;
  return buildRecordDetail(parsed.data);
}

export type EntityKind = "customer" | "project" | "floorPass" | "tool" | "subscription" | "partner" | "officeHour" | "rental";

export type EntityForm =
  | { entity: "customer"; record: CustomerRow | null }
  | {
      entity: "project";
      record: ProjectRow | null;
      customers: SelectOption[];
      slots: { id: string; title: string; status: string; slotYear: number | null; slotMonth: number | null }[];
      slotTotal: number;
      slotYear: number;
    }
  | { entity: "floorPass"; record: FloorPassRow | null; customers: SelectOption[]; projects: SelectOption[] }
  | { entity: "tool"; record: ToolRow | null }
  | {
      entity: "subscription";
      record: SubscriptionRow | null;
      customers: SelectOption[];
      minTermMonths: Record<string, number>;
      slotsTotal: number;
      slotsUsedByOthers: number;
    }
  | { entity: "partner"; record: PartnerRow | null }
  | { entity: "officeHour"; record: OfficeHourRow | null; defaultTime: string; defaultDuration: number }
  | { entity: "rental"; toolId: string | null; tools: SelectOption[]; customers: SelectOption[] };

const entitySchema = z.object({
  entity: z.enum(["customer", "project", "floorPass", "tool", "subscription", "partner", "officeHour", "rental"]),
  id: z.string().trim().max(64).nullable(),
});

async function customerOptions(): Promise<SelectOption[]> {
  const customers = await allCustomers();
  return customers.map((customer) => ({ id: customer.id, label: customer.name, meta: labelOf(CUSTOMER_KINDS, customer.kind) }));
}

async function first<T>(rows: Promise<T[]>): Promise<T | null> {
  const [row] = await rows;
  return row ?? null;
}

export async function loadEntityForm(entity: EntityKind, id: string | null): Promise<EntityForm | null> {
  await assertAdmin();
  const parsed = entitySchema.safeParse({ entity, id });
  if (!parsed.success) return null;
  const recordId = parsed.data.id || null;
  const db = getDb();
  switch (parsed.data.entity) {
    case "customer":
      return { entity: "customer", record: recordId ? await first(db.select().from(schema.customer).where(eq(schema.customer.id, recordId)).limit(1)) : null };
    case "project": {
      const [settings, customers, slots, record] = await Promise.all([
        getSettings(),
        customerOptions(),
        projectSlots(),
        recordId ? first(db.select().from(schema.project).where(eq(schema.project.id, recordId)).limit(1)) : Promise.resolve(null),
      ]);
      return { entity: "project", record, customers, slots, slotTotal: settings.contingent.projectSlotsPerYear, slotYear: settings.contingent.slotYear };
    }
    case "floorPass": {
      const [customers, projects, record] = await Promise.all([
        customerOptions(),
        allProjects(),
        recordId ? first(db.select().from(schema.floorPass).where(eq(schema.floorPass.id, recordId)).limit(1)) : Promise.resolve(null),
      ]);
      return {
        entity: "floorPass",
        record,
        customers,
        projects: projects.map((project) => ({ id: project.id, label: project.title, customerId: project.customerId })),
      };
    }
    case "tool":
      return { entity: "tool", record: recordId ? await first(db.select().from(schema.tool).where(eq(schema.tool.id, recordId)).limit(1)) : null };
    case "subscription": {
      const [settings, customers, subscriptions] = await Promise.all([getSettings(), customerOptions(), allSubscriptions()]);
      return {
        entity: "subscription",
        record: subscriptions.find((item) => item.id === recordId) ?? null,
        customers,
        minTermMonths: settings.subscriptions.minTermMonths,
        slotsTotal: settings.contingent.subscriptionSlots,
        slotsUsedByOthers: subscriptionSlotsUsed(subscriptions.filter((item) => item.id !== recordId)),
      };
    }
    case "partner":
      return { entity: "partner", record: recordId ? await first(db.select().from(schema.partner).where(eq(schema.partner.id, recordId)).limit(1)) : null };
    case "officeHour": {
      const settings = await getSettings();
      return {
        entity: "officeHour",
        record: recordId ? await first(db.select().from(schema.officeHour).where(eq(schema.officeHour.id, recordId)).limit(1)) : null,
        defaultTime: settings.officeHours.time,
        defaultDuration: settings.officeHours.durationMinutes,
      };
    }
    case "rental": {
      const [customers, tools] = await Promise.all([customerOptions(), allTools()]);
      return {
        entity: "rental",
        toolId: tools.some((tool) => tool.id === recordId) ? recordId : null,
        tools: tools.filter((tool) => tool.status !== "ausgemustert").map((tool) => ({ id: tool.id, label: tool.name, meta: tool.category ?? undefined })),
        customers,
      };
    }
  }
}

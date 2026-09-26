"use server";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { SLOT_BOOKED_STATUSES } from "@/lib/business/contingent";
import { assertAdmin, failure, logActionError, revalidateWerkbank, SAVE_FAILED } from "../guard";
import { describeLeadPayload } from "../lead-payload";
import {
  customerInputSchema,
  fieldErrors,
  floorPassInputSchema,
  idSchema,
  leadStatusSchema,
  partnerInputSchema,
  projectInputSchema,
  subscriptionInputSchema,
  toolInputSchema,
  type CustomerInput,
  type FloorPassInput,
  type PartnerInput,
  type ProjectInput,
  type SubscriptionInput,
  type ToolInput,
} from "../schemas";
import type { ActionResult } from "../types";

// Mutations for customers, projects, floor passes, subscriptions, partners, tools and leads.

const INVALID = "Bitte prüf die markierten Felder.";

type Saved = ActionResult<{ id: string }>;

function checkId(id: string): string | null {
  const parsed = idSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

async function run(scope: string, work: () => Promise<void>): Promise<string | null> {
  try {
    await work();
    return null;
  } catch (error) {
    logActionError(scope, error);
    return SAVE_FAILED;
  }
}

// ---- Customers -----------------------------------------------------------------------------------

export async function saveCustomer(input: CustomerInput): Promise<Saved> {
  await assertAdmin();
  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("saveCustomer", async () => {
    if (existingId) await getDb().update(schema.customer).set({ ...values, updatedAt: now }).where(eq(schema.customer.id, id));
    else await getDb().insert(schema.customer).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank();
  return { ok: true, message: existingId ? "Kunde gespeichert." : "Kunde angelegt.", data: { id } };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiger Kunde.");
  await getDb().delete(schema.customer).where(eq(schema.customer.id, valid));
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Kunde gelöscht. Verknüpfte Projekte und Termine bleiben erhalten." };
}

// ---- Projects ------------------------------------------------------------------------------------

export async function saveProject(input: ProjectInput): Promise<Saved> {
  await assertAdmin();
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("saveProject", async () => {
    if (existingId) await getDb().update(schema.project).set({ ...values, updatedAt: now }).where(eq(schema.project.id, id));
    else await getDb().insert(schema.project).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank({ publicSite: true });
  const booked = values.slotYear !== null && SLOT_BOOKED_STATUSES.has(values.status);
  return {
    ok: true,
    message: `${existingId ? "Projekt gespeichert." : "Projekt angelegt."}${booked ? " Der Zähler auf der Website ist aktualisiert." : ""}`,
    data: { id },
  };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiges Projekt.");
  await getDb().delete(schema.project).where(eq(schema.project.id, valid));
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Projekt gelöscht." };
}

// ---- Floor passes --------------------------------------------------------------------------------

export async function saveFloorPass(input: FloorPassInput): Promise<Saved> {
  await assertAdmin();
  const parsed = floorPassInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("saveFloorPass", async () => {
    if (existingId) await getDb().update(schema.floorPass).set({ ...values, updatedAt: now }).where(eq(schema.floorPass.id, id));
    else await getDb().insert(schema.floorPass).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank();
  return { ok: true, message: existingId ? "Boden-Pass gespeichert." : "Boden-Pass angelegt.", data: { id } };
}

export async function deleteFloorPass(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiger Boden-Pass.");
  await getDb().delete(schema.floorPass).where(eq(schema.floorPass.id, valid));
  revalidateWerkbank();
  return { ok: true, message: "Boden-Pass gelöscht." };
}

// ---- Subscriptions -------------------------------------------------------------------------------

export async function saveSubscription(input: SubscriptionInput): Promise<Saved> {
  await assertAdmin();
  const parsed = subscriptionInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("saveSubscription", async () => {
    if (existingId) await getDb().update(schema.subscription).set({ ...values, updatedAt: now }).where(eq(schema.subscription.id, id));
    else await getDb().insert(schema.subscription).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: existingId ? "Abo gespeichert." : "Abo angelegt.", data: { id } };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiges Abo.");
  await getDb().delete(schema.subscription).where(eq(schema.subscription.id, valid));
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Abo gelöscht." };
}

// ---- Partners ------------------------------------------------------------------------------------

export async function savePartner(input: PartnerInput): Promise<Saved> {
  await assertAdmin();
  const parsed = partnerInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("savePartner", async () => {
    if (existingId) await getDb().update(schema.partner).set({ ...values, updatedAt: now }).where(eq(schema.partner.id, id));
    else await getDb().insert(schema.partner).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank({ publicSite: true });
  const unlocks = values.isMasterPartner && values.status === "aktiv";
  return {
    ok: true,
    message: `${existingId ? "Partner gespeichert." : "Partner angelegt."}${unlocks ? " Die Meister-Leistungen erscheinen jetzt auf der Website." : ""}`,
    data: { id },
  };
}

export async function deletePartner(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiger Partner.");
  await getDb().delete(schema.partner).where(eq(schema.partner.id, valid));
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Partner gelöscht." };
}

// ---- Tools ---------------------------------------------------------------------------------------

export async function saveTool(input: ToolInput): Promise<Saved> {
  await assertAdmin();
  const parsed = toolInputSchema.safeParse(input);
  if (!parsed.success) return failure(INVALID, fieldErrors(parsed.error));
  const { id: existingId, ...values } = parsed.data;
  const id = existingId ?? crypto.randomUUID();
  const now = new Date();
  const error = await run("saveTool", async () => {
    if (existingId) await getDb().update(schema.tool).set({ ...values, updatedAt: now }).where(eq(schema.tool.id, id));
    else await getDb().insert(schema.tool).values({ id, ...values, createdAt: now, updatedAt: now });
  });
  if (error) return failure(error);
  revalidateWerkbank();
  return { ok: true, message: existingId ? "Werkzeug gespeichert." : "Werkzeug angelegt.", data: { id } };
}

export async function deleteTool(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültiges Werkzeug.");
  await getDb().delete(schema.tool).where(eq(schema.tool.id, valid));
  revalidateWerkbank();
  return { ok: true, message: "Werkzeug gelöscht. Seine Termine bleiben im Kalender." };
}

// ---- Leads ---------------------------------------------------------------------------------------

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  const parsed = leadStatusSchema.safeParse(status);
  if (!valid || !parsed.success) return failure("Ungültiger Status.");
  await getDb().update(schema.lead).set({ status: parsed.data, updatedAt: new Date() }).where(eq(schema.lead.id, valid));
  revalidateWerkbank();
  return { ok: true, message: "Status geändert." };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültige Anfrage.");
  await getDb().delete(schema.lead).where(eq(schema.lead.id, valid));
  revalidateWerkbank();
  return { ok: true, message: "Anfrage gelöscht." };
}

/** Creates (or finds by e-mail) the customer for a lead and links both. Idempotent. */
export async function convertLeadToCustomer(id: string): Promise<ActionResult<{ customerId: string; created: boolean }>> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültige Anfrage.");
  const db = getDb();
  const [lead] = await db.select().from(schema.lead).where(eq(schema.lead.id, valid)).limit(1);
  if (!lead) return failure("Diese Anfrage gibt es nicht mehr.");
  if (lead.customerId) return { ok: true, message: "Die Anfrage ist schon mit einem Kunden verknüpft.", data: { customerId: lead.customerId, created: false } };

  const now = new Date();
  const [existing] = await db
    .select({ id: schema.customer.id })
    .from(schema.customer)
    .where(sql`lower(${schema.customer.email}) = ${lead.email.toLowerCase()}`)
    .limit(1);
  const view = describeLeadPayload(lead.kind, lead.payload);
  let customerId = existing?.id ?? null;
  const created = !customerId;
  const error = await run("convertLeadToCustomer", async () => {
    if (!customerId) {
      customerId = crypto.randomUUID();
      await db.insert(schema.customer).values({
        id: customerId,
        name: lead.kind === "partner" && view.company ? view.company : lead.name,
        kind: lead.kind === "partner" ? "partner" : view.company ? "gewerbe" : "privat",
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        postalCode: lead.postalCode,
        notes: lead.kind === "partner" && view.company ? `Ansprechpartner: ${lead.name}` : null,
        createdAt: now,
        updatedAt: now,
      });
    }
    await db
      .update(schema.lead)
      .set({ customerId, status: lead.status === "neu" ? "in-arbeit" : lead.status, updatedAt: now })
      .where(eq(schema.lead.id, lead.id));
  });
  if (error || !customerId) return failure(error ?? SAVE_FAILED);
  revalidateWerkbank();
  return {
    ok: true,
    message: created ? "Kunde angelegt und mit der Anfrage verknüpft." : "Bestehenden Kunden mit gleicher E-Mail verknüpft.",
    data: { customerId, created },
  };
}

/** Turns a partner application into a partner record (status "Bewerbung"). */
export async function createPartnerFromLead(id: string): Promise<ActionResult<{ partnerId: string }>> {
  await assertAdmin();
  const valid = checkId(id);
  if (!valid) return failure("Ungültige Anfrage.");
  const db = getDb();
  const [lead] = await db.select().from(schema.lead).where(eq(schema.lead.id, valid)).limit(1);
  if (!lead) return failure("Diese Anfrage gibt es nicht mehr.");
  if (lead.kind !== "partner") return failure("Nur Partner-Bewerbungen lassen sich als Partner anlegen.");
  const email = lead.email.toLowerCase();
  const [existing] = await db.select({ id: schema.partner.id }).from(schema.partner).where(eq(schema.partner.email, email)).limit(1);
  if (existing) return { ok: true, message: "Diesen Partner gibt es schon.", data: { partnerId: existing.id } };

  const payload = (lead.payload ?? {}) as Record<string, unknown>;
  const view = describeLeadPayload(lead.kind, lead.payload);
  const needs = Array.isArray(payload.needs) ? payload.needs.filter((item): item is string => typeof item === "string") : [];
  const partnerId = crypto.randomUUID();
  const now = new Date();
  const error = await run("createPartnerFromLead", async () => {
    await db.insert(schema.partner).values({
      id: partnerId,
      company: view.company ?? lead.name,
      contactName: lead.name,
      email,
      phone: lead.phone,
      trade: typeof payload.trade === "string" ? payload.trade : null,
      region: typeof payload.region === "string" ? payload.region : null,
      isMasterPartner: view.isMasterBusiness,
      status: "bewerbung",
      notes: [needs.length > 0 ? `Wünscht: ${needs.join(", ")}` : null, lead.message].filter(Boolean).join("\n") || null,
      createdAt: now,
      updatedAt: now,
    });
    if (lead.status === "neu") await db.update(schema.lead).set({ status: "in-arbeit", updatedAt: now }).where(eq(schema.lead.id, lead.id));
  });
  if (error) return failure(error);
  revalidateWerkbank({ publicSite: true });
  return { ok: true, message: "Partner angelegt (Status: Bewerbung).", data: { partnerId } };
}

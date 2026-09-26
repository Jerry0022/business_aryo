"use client";

import { createContext, useContext } from "react";
import type { EntityKind } from "@/lib/werkbank/actions/records";
import type { RecordRef } from "@/lib/werkbank/types";

// Context of the Werkbank shell: drawer stack and toasts (provided by WerkbankProvider).

export interface EventPrefill {
  type?: string;
  date?: string;
  endDate?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  title?: string;
  location?: string;
  notes?: string;
  customerId?: string | null;
  projectId?: string | null;
  leadId?: string | null;
  toolId?: string | null;
  officeHourId?: string | null;
  subscriptionId?: string | null;
  floorPassId?: string | null;
}

export type EntityPrefill = Record<string, string | number | boolean | null | undefined>;

export type DrawerView =
  | { type: "record"; ref: RecordRef }
  | { type: "eventForm"; eventId?: string | null; prefill?: EventPrefill }
  | { type: "entityForm"; entity: EntityKind; id?: string | null; prefill?: EntityPrefill }
  | { type: "virtualOfficeHour"; startsAt: string; topic: string; durationMinutes: number };

export interface WerkbankContextValue {
  stack: DrawerView[];
  version: number;
  open: (view: DrawerView) => void;
  push: (view: DrawerView) => void;
  back: () => void;
  close: () => void;
  /** After saving a form: show the saved record (or return to it when it is below in the stack). */
  showSaved: (ref: RecordRef) => void;
  /** After deleting the record on top. */
  afterDelete: () => void;
  refresh: () => void;
  toast: (message: string, tone?: "ok" | "error") => void;
}

export const WerkbankContext = createContext<WerkbankContextValue | null>(null);

export function useWerkbank(): WerkbankContextValue {
  const value = useContext(WerkbankContext);
  if (!value) throw new Error("useWerkbank must be used inside <WerkbankProvider>");
  return value;
}

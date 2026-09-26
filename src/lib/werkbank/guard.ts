import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { WERKBANK_PATH } from "./constants";

// Shared helpers for the Werkbank server actions.

/** Every server action is reachable by a direct POST, so each one checks the admin session. */
export async function assertAdmin() {
  return requireAdmin();
}

/**
 * Re-renders the Werkbank after a mutation. `publicSite` also refreshes the landing page, whose
 * counters, prices and services are computed from these records.
 */
export function revalidateWerkbank(options: { publicSite?: boolean; studio?: boolean } = {}) {
  revalidatePath(WERKBANK_PATH, "layout");
  if (options.publicSite) revalidatePath("/");
  if (options.studio) revalidatePath("/studio", "layout");
}

export function failure(message: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, message, fieldErrors };
}

export const SAVE_FAILED = "Das Speichern hat nicht geklappt. Bitte versuch es noch einmal.";

export function logActionError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[werkbank] ${scope}: ${message}`);
}

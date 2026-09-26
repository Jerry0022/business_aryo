"use client";

import { useCallback, useTransition } from "react";
import type { ActionResult } from "@/lib/werkbank/types";
import { useWerkbank } from "./context";

/** Runs a server action inside a transition and reports the result as a toast. */
export function useAction() {
  const { toast } = useWerkbank();
  const [pending, startTransition] = useTransition();
  const run = useCallback(
    <T>(action: () => Promise<ActionResult<T>>, onDone?: (result: Extract<ActionResult<T>, { ok: true }>) => void, onError?: (result: Extract<ActionResult<T>, { ok: false }>) => void) => {
      startTransition(async () => {
        let result: ActionResult<T>;
        try {
          result = await action();
        } catch {
          toast("Das hat gerade nicht geklappt. Bitte lade die Seite neu und versuch es noch einmal.", "error");
          return;
        }
        if (result.ok) {
          if (result.message) toast(result.message);
          onDone?.(result);
        } else {
          if (onError) onError(result);
          else toast(result.message, "error");
        }
      });
    },
    [toast],
  );
  return { pending, run };
}

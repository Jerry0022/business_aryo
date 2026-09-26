"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => undefined;

/** False during SSR and the first hydration pass, true once the client has taken over. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

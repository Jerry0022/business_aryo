"use client";

import { useSyncExternalStore } from "react";
import { detectInstallPlatform, isManualInstallPlatform, isStandalone, type InstallPlatform } from "./platform";

/** Chromium's install event (not in the TypeScript DOM lib). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallState {
  /** False on the server and during hydration. */
  ready: boolean;
  platform: InstallPlatform;
  /** Already running as an installed app, or installed during this visit. */
  installed: boolean;
  /** The native install dialog can be opened right now. */
  canPrompt: boolean;
}

const SERVER_STATE: InstallState = { ready: false, platform: "unsupported", installed: false, canPrompt: false };

let state: InstallState = SERVER_STATE;
let deferred: BeforeInstallPromptEvent | null = null;
let initialised = false;
const listeners = new Set<() => void>();

function update(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  deferred = window.__aryoInstallPrompt ?? null;
  state = {
    ready: true,
    platform: detectInstallPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
    installed: isStandalone(),
    canPrompt: deferred !== null,
  };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    update({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    update({ installed: true, canPrompt: false });
  });
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  init();
  return state;
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/** Install is possible here: via the native dialog, or with instructions where browsers have none. */
export function isInstallable(s: InstallState): boolean {
  return s.ready && !s.installed && (s.canPrompt || isManualInstallPlatform(s.platform));
}

/**
 * Opens the browser's own install dialog. Resolves to the user's choice, or `"unavailable"` when the
 * browser offers no dialog (then show instructions instead). The event can only be used once.
 */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferred;
  if (!event) return "unavailable";
  deferred = null;
  window.__aryoInstallPrompt = null;
  update({ canPrompt: false });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") update({ installed: true });
    return outcome;
  } catch {
    return "unavailable";
  }
}

import type { BeforeInstallPromptEvent } from "./install-store";

declare global {
  interface Window {
    /** Set by the inline capture script in the root layout (the event can fire before React loads). */
    __aryoInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Inline script for `<head>`: captures `beforeinstallprompt` before the app bundle has loaded, so the
 * native install dialog can still be opened later from a button. Kept out of the client module so the
 * server layout receives the plain string.
 */
export const CAPTURE_INSTALL_PROMPT_SCRIPT =
  "addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__aryoInstallPrompt=e});" +
  "addEventListener('appinstalled',function(){window.__aryoInstallPrompt=null})";

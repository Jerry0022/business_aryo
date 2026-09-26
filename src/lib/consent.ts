// Cookie consent: the visitor's choice is stored in a first-party cookie. Bump
// CONSENT_VERSION when new consent-requiring services are added to ask everyone again.
export const CONSENT_COOKIE = "cookie_consent";
export const CONSENT_VERSION = 1;
/** Re-ask after 12 months. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentChoice = "granted" | "denied";
/** `unknown` = no (valid) decision yet, `pending` = not readable yet (server render / hydration). */
export type ConsentState = ConsentChoice | "unknown" | "pending";

export function parseConsent(cookieHeader: string): ConsentChoice | "unknown" {
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name !== CONSENT_COOKIE) continue;
    const [version, choice] = decodeURIComponent(rest.join("=")).split(".");
    if (Number(version) === CONSENT_VERSION && (choice === "granted" || choice === "denied")) return choice;
  }
  return "unknown";
}

export function serializeConsent(choice: ConsentChoice, secure: boolean): string {
  return [
    `${CONSENT_COOKIE}=${CONSENT_VERSION}.${choice}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

// --- client store (useSyncExternalStore) ---

const listeners = new Set<() => void>();
let settingsOpen = false;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readConsent(): ConsentState {
  return typeof document === "undefined" ? "pending" : parseConsent(document.cookie);
}

export function writeConsent(choice: ConsentChoice) {
  document.cookie = serializeConsent(choice, window.location.protocol === "https:");
  settingsOpen = false;
  emit();
}

export function isConsentSettingsOpen() {
  return settingsOpen;
}

export function openConsentSettings() {
  settingsOpen = true;
  emit();
}

/** Mini-Aryo mentions the app at most once in this interval. */
export const NUDGE_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;
export const NUDGE_STORAGE_KEY = "aryo:app-hint-shown-at";

export function isNudgeDue(lastShownAt: number | null, now: number): boolean {
  if (lastShownAt === null || !Number.isFinite(lastShownAt)) return true;
  // A timestamp in the future (clock changed) must not block the hint forever.
  if (lastShownAt > now) return true;
  return now - lastShownAt >= NUDGE_INTERVAL_MS;
}

// Storage can throw (private mode, blocked site data); the hint then simply shows once per visit.
export function readLastShownAt(): number | null {
  try {
    const raw = window.localStorage.getItem(NUDGE_STORAGE_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

export function writeLastShownAt(now: number): void {
  try {
    window.localStorage.setItem(NUDGE_STORAGE_KEY, String(now));
  } catch {
    // ignore
  }
}

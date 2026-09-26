import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (hashing first makes lengths equal). */
export function secureCompare(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

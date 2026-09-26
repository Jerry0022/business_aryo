import { DEFAULT_ADMIN_EMAIL } from "@/config/site";

/** Parses a comma-separated e-mail list into normalized (trimmed, lower-case) addresses. */
export function parseEmailList(raw: string | undefined | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/** Admin e-mails from ADMIN_EMAILS, falling back to the business owner's address. */
export function getAdminEmails(env: NodeJS.ProcessEnv = process.env): string[] {
  const parsed = parseEmailList(env.ADMIN_EMAILS);
  return parsed.length > 0 ? parsed : [DEFAULT_ADMIN_EMAIL];
}

/** Main admins are always promoted to `admin` and cannot be banned, demoted or deleted. */
export function isMainAdminEmail(email: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!email) return false;
  return getAdminEmails(env).includes(email.trim().toLowerCase());
}

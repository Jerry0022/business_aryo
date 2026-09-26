import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { isMainAdminEmail } from "./admin-config";
import { resolveBaseURL, resolveTrustedOrigins } from "./base-url";

/** Admin endpoints that must never target a main admin (ban, demote, delete, take over). */
const MAIN_ADMIN_GUARDED_PATHS = new Set([
  "/admin/set-role",
  "/admin/ban-user",
  "/admin/remove-user",
  "/admin/set-user-password",
  "/admin/update-user",
  "/admin/impersonate-user",
  "/admin/revoke-user-sessions",
]);

export const MIN_PASSWORD_LENGTH = 10;

function createAuth() {
  return betterAuth({
    appName: "Aryo Sabouri Studio",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: resolveBaseURL(),
    trustedOrigins: resolveTrustedOrigins(),
    database: drizzleAdapter(getDb(), { provider: "pg", schema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      // Accounts are created by an admin in the Nutzerverwaltung (or once via /einrichten).
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    rateLimit: {
      enabled: process.env.NODE_ENV === "production",
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (isMainAdminEmail(user.email)) {
              return { data: { ...user, role: "admin" } };
            }
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!MAIN_ADMIN_GUARDED_PATHS.has(ctx.path)) return;
        const userId: unknown = ctx.body?.userId;
        if (typeof userId !== "string") return;
        const [target] = await getDb()
          .select({ email: schema.user.email })
          .from(schema.user)
          .where(eq(schema.user.id, userId))
          .limit(1);
        if (!target || !isMainAdminEmail(target.email)) return;
        if (ctx.path === "/admin/set-role" && ctx.body?.role === "admin") return;
        throw new APIError("FORBIDDEN", {
          message: "Der Haupt-Administrator ist geschützt und kann nicht geändert, gesperrt oder gelöscht werden.",
        });
      }),
    },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];

const globalForAuth = globalThis as unknown as { __auth?: Auth };

/** Lazily created so builds without a database (CI, static pages) never connect. */
export function getAuth(): Auth {
  globalForAuth.__auth ??= createAuth();
  return globalForAuth.__auth;
}

#!/usr/bin/env node
// Applies the SQL migrations in ./drizzle to DATABASE_URL.
// Supports Postgres/Neon URLs and local embedded PGlite (pglite://<dir> or pglite://memory).
// Usage: node scripts/migrate.mjs [--fresh]   (--fresh wipes a local PGlite directory first)
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const migrationsFolder = path.resolve("drizzle");
const vercelEnv = process.env.VERCEL ? process.env.VERCEL_ENV ?? "production" : null;

// On Vercel only production builds migrate: preview deployments may share the production
// database, and an unmerged branch must not change its schema. Set MIGRATE_ON_PREVIEW=1 when
// previews get their own Neon branch.
if (vercelEnv && vercelEnv !== "production" && process.env.MIGRATE_ON_PREVIEW !== "1") {
  console.log(`[migrate] Vercel ${vercelEnv} build — skipping migrations (set MIGRATE_ON_PREVIEW=1 to enable).`);
  process.exit(0);
}

if (!url) {
  if (vercelEnv === "production") {
    console.error("[migrate] DATABASE_URL is missing. Connect the Neon integration to this Vercel project (Storage → Neon).");
    process.exit(1);
  }
  console.log("[migrate] DATABASE_URL not set — skipping migrations.");
  process.exit(0);
}

if (url.startsWith("pglite://")) {
  const location = url.slice("pglite://".length);
  if (location !== "memory") {
    if (process.argv.includes("--fresh")) rmSync(path.resolve(location), { recursive: true, force: true });
    mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = location === "memory" ? new PGlite() : new PGlite(path.resolve(location));
  await migrate(drizzle(client), { migrationsFolder });
  await client.close();
  console.log(`[migrate] PGlite (${location}) is up to date.`);
} else {
  const { default: pg } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
    console.log("[migrate] Postgres is up to date.");
  } finally {
    await pool.end();
  }
}

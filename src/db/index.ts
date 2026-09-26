import "server-only";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const PGLITE_PREFIX = "pglite://";

const globalForDb = globalThis as unknown as { __database?: Database };

function createPgliteDatabase(location: string): Database {
  // Embedded Postgres for local development and tests. Loaded lazily through
  // a runtime require so production bundles never pull it in.
  const nodeRequire = createRequire(import.meta.url);
  const { PGlite } = nodeRequire("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = nodeRequire("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  if (location === "memory") return drizzlePglite(new PGlite(), { schema }) as unknown as Database;
  const dataDir = path.resolve(location);
  mkdirSync(path.dirname(dataDir), { recursive: true });
  return drizzlePglite(new PGlite(dataDir), { schema }) as unknown as Database;
}

function createDatabase(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. For local development run: cp .env.example .env.local");
  }
  if (url.startsWith(PGLITE_PREFIX)) {
    return createPgliteDatabase(url.slice(PGLITE_PREFIX.length));
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  // Lets Vercel Fluid compute close idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

export function getDb(): Database {
  globalForDb.__database ??= createDatabase();
  return globalForDb.__database;
}

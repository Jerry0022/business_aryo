import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { user } from "@/db/schema";

export async function hasAdminAccount(): Promise<boolean> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.role, "admin"));
  return (row?.count ?? 0) > 0;
}

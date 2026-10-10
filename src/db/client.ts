import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/shared/config/env";
import { relations } from "./relations";

// Server-only Drizzle client over node-postgres. This is the connection the
// booking/seat-hold use-cases run their `db.transaction(...)` blocks on — the
// constraint-backed concurrency (unique (trip_id, seat_number)) lives here, not
// in the supabase-js client. NEVER import this from a file that reaches the
// browser bundle; it needs DATABASE_URL (a server-only secret) and the pg driver.
//
// `relations` (from defineRelations) powers typed `db.query.<table>.findMany`.

declare global {
  // Reuse the pool across hot reloads / route invocations so we don't exhaust
  // Postgres connections during local dev.

  var __louajiPgPool: Pool | undefined;
}

function getPool(): Pool {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Server-only env var required for the Drizzle client " +
        "(API routes / migrations). See .env.example.",
    );
  }
  globalThis.__louajiPgPool ??= new Pool({ connectionString: url, max: 10 });
  return globalThis.__louajiPgPool;
}

export const db = drizzle({ client: getPool(), relations, casing: "snake_case" });

export type Database = typeof db;

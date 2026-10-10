import "dotenv/config";
import type { Config } from "drizzle-kit";
import { env } from "./src/shared/config/env";

// Drizzle owns the entire migration pipeline — authoring, generation, and
// application. Supabase CLI is used only for container lifecycle (db:start,
// db:stop, db:reset); its migration engine is disabled via
// `[db.migrations] enabled = false` in supabase/config.toml.
//
// drizzle-kit v1.0-beta writes each migration to its own folder:
//
//     drizzle/migrations/<timestamp>_<name>/
//       ├─ migration.sql   ← SQL applied by drizzle-kit migrate
//       └─ snapshot.json   ← drizzle's diff state, chained by UUID prevIds
//
// The UUID prevIds chain (no shared _journal.json) is what makes
// parallel-branch migrations merge-conflict-free by design.
//
// Things Drizzle can't express in schema TS (CREATE EXTENSION, CREATE DOMAIN,
// trigger functions) live in hand-authored custom migrations produced via
// `pnpm db:generate:custom --name <name>` (drizzle-kit generate --custom
// emits an empty folder you fill in). The initial one is
// `*_bootstrap_extensions/migration.sql`.
//
// Env: `dotenv/config` populates process.env from .env so the validated
// `env` object (same one the app uses) is available here too. Routing
// DATABASE_URL through `env` keeps process.env out of app/tooling code —
// only `src/shared/config/env.ts` touches process.env directly.

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  casing: "snake_case",
  schemaFilter: ["public"],
  entities: {
    roles: {
      provider: "supabase",
    },
  },
} satisfies Config;

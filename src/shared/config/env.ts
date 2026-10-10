import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Centralized, validated access to all environment variables.
//
// Why this file exists (and not raw `process.env.FOO`):
//   • One schema throws at boot if a required key is missing — beats
//     scattering `if (!process.env.FOO) throw` across call sites.
//   • `clientPrefix: "EXPO_PUBLIC_"` turns "don't import a server secret
//     into the browser bundle" into a type error, not a runtime leak.
//   • Consumers get autocomplete + typed values instead of
//     `string | undefined` from the ambient ProcessEnv.
//
// Expo / Metro constraint: every key in `runtimeEnv` MUST be accessed
// statically as `process.env.FOO`. Babel-preset-expo inlines literal
// `EXPO_PUBLIC_*` references at build time; a spread or dynamic key
// would erase that inlining and break the web bundle. This is the same
// reason `env.d.ts` exists — do not replace the access pattern below.
//
// Louaji v1 runs a deliberately lean external surface: Supabase + an SMS
// provider (phone OTP). Payment / maps / analytics vendors are FUTURE and
// their keys are added when those features are built.

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",

  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  server: {
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional(),

    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),

    // SMS / OTP provider (Twilio Verify) — phone-first auth + booking SMS.
    // Server-only; never bundled to the client. See docs/TECHNOLOGIES.md.
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_VERIFY_SERVICE_SID: z.string().min(1).optional(),
    // Sender number (or Messaging Service SID) for transactional SMS
    // (booking confirmation / trip cancellation). Server-only.
    TWILIO_FROM: z.string().min(1).optional(),

    // Supabase CLI / ops context.
    SUPABASE_ACCESS_TOKEN: z.string().min(1).optional(),
    SUPABASE_PROJECT_REF: z.string().min(1).optional(),
    SUPABASE_PROJECT_ID: z.string().min(1).optional(),
    SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  },

  client: {
    EXPO_PUBLIC_SUPABASE_URL: z.url(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },

  // Static `process.env.FOO` accesses — required for Babel inlining of
  // EXPO_PUBLIC_* on web and for Expo's `no-dynamic-env-var` ESLint rule.
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,

    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
    TWILIO_FROM: process.env.TWILIO_FROM,

    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
    SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
    SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
  },

  emptyStringAsUndefined: true,

  // CI escape hatch. `drizzle-kit migrate` jobs (local ephemeral Postgres,
  // staging, production) only need DATABASE_URL — booting the full schema
  // would crash on missing EXPO_PUBLIC_* keys the migration never touches.
  // When skipped, reads go straight through to `runtimeEnv` without Zod
  // parsing; Zod defaults do NOT apply (t3-env/#266).
  //
  // MUST NEVER be set in app-runtime env vars (EAS Hosting production /
  // preview aliases, local `.env`). The only legitimate setters are the
  // three GitHub workflows that run `pnpm db:migrate`.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

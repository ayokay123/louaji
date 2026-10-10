// Typed declarations for `process.env` so static access (`process.env.FOO`)
// satisfies both Expo's `no-dynamic-env-var` ESLint rule (needed for Metro
// to statically inline EXPO_PUBLIC_* values into the client bundle) and
// TypeScript's `noPropertyAccessFromIndexSignature`. Keep in sync with
// `.env.example`.

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";

    // CI-only escape hatch for `@t3-oss/env-core` validation. Set only
    // by the GitHub workflows running `pnpm db:migrate`. Never set
    // at app runtime — see `src/shared/config/env.ts`.
    SKIP_ENV_VALIDATION?: string;

    // Supabase — EXPO_PUBLIC_* are bundled to the client; the rest are server-only.
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    DATABASE_URL?: string;

    // SMS / OTP provider (Twilio Verify) — server-only.
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_VERIFY_SERVICE_SID?: string;
    TWILIO_FROM?: string;

    // Supabase CLI / CI
    SUPABASE_ACCESS_TOKEN?: string;
    SUPABASE_PROJECT_REF?: string;
    SUPABASE_PROJECT_ID?: string;
    SUPABASE_DB_PASSWORD?: string;
  }
}

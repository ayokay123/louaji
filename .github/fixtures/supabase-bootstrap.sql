-- CI-only Supabase shape stubs.
--
-- Makes `drizzle-kit migrate` succeed against an ephemeral plain Postgres
-- in the PR migration dry-run workflow. Staging and production already
-- have these objects (created by Supabase at project bootstrap); this
-- file is never applied there.
--
-- Covers the exact set of Supabase-owned symbols the generated migration
-- references:
--   • roles        `anon`, `authenticated`, `service_role`   (policy `TO`)
--   • schema       `auth`                                    (FK target)
--   • table        `auth.users(id uuid)`                     (FK target)
--   • function     `auth.uid() RETURNS uuid`                 (policy expr)
--
-- Nothing else is emitted by drizzle-orm/supabase in our current schema —
-- confirmed against the generated migration + drizzle source. If a future
-- schema imports `realtime.*` or `supabase_auth_admin`, extend this file.

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULL::uuid $$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

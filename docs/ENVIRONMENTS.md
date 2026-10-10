# Louaji — Environments, Branching & CI/CD

> Source of truth for **how we ship code**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's environments doc. The branching model, CI/CD pipeline, and migration workflow are infra and carry over unchanged; only product naming and the secrets list change.

> **Naming follow-up (code task, not docs):** the scaffold still carries the previous project's identifiers — `project_id = "hunvagy"` in [supabase/config.toml](../supabase/config.toml) (load-bearing: it names the Docker containers), the Expo org/project name, and the `hunvagy.com` domains. Renaming these to `louaji` (and registering the real domain — `louaji.tn` is used below as the intended placeholder) is part of the code-pivot follow-up, not this docs pass. Until then, the names below are the **intended** target.

### 1. Environments

| Env            | Supabase                                     | URL (intended)      | Purpose                                     |
| -------------- | -------------------------------------------- | ------------------- | ------------------------------------------- |
| **Local**      | Docker via Supabase CLI (per dev)            | `localhost:8081`    | Each dev runs their own local stack.        |
| **Staging**    | Supabase cloud, separate project (Free tier) | `staging.louaji.tn` | Integration testing, pre-prod verification. |
| **Production** | Supabase cloud, separate project (Pro tier)  | `louaji.tn`         | Live traffic.                               |

The three Supabase projects are **fully separate** — no shared schemas, data, or auth users. Migrations are applied to each environment independently via CI.

### 2. Expo project topology

- **One Expo organization** (target name: `louaji`).
- **One Expo project** inside it.
- **Two deployment aliases** on EAS Hosting: `preview` → staging, `production` → production.
- **Custom domain** on production; **subdomain CNAME** for staging.

### 3. Environment variables

Set per environment in the EAS dashboard (NOT committed):

- `EXPO_PUBLIC_*` — exposed to the client bundle. Non-secret only: Supabase URL, Supabase anon key, public config.
- **Sensitive (server-only, never bundled):** Supabase service-role key, **SMS provider key/secret** (e.g. Twilio account SID + auth token), and — when scoped (`FUTURE`) — the payment-gateway secret and Google Maps key.

Local dev: each dev keeps their own `.env.local` (gitignored). `.env.example` in the repo is the canonical list of required keys.

### 4. Git branching

Three long-lived branches:

```
development  ──► staging  ──► production
     ▲
     │
   feature/*   (always branched from development, always merged back to development)
```

- **`development`** — base branch. All feature branches start here and merge back here.
- **`staging`** — receives PRs from `development`; deploys to staging on merge.
- **`production`** — receives PRs from `staging`; deploys to production on merge.

**Hard rules:** feature branches never branch off `staging`/`production`; hotfixes follow the same flow (branch off `development`, fast-track through `staging` to `production`); no direct pushes to `staging`/`production` — only PRs from the previous branch.

### 5. CI/CD

GitHub Environments (`staging`, `production`) scope secrets per branch so one workflow file resolves different values per target. All workflows run on Blacksmith (`runs-on: blacksmith-4vcpu-ubuntu-2404`); the Blacksmith GitHub App install is a hard prerequisite — without it jobs stay queued. Upstream `actions/setup-node` is used.

**Pipeline (workflow files in [.github/workflows/](../.github/workflows/)):**

| File                       | Trigger                                                                                                  | What it does                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pr-checks.yml`            | PR into `development`/`staging`/`production`                                                             | `lint-and-typecheck` (every PR): `format:check` → `lint` → `typecheck`. `build-web` (PRs into `staging`/`production` only): `expo export --platform web` to catch bundler/Metro/NativeWind/env errors typecheck misses. |
| `pr-migration-dry-run.yml` | PR into `staging`/`production`, when `drizzle/migrations/**`, `src/db/**`, or `drizzle.config.ts` change | Spins up an ephemeral `postgis/postgis:17-3.5` container and runs `pnpm db:migrate` from scratch. PR blocked if any migration fails to apply.                                                                           |
| `deploy-staging.yml`       | Push to `staging` (post-merge)                                                                           | `pnpm db:migrate` against staging Postgres via `DATABASE_URL`, then deploy to EAS Hosting `preview` alias.                                                                                                              |
| `deploy-production.yml`    | Push to `production` (post-merge)                                                                        | `pnpm db:migrate` against production Postgres via `DATABASE_URL`, then deploy to EAS Hosting `production` alias.                                                                                                        |

**Migration engine.** Drizzle owns the entire pipeline — authoring (`src/db/schemas/*.ts`), generation (`drizzle-kit generate` / `--custom`), application (`drizzle-kit migrate`). Supabase CLI is container-lifecycle only; `[db.migrations] enabled = false` disables its migration engine. Staging/production never run Supabase CLI — CI connects straight to Postgres over `DATABASE_URL`.

**Concurrency.** PR workflows cancel previous in-progress runs for the same PR. Deploy workflows do **not** cancel — interrupting `drizzle-kit migrate` mid-transaction is worse than waiting.

### 6. Workflow for a database change

1. Edit `src/db/schemas/<table>.ts` (and `relations.ts` if needed).
2. `pnpm db:generate --name add_foo` → `drizzle/migrations/<timestamp>_add_foo/{migration.sql,snapshot.json}`. For things drizzle can't express (extensions, domains, trigger functions, the **seat-hold uniqueness/exclusion constraints**) use `pnpm db:generate:custom --name add_foo` and hand-author the SQL.
3. `pnpm db:reset` locally — `supabase db reset` (wipe) then `drizzle-kit migrate` (replay all).
4. Commit schema change **and** migration folder in one commit on a feature branch off `development`. Never hand-edit a generated migration — delete the folder and regenerate.
5. PR → `development`. After merge, flow through `staging`/`production` PRs (only those run the dry-run).

### 7. Workflow for a code-only change

1. Branch off `development`. 2. Implement, push, PR → `development`. 3. When ready to release, PR `development → staging`, then `staging → production`.

### 8. Required GitHub secrets / Actions context

Each GitHub Environment (`staging`, `production`) carries its own:

- `DATABASE_URL` — Supabase Postgres connection string (pooler URL with the `postgres` role password) for `drizzle-kit migrate`.
- `EXPO_TOKEN` — for `eas-cli deploy`.

No Supabase CLI secrets in CI — migrations run directly against Postgres over `DATABASE_URL`. Runtime service secrets (SMS provider, future payment gateway) are NOT injected through GitHub — they're set in the EAS dashboard as sensitive variables and read at runtime by the deployed app.

### 9. Native builds (later)

- **EAS Build + EAS Submit** for iOS/Android once we ship native apps. Same three-alias pattern (`preview` for staging, `production` for production). iOS → App Store Connect, Android → Google Play, both via EAS Submit. Native release branching follows the same `development → staging → production` flow.

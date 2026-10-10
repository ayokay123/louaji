# CLAUDE.md — Louaji Project Entry Point

> **READ THIS FILE FIRST AT THE START OF EVERY SESSION.**
> This is the master index for the Louaji project. It points to all the other authoritative documents that describe what we are building, how, and why.

---

## 2026-05-28 — Original entry (Louaji)

> **This entry establishes the Louaji baseline.** The project pivoted from a location-based social platform to **Louaji**, a louage seat-reservation platform; the previous product's documentation was replaced wholesale. Prior history remains in git. From this baseline forward, the append-only rule below is binding.

### Purpose

**Louaji** ("وصلك في وقتو" — _gets you there on time_) is a platform to **search intercity louage (Tunisian shared-van) departures and reserve seats** ahead of arriving at the station. It has a **passenger app**, an **operator admin** side for transport companies and independent drivers, and a **platform super-admin**. **v1 (first release) = web only** (Expo + React Native for Web, deployed on EAS Hosting). Native iOS/Android and every `FUTURE`-tagged feature in the SRS belong to later releases whose scope and ordering are not committed yet. The product is Arabic-first (RTL), with French and English.

### Author & roles

- **Constantin** — lead developer. Owns the SRS and this documentation, makes project-level engineering decisions. There is no separate product owner role.
- **Claude** — AI coding agent. Reads this file first in every session, then loads the docs relevant to the task.

### How this documentation system works

1. **`CLAUDE.md`** (this file, in repo root) — entry point and index. Always read first.
2. **`docs/`** folder — topic-specific documents that `CLAUDE.md` points to.

### The append-only rule (applies to ALL `.md` files in this system, including this one)

This rule is binding from the 2026-05-28 Louaji baseline onward (each document's first Louaji section is its locked starting point):

- **Never modify or delete content in prior dated sections.** Those sections are immutable history.
- When something **new** is added or something **changes**, append a new dated section _below_ the existing content.
- Every section begins with a heading of the form `## YYYY-MM-DD — <short title>`.
- If a later section supersedes or contradicts earlier content, say so explicitly inside the new section (e.g., _"Supersedes the X decision from 2026-05-28."_) and **leave the earlier section in place**.
- This gives us a permanent audit trail of how our thinking evolved.

### Two supporting rules

**Rule A — Modification metadata is mandatory.** When a new dated section _modifies, supersedes, contradicts, or adjusts_ an earlier dated section, that new section MUST include this metadata at the top, before the body:

```markdown
**Decision by:** <name of the person who made the call — always a human>
**Added by:** <name of the person adding this entry — always a human, even when drafted by an AI agent>
**Why:** <one or two sentences explaining the reason for the change>
```

Purely additive entries (a new fact, a new doc reference, a new technology added without removing one) do not require metadata but are encouraged.

**Rule B — Cross-reference, do not duplicate.** If a fact must be visible in more than one document, state it in one place and link to it from the others. Ownership of facts:

- [`docs/SRS.md`](docs/SRS.md) — what the product does (features, `MVP`/`FUTURE` scope tags).
- [`docs/DESIGN.md`](docs/DESIGN.md) — the visual design system + UI screen inventory (UI source of truth).
- [`docs/TECHNOLOGIES.md`](docs/TECHNOLOGIES.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md), [`docs/BEST_PRACTICES.md`](docs/BEST_PRACTICES.md), [`docs/CAUTIONS.md`](docs/CAUTIONS.md) — each owns its technical domain.
- [`docs/DEV_ZONES.md`](docs/DEV_ZONES.md) — feature ownership per developer. The SRS does not assert ownership.
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — domain terms. Do not redefine them in other docs.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — release scope and project-level engineering decisions.

When about to write something that already lives elsewhere: stop, link to the existing source, and (if needed) summarize in one sentence with a pointer to the canonical doc.

### Index of documents

All paths relative to the repository root. Read the document(s) most relevant to the task; for a new session always at minimum skim [`docs/SRS.md`](docs/SRS.md).

| Document                                         | Purpose                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/SRS.md](docs/SRS.md)                       | Software Requirements Specification — the functional spec (actors, passenger app, operator admin, super-admin, booking rules, scope tags). Source of truth for _what_ we are building.                |
| [docs/DESIGN.md](docs/DESIGN.md)                 | Design system + UI screen inventory: green palette tokens, Cairo/Tajawal typography, RTL, components, and every screen. **UI source of truth** (with the reference mockup) until a Figma file exists. |
| [docs/TECHNOLOGIES.md](docs/TECHNOLOGIES.md)     | Tech stack: frameworks, libraries, services, rationale + links. Includes the release-scope and vendor-selection philosophy.                                                                           |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)     | System architecture: hexagonal pattern, folder layout, the **data model**, the **booking/seat-hold concurrency** design, trip lifecycle, RLS, environment topology.                                   |
| [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)     | Local / staging / production setup, Git branching, CI/CD pipelines, deployment + migration workflow.                                                                                                  |
| [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) | Coding conventions, patterns, and engineering norms.                                                                                                                                                  |
| [docs/CAUTIONS.md](docs/CAUTIONS.md)             | Pitfalls and fragile areas: booking concurrency, money/millimes, timezones, RTL, phone/SMS, RLS, security.                                                                                            |
| [docs/DEV_ZONES.md](docs/DEV_ZONES.md)           | Per-developer feature & table ownership.                                                                                                                                                              |
| [docs/GLOSSARY.md](docs/GLOSSARY.md)             | Domain terminology — louage, operator, trip, seat states, etc.                                                                                                                                        |
| [docs/ROADMAP.md](docs/ROADMAP.md)               | Release scope (v1 + future) and project-level engineering decisions.                                                                                                                                  |

### Working rules for Claude (and any AI agent on this project)

1. **Always read `CLAUDE.md` first**, then load whichever doc(s) are relevant to the current task.
2. **Respect the append-only rule** on any committed `.md` file — append a new dated section, do not edit earlier ones.
3. **Use today's date** (`YYYY-MM-DD`) when adding a new section. Include modification metadata per Rule A when superseding earlier content.
4. **Update the index above** if a new document is added to `docs/` (append a new dated section listing it; do not edit the table once committed).
5. **The SRS is the source of truth for product requirements.** If the code disagrees with the SRS, that is a bug or a pending change — surface it.
6. **UI source of truth is [`docs/DESIGN.md`](docs/DESIGN.md) + the reference mockup** ([docs/assets/louaji-mockup.jpeg](docs/assets/louaji-mockup.jpeg)), not invented details. There is no Figma file yet; if one is created, it will be linked from `DESIGN.md` and become authoritative for pixels while `DESIGN.md` keeps owning tokens. For any UI task, read `DESIGN.md` first; if a screen isn't covered, ask the lead developer rather than guessing.
7. **No automated tests are part of this project.** Do not introduce test files, test runners, or testing-related dependencies. Do not write best-practices guidance about testing.

### Scaffold status

The repo carries an Expo SDK 55 web-first scaffold with the hexagonal feature layout and a local Supabase stack. The **tooling** below is current and accurate; the **domain code is not** — see the pivot note at the end of this section.

- **Expo SDK 55** app (web-first, `web.output: "server"` for EAS Hosting) — [app.json](app.json), [package.json](package.json). Entry route at [src/app/\_layout.tsx](src/app/_layout.tsx) + [src/app/index.tsx](src/app/index.tsx).
- **TypeScript strict** with every strict flag enabled — [tsconfig.json](tsconfig.json). `@/*` maps to `./src/*`.
- **NativeWind v4** (Tailwind CSS) — [tailwind.config.js](tailwind.config.js), [babel.config.js](babel.config.js), [metro.config.js](metro.config.js), [src/global.css](src/global.css).
- **ESLint (flat) + Prettier** — [eslint.config.js](eslint.config.js), [.prettierrc.json](.prettierrc.json). Run `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm typecheck`.
- **Typed `process.env`** — [env.d.ts](env.d.ts) + the validated `env` module at [src/shared/config/env.ts](src/shared/config/env.ts) (`@t3-oss/env-core`).
- **Supabase CLI (container lifecycle only)** — [supabase/config.toml](supabase/config.toml) with `project_id = "hunvagy"` (rename pending — see below) and `[db.migrations] enabled = false` so the CLI no longer applies SQL on `start` / `db reset`. Start via `pnpm db:start`, reset via `pnpm db:reset`.
- **Drizzle (full migration pipeline)** — [drizzle.config.ts](drizzle.config.ts). Drizzle owns authoring ([src/db/schemas/](src/db/schemas/)), generation (`pnpm db:generate`, `pnpm db:generate:custom`), and application (`pnpm db:migrate`). One folder per migration under [drizzle/migrations/](drizzle/migrations/) with `migration.sql` + `snapshot.json`; the UUID `prevIds` chain makes parallel-branch migrations merge-conflict-free. PostGIS is enabled via a hand-authored `--custom` bootstrap migration. Never hand-edit a generated migration — regenerate by deleting the folder and re-running `db:generate`.
- **Shared libs** — [src/shared/lib/supabase/client.ts](src/shared/lib/supabase/client.ts) (anon, browser), [src/shared/lib/supabase/server.ts](src/shared/lib/supabase/server.ts) (service-role, server-only), [src/shared/lib/log/server.ts](src/shared/lib/log/server.ts) (pino, server-only), [src/shared/lib/log/client.ts](src/shared/lib/log/client.ts) (browser-safe), [src/shared/lib/http/error-mapper.ts](src/shared/lib/http/error-mapper.ts).
- **Env files** — [.env.example](.env.example) is the canonical list of required keys; [.env](.env) is gitignored and holds local Supabase values.
- **GitHub Actions** — four workflows in [.github/workflows/](.github/workflows/): `pr-checks.yml`, `pr-migration-dry-run.yml`, `deploy-staging.yml`, `deploy-production.yml`. See [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).
- **Husky + lint-staged** — [.husky/pre-commit](.husky/pre-commit) runs `pnpm lint-staged` then `pnpm typecheck`. Installed via the `prepare` script on `pnpm install`. See [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) §24.

> **Pending pivot (code follow-up, not yet done).** The `src/features/*` directories and `src/db/schemas/*` tables still reflect the **previous** product's domain (social platform). They will be **replaced** with the Louaji data model and features per [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §5 and [docs/DEV_ZONES.md](docs/DEV_ZONES.md). The i18n locales (currently en/hu) will become **ar/fr/en** with RTL. Identifiers (`project_id`, Expo org/project, domains) will be renamed to `louaji` (see [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)). Treat the current domain code as scaffolding to be rewritten, not as reference.

### Conventions locked in by this scaffold

- **pnpm** is the package manager. Do not use npm or yarn in this repo.
- **`project_id` in `supabase/config.toml` is load-bearing** — it names the Docker containers. The rename from `hunvagy` to `louaji` is a deliberate code task (it must be coordinated with local container recreation), tracked in [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md). Until then it stays `hunvagy`.
- When adding a feature directory, follow the existing `core / adapters / api / ui / hooks` layout — do not invent a new one.
- **Node version lives in [.nvmrc](.nvmrc)** (`24`) and CI reads it via `node-version-file: .nvmrc`. [package.json](package.json) declares `engines.node: ">=22.13.0"`, `engines.pnpm: ">=10.7.0"`, and `packageManager: "pnpm@10.7.0"`.
- **Pinned remote CLI versions in workflows** (not `latest`) — e.g. `pnpm dlx eas-cli@<pinned> deploy`. A CLI bump is a deliberate PR.
- **Build-on-PR** — [.github/workflows/pr-checks.yml](.github/workflows/pr-checks.yml)'s `build-web` job runs `expo export --platform web` on promotion PRs to catch bundler / Metro / NativeWind / env-resolution failures `tsc --noEmit` cannot see.
- **`.husky/_/` gitignored**; only `.husky/pre-commit` and sibling hook scripts are tracked.
- **Blacksmith runners** across all workflows (`runs-on: blacksmith-4vcpu-ubuntu-2404`). See [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) §5.
- **[.editorconfig](.editorconfig)** keeps editor defaults aligned (LF, 2-space, UTF-8, trim trailing whitespace except `.md`, tab indent for Makefile).

### Dual entry point: `CLAUDE.md` + `AGENTS.md`

Non-Claude agents follow the [agents.md](https://agents.md) open standard and do not auto-load `CLAUDE.md`. To make every AI agent read the same instructions:

- `CLAUDE.md` is the **canonical** entry point, auto-loaded by Claude Code and owned by the append-only rule.
- [`AGENTS.md`](AGENTS.md) (repo root) is a **thin pointer** — a few lines telling any `agents.md`-following agent to open `CLAUDE.md`.
- **Do not duplicate content** between the two files. `AGENTS.md` only points. The append-only rule applies to it too, but the pointer should rarely change.

### Claude Code skills location

Per-technology Claude Code skills, when we add them, live in `.claude/skills/`. That folder is tracked (see the `!.claude/skills/` negation in [.gitignore](.gitignore)) while the rest of `.claude/` stays user-local. The set of installed skills is intentionally not listed here, since it drifts.

---

## 2026-06-27 — gstack

[gstack](https://github.com/garrytan/gstack) is installed as a Claude Code skill suite. It is user-local (installed under `~/.claude/skills/gstack`), not committed to this repo.

**Web browsing:** Use the **`/browse`** skill from gstack for **all** web browsing. **Never** use `mcp__claude-in-chrome__*` tools.

**Available gstack skills:** `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

**Teammates — install gstack (recommended) so these skills are available:**

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

It installs to `~/.claude/skills/gstack` (user-local, not vendored into this repo). Use `~/.claude/skills/gstack/...` for gstack file paths. `--team` enables auto-update at the start of each session. The setup requires [`bun`](https://bun.sh); on macOS, `brew install bun`.

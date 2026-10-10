# Louaji — Best Practices & Coding Conventions

> Source of truth for **how we write code**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's conventions. Most rules here are domain-agnostic and carry over verbatim; the changes are: examples use the booking domain, the theme rule is light-only for v1, the server-only-SDK list reflects the lean Louaji stack, and the Hungarian full-text-search pattern is dropped (no FTS at `MVP`). Money, date/time, and i18n/RTL rules are added.

> **No automated tests are part of this project.** This document does not address testing. Do not introduce test files, test runners, or testing-related dependencies.

### 1. TypeScript

- **Strict mode is mandatory.** `tsconfig.json` has `"strict": true` plus `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitOverride": true`, and `"noPropertyAccessFromIndexSignature": true`.
- **No `any`.** If a value is genuinely unknown, use `unknown` and narrow with type guards or zod.
- **Prefer `type` over `interface`.** Use `interface` only for declaration merging (rare).
- **Discriminated unions** for state machines and result types (the trip/booking statuses are a natural fit). Don't reach for booleans-as-state.
- **Enums** are discouraged — use string-literal unions (`type TripStatus = 'scheduled' | 'boarding' | 'departed' | 'completed' | 'cancelled'`).
- **`as` casts are a smell.** Each cast must be justified by a comment explaining why the type system can't see what we know.

### 2. React

- **Functional components only.** No class components.
- **Named exports for components.** No default exports.

  ```ts
  export function DepartureCard(props: DepartureCardProps) { ... }   // yes
  export default function DepartureCard(...) { ... }                 // no
  ```

- **Props typed inline or via a colocated `type Props = { ... }`.** Don't put prop types in a separate file.
- **Hooks** follow `useXxx`. Custom hooks live next to the feature that owns them, in `features/<feature>/hooks/`.
- **No effects for derived state.** Compute inline (or `useMemo` only when measurable).
- **Keys on lists are stable IDs** (trip id, booking id, seat number), never the array index unless the list is truly static.

### 3. File & directory naming

- **Utilities/modules:** `kebab-case.ts` (e.g. `format-millimes.ts`, `error-mapper.ts`).
- **Components:** `PascalCase.tsx` (e.g. `DepartureCard.tsx`, `SeatMap.tsx`).
- **Hooks:** `use-xxx.ts` (e.g. `use-seat-selection.ts`).
- **Index files:** `index.ts` re-exports the public surface of a directory. Don't deep-import past an `index.ts` from outside the directory.

### 4. Imports

- **Absolute imports via the `@/` alias** rooted at `src/`.
  ```ts
  import { DepartureCard } from "@/features/search/ui/DepartureCard";
  ```
- **Relative imports** only within a single feature directory.
- **Import order** (auto-formatted): node built-ins → external packages → `@/` aliases → relative.

### 5. Hexagonal layering (recap — see [`ARCHITECTURE.md`](ARCHITECTURE.md))

- `core/` never imports from `adapters/`.
- UI never imports from `adapters/` or from `@supabase/supabase-js` directly.
- API routes are **thin** — they wire adapters into use-cases.
- Adapters translate vendor errors to domain errors.

### 6. Error handling

- Domain errors live in `core/errors/` per feature, e.g.:
  ```ts
  export class SeatUnavailable extends Error {
    readonly _tag = "SeatUnavailable" as const;
  }
  export class HoldExpired extends Error {
    readonly _tag = "HoldExpired" as const;
  }
  ```
- Adapters catch service errors (including the `(trip_id, seat_number)` unique violation) and rethrow as domain errors.
- API routes use the central error mapper (`shared/lib/http/error-mapper.ts`) to convert domain errors to HTTP status codes.
- **Never swallow an error silently.** If you genuinely want to ignore one, log it with a comment explaining why.
- **No `try/catch` for control flow.** Catch only when you'll do something with the error (translate, log, retry).

### 7. Validation

- All inputs at boundaries (API routes, query parsing, form submissions) are validated with **zod**, colocated with the boundary.
  ```ts
  const HoldSeatsBody = z.object({
    tripId: z.uuid(),
    seats: z.array(z.number().int().positive()).min(1).max(8),
  });
  ```
- Adapters do **not** re-validate — validation happens once, at the boundary.
- Money totals are computed server-side, never trusted from the client (see §28).

### 8. Data fetching & caching

- **`@tanstack/react-query` for all server data**, no exceptions on the client.
- Query keys are arrays starting with the feature name: `['trips', 'search', { from, to, date }]`, `['trips', tripId, 'seats']`, `['bookings', 'mine']`.
- Mutations invalidate the right queries (e.g. confirming a booking invalidates the trip's seat query and `['bookings','mine']`) — don't refetch the world.
- For optimistic updates, use `onMutate` + rollback in `onError`. Seat holds are a natural optimistic-update case, but the server hold is authoritative.
- **Don't use `useEffect` to fetch data.** Use a query hook.

### 9. Global state

- **Default: no global state.** Local component state + React Query cover most cases.
- **Zustand only when** there's a genuine global client-side concern (e.g. the in-progress seat selection before checkout, the active locale). Document why in a comment at the top of the store.
- One store per concern. No "rootStore". No middleware soup.

### 10. Styling (NativeWind)

- All styling via **NativeWind** classNames. No `StyleSheet.create({...})` unless a third-party API demands it.
- Tokens (colors, spacing, radii, typography) come from `tailwind.config.js` (the green palette + Cairo/Tajawal scale in [`DESIGN.md`](DESIGN.md)) — never raw hex / px in components.
- **Light theme only in v1.** Don't hardcode colors assuming light; still go through tokens so a dark theme can be added later (`FUTURE`) without touching components. (This supersedes the prior project's "dark mode is first-class" stance.)
- **RTL:** use logical utilities (`ps-`/`pe-`, `text-start`/`text-end`, `start-`/`end-`), never `pl-`/`pr-`/`left-`/`right-`. The app is Arabic-first; LTR (fr/en) must mirror correctly. See §29.
- For complex variants, a small `cva`-style helper or simple conditional concatenation — no CSS-in-JS lib.

### 11. Forms

- Inputs are controlled components.
- Validation: zod schema + thin/hand-rolled state. No heavyweight form libs unless we hit a real wall.
- Inline error messages tied to the field they describe, localized.

### 12. Accessibility

- Every interactive element has an `accessibilityLabel` (`aria-label` on web). Seat tiles announce seat number + state.
- Color contrast meets **WCAG AA** — status is conveyed by color **and** label, never color alone.
- Touch targets ≥ 44×44.
- Keyboard navigation works on web (logical focus order, visible focus rings) — including the seat map.

### 13. Performance

- **Lists** use `FlatList` / `FlashList` with stable keys, tuned `windowSize`, no inline arrow functions in `renderItem`. FlashList v2 is New-Arch-only — fall back to `FlatList` if a screen blocks on that.
- **Images** use `expo-image`; always specify `width`/`height` to avoid layout shift.
- **`useMemo` / `useCallback`** only when there's a measured win.
- **Bundle splitting** — Expo Router does this per-route automatically; don't fight it.
- **Lazy-load heavy components** (`React.lazy` + `Suspense`) — e.g. future map/tracking views.

### 14. Async patterns

- `async/await` everywhere. No promise chains.
- A function that can throw a domain error documents it in a one-line JSDoc when non-obvious.
- Parallel work: `Promise.all` (`Promise.allSettled` when partial failures are okay).
- Cancellation: pass `AbortSignal` through long-running operations where it matters.

### 15. Logging

- **Server-side** ([src/shared/lib/log/server.ts](../src/shared/lib/log/server.ts)) — **`pino`** for everything in Node (API routes, Edge Functions, CLI scripts). `info` in prod, `debug` in dev; override via `LOG_LEVEL`. Pretty in dev, JSON one-line in prod. Log structured metadata as the second arg: `logger.info({ tripId, bookingId }, "booking confirmed")`.
- **Client-side** ([src/shared/lib/log/client.ts](../src/shared/lib/log/client.ts)) — thin wrapper over `console.{debug,info,warn,error}` with structured payloads. Not pino (keeps Node shims out of the browser).
- **Never cross the streams.** `pino` must not be imported from any file in the client bundle; don't import the client logger from an API route.
- **Never log secrets, tokens, or PII** — that includes full phone numbers and passenger names (see [`CAUTIONS.md`](CAUTIONS.md) §7). Mask or omit.
- Don't use `console.log` directly — use `log.debug` / `logger.debug` so it can be silenced via `LOG_LEVEL`.

### 16. Comments & documentation

- Default to **no comments**. Well-named identifiers carry their own meaning.
- A comment is warranted only when the **why** is non-obvious: a hidden constraint, a workaround, a subtle invariant (the seat-hold race is a good place for a one-liner).
- Don't comment out dead code — delete it. Git remembers.
- Don't write JSDoc for self-explanatory functions.

### 17. Git hygiene

- **Commit messages** in the imperative mood ("add seat-hold expiry sweep").
- One logical change per commit; split sneaky refactors.
- PRs include the migration in the same commit as the schema change that motivates it.
- No `--no-verify` unless you have a really good reason and document it.

### 18. Migrations & schema (recap — see [`ARCHITECTURE.md`](ARCHITECTURE.md) §4)

- Schema changes go through drizzle-kit — `pnpm db:generate` for anything expressible in `src/db/schemas/*.ts`, `pnpm db:generate:custom` for what drizzle can't model (extensions, domains, trigger functions, the **seat-hold uniqueness/exclusion constraints**). Supabase CLI is container-lifecycle only.
- Generated migrations are never hand-edited. To change one, delete the folder and re-generate.
- Every FK gets an explicit `relations()` entry.
- RLS is mandatory for every table — see [`ARCHITECTURE.md`](ARCHITECTURE.md) §8.
- All timestamps are `timestamptz`; money is integer millimes; travel day is `date`, departure time is `time`.

### 19. RLS policy patterns

- Wrap `auth.uid()` in `(SELECT auth.uid())` — Postgres caches it per query instead of per row. Highest-impact RLS optimization.
- **Scope policies with `TO authenticated`** (or `TO anon` for genuinely public reads — `cities`, `routes`, public `trips`). Without a `TO` clause anon pays to re-check a policy that always denies.
- Index every column referenced in a policy predicate (`passenger_user_id`, denormalized operator id).
- Avoid multi-table joins inside a policy — denormalize the operator id onto `bookings`/`booking_seats`.
- Write the policy in the same migration that creates the table.

### 20. Secrets & environment variables

- **Public** values (Supabase URL, anon key, public config) use the `EXPO_PUBLIC_` prefix.
- **Secret** values (Supabase service-role key, SMS provider key/secret, future payment-gateway secret) live only on the server (Edge Functions / API routes), set in EAS as sensitive variables, never committed.
- `.env.example` lists every required key with a placeholder; `.env.local` is gitignored.

### 21. Third-party SDKs that should NEVER appear in client bundles

- The SMS provider **server** SDK (e.g. Twilio's Node SDK).
- The future payment-gateway **server** SDK.
- Anything taking a service-role Supabase client.

If you accidentally import one in a client file, the bundler pulls it in (bundle balloons, secrets may leak) — code-split via an API route / Edge Function instead.

### 22. Code-review checklist (informal)

- Layering violations (UI → adapter, core → adapter).
- New tables without RLS.
- Schema change without migration.
- `any`, `as` casts, swallowed errors.
- Inline secrets; PII (phone/name) in logs.
- "Check-then-insert" on seats without a backing constraint (a double-booking race — see [`CAUTIONS.md`](CAUTIONS.md) §1).
- Money as float instead of integer millimes.
- Hardcoded `left`/`right` or untranslated user-facing strings.
- Web-only / native-only code not behind a `.web.ts` / `.native.ts` wrapper.
- Comments describing **what** (delete) vs **why** (keep).

### 23. Dependency versions

- **Pin the latest version compatible with the current project — not blindly the most recent on npm.** Wrong versions silently break Metro / native modules.
- **Expo-managed packages** (`expo-*`, `react`, `react-native`, `react-native-*`, `@shopify/flash-list`, `react-native-worklets`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `react-native-screens`, `react-native-safe-area-context`, `eslint-config-expo`): install via `npx expo install <pkg>`. After changing versions, run `npx expo install --check` and fix what it flags.
- **Non-Expo packages** (Supabase, Drizzle, Zod, TanStack Query, i18next, etc.): latest stable unless peer-deps conflict with something Expo-managed — then the newest satisfiable version. Avoid pre-release tags unless documented.
- **Do not mix tools.** Never `pnpm update --latest` across the repo — it crosses the Expo SDK boundary and breaks the bundler.
- **Peer-dep warnings are a signal, not a success.** Read them; `expo install --check` is the arbiter for SDK compatibility.
- **When upgrading the Expo SDK:** follow Expo's upgrade guide, re-run `expo install --check`, bump `eslint-config-expo` to the matching range.

### 24. Pre-commit hooks (Husky + lint-staged)

- [`.husky/pre-commit`](../.husky/pre-commit) runs `pnpm lint-staged` then `pnpm typecheck`.
- `lint-staged` config in [`package.json`](../package.json): `*.{ts,tsx,js,jsx}` → `eslint --fix` then `prettier --write`; `*.{json,md,yml,yaml,css,html}` → `prettier --write`. It auto-`git add`s modified files — no manual restage.
- `typecheck` runs against the whole project (TS errors propagate across the import graph).
- **Bypass (rare, justified):** `git commit --no-verify`. Reserve for emergencies; CI re-runs the checks anyway.
- **Onboarding:** `pnpm install` runs `prepare` → `husky` installs the hook. New clones get it for free.

### 25. Env access — single typed boundary

- **Only [src/shared/config/env.ts](../src/shared/config/env.ts) may read `process.env`.** Every other file imports the validated `env`:
  ```ts
  import { env } from "@/shared/config/env";
  ```
- **Why not `process.env.FOO` directly:** no runtime validation, no types (with `noPropertyAccessFromIndexSignature` bracket syntax is required anyway), and `@t3-oss/env-core` gives us both for free.
- **Adding a key:** (1) add to [.env.example](../.env.example); (2) schema line in `env.ts` (`server` vs `client` — `client` requires `EXPO_PUBLIC_`); (3) matching `runtimeEnv` literal mapping (Expo's `no-dynamic-env-var` + Babel static inlining require literal `process.env.FOO`). Don't iterate/spread `process.env`.
- **Drizzle config exception:** [drizzle.config.ts](../drizzle.config.ts) runs under `tsx` outside Expo, so it does `import "dotenv/config"` before importing `env`. No other file calls `dotenv`.
- **`SKIP_ENV_VALIDATION` is CI-only** — set only by the workflows that run `pnpm db:migrate` (they need just `DATABASE_URL`). Never on EAS aliases or in `.env`.

### 26. Every index must be justified by a concrete read path

- **Before adding an index, name the query that will use it** — in the schema comment or PR description ("covers the `(trip_id)` lookup in the seat-availability query", "backs the RLS predicate on `passenger_user_id`"). If the only justification is "this column is a `geography`/`text`, it probably wants one", it's cargo-cult — skip it.
- Indexes cost real money on write-heavy tables (WAL amplification, autovacuum, insert latency). `booking_seats` / `seat_holds` are write-hot — index only what reads/policies actually use.
- FKs never filtered outside a JOIN generally don't need their own index. Partial indexes (`WHERE expires_at > now()` shape, `WHERE deleted_at IS NULL`) are often the right tool — match the index predicate to the policy/query predicate.
- PK / unique-constraint indexes don't need a justification (structural) — and the `(trip_id, seat_number)` unique constraints on `booking_seats` / active `seat_holds` are the correctness backbone, not optional.

### 27. Money — integer millimes only

- TND subdivides into **1000 millimes**. Store and compute money as **integer millimes** (`price_millimes`, `total_millimes`). Never float.
- Compute totals server-side at confirm time (`price_millimes × seat_count`); never trust a client-sent total.
- Format for display in one place — `src/shared/lib/money/` renders millimes as `15.000 دت`. Don't reformat ad hoc.

### 28. Dates & times — Africa/Tunis

- All departures are local **Africa/Tunis** (no DST). Store `service_date` as `date` and `departure_time` as `time`; don't collapse them into a UTC `timestamptz` and lose local intent.
- "Today", "upcoming vs past", and day-chip math are computed in Africa/Tunis (use `@date-fns/tz`), not the server's or browser's zone. Date utilities live in `src/shared/lib/datetime/`.

### 29. i18n & RTL

- Three locales: **ar (primary, RTL), fr, en**. Catalogs live in `src/shared/lib/i18n/`. **No hardcoded user-facing strings** — every visible string has a key in all three catalogs.
- Drive layout direction from the active locale; use logical NativeWind utilities (§10). On web set the document `dir`; on native prefer logical styling over runtime `I18nManager.forceRTL` (which triggers a reload). Test every screen in ar (RTL) + at least one LTR locale.
- City/operator names are stored multilingually; user-entered names (passenger name) are stored as entered.

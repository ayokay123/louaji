# Louaji — Architecture

> Source of truth for **how the system is structured**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's architecture. The hexagonal pattern, the Drizzle/Supabase/PostGIS foundation, and the web-first multi-platform approach carry over unchanged — they are domain-agnostic. The domain-specific sections (booking, seats, search, RLS, the data model) are Louaji's.

### 1. Overall shape

Louaji is a **monorepo with a single Expo app** (web-first, native later) backed by **Supabase** (Postgres + Auth + Realtime + Edge Functions). All domain logic lives inside the Expo app and is invoked through **Expo Router API routes** (server endpoints colocated with client code). External services (SMS/OTP provider, future payment gateway, future maps/tracking) are reached only through **adapters** that implement explicit ports defined by the domain layer.

```
┌─────────────────────────────────────────────────────────┐
│                    Expo app (web/native)                │
│                                                         │
│  ui/  ──►  hooks/  ──►  api/ (Expo Router routes)       │
│                              │                          │
│                              ▼                          │
│                         use-cases/   (pure domain logic)│
│                              │                          │
│                              ▼                          │
│                         ports/ (interfaces)             │
└──────────────────────────────│──────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
   adapters/supabase     adapters/sms          adapters/payment (FUTURE)
        │                      │                      │
        ▼                      ▼                      ▼
   Supabase project       SMS/OTP provider      TN gateway (FUTURE)
   (Postgres + RLS,
    Auth, Realtime,
    Edge Fn)
```

### 2. Hexagonal pattern (Ports & Adapters), everywhere

Every feature follows the same shape. **No exceptions.** Uniform, swappable, resilient to vendor changes.

```
src/
  features/<feature>/
    core/
      entities/      # domain types — plain TS, no I/O dependencies
      ports/         # interfaces — what the core needs from the outside world
      use-cases/     # business logic — pure functions, no I/O
      errors/        # domain-specific error classes
    adapters/
      supabase/      # implements ports against Supabase
      sms/           # implements ports against the SMS/OTP provider
      ...
    api/             # Expo Router API routes — wire adapters into use-cases
    ui/              # feature-specific React components
    hooks/           # feature-specific React hooks (call API routes)
  shared/
    components/      # cross-feature reusable UI primitives
    lib/             # Supabase client, fetch wrapper, i18n, generic utilities
    config/          # env, constants
    types/           # cross-feature types
  db/
    schema.ts        # source of truth for TypeScript types (re-exports schemas/)
    schemas/         # one file per table
    relations.ts     # explicit relations() — required for nested-query inference
```

### 3. Layer responsibilities & rules

| Layer                | What it does                                                                                                            | What it must NOT do                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `core/entities`      | Define domain types (Trip, Booking, Seat, Operator…)                                                                    | Import adapters or any I/O lib                    |
| `core/ports`         | Declare interfaces (e.g. `TripRepository`, `BookingRepository`, `SmsSender`)                                            | Import any concrete implementation                |
| `core/use-cases`     | Pure business logic; takes ports as dependencies                                                                        | Touch the network, DB, file system, or React      |
| `core/errors`        | Domain error classes (e.g. `SeatUnavailable`, `HoldExpired`, `TripNotFound`)                                            | Be platform-specific                              |
| `adapters/<service>` | Implement ports against a concrete service; translate service errors → domain errors                                    | Contain business logic                            |
| `api/`               | Expo Router server route. **Thin.** Validate input (zod), construct adapters, invoke use-case, map domain errors → HTTP | Contain logic beyond wiring                       |
| `ui/`                | React components                                                                                                        | Talk to Supabase or any external service directly |
| `hooks/`             | React Query hooks calling the feature's API routes                                                                      | Bypass API routes                                 |

**Hard rules:** `core/` never imports from `adapters/`; UI → hooks → API routes → use-cases → ports → adapters (UI never touches Supabase directly); adapters translate vendor errors into domain errors so use-cases never see a `PostgrestError`.

**Adapter naming** follows the external service, not the library. Every feature has `adapters/supabase/` because Supabase handles our domain data. Do **not** rename it to `adapters/drizzle/` — Drizzle is an implementation detail of _how_ we query Postgres.

**Inside `adapters/supabase/` — Drizzle vs supabase-js:**

- **Postgres reads/writes → Drizzle** (`drizzle-orm` against [src/db/schema.ts](../src/db/schema.ts), over `postgres-js` pointed at `DATABASE_URL`, server-only). Booking confirmation and seat holds use **explicit transactions** (`db.transaction(...)`) — see §9.
- **Auth (phone OTP, sessions, JWT verification) → supabase-js.** Server uses the service-role client; browser uses the anon client.
- **Realtime channels → supabase-js.** Used for live seat availability (`FUTURE`/optional) and future live tracking.

### 4. Database

- **`src/db/schema.ts`** is the source of truth for TypeScript types. Per-table schemas under `src/db/schemas/`, re-exported from `schema.ts`.
- **Every foreign key needs an explicit `relations()` entry** (in `src/db/relations.ts`) for Drizzle nested-query inference.
- **Migrations live in `drizzle/migrations/`** as per-migration folders (`<timestamp>_<name>/{migration.sql, snapshot.json}`), generated via `pnpm db:generate` (schema diff) or `pnpm db:generate:custom` (hand-authored — extensions, domains, trigger functions, exclusion constraints).
- **drizzle-kit v1.0-beta has no shared `_journal.json`** — each migration carries its own snapshot and references the previous one by UUID (`prevIds`), making parallel-branch work merge-conflict-free.
- **Supabase CLI is container-lifecycle only.** `[db.migrations] enabled = false` in [supabase/config.toml](../supabase/config.toml). Applying migrations is always `drizzle-kit migrate`. Schema-change workflow lives in [`ENVIRONMENTS.md`](ENVIRONMENTS.md) §6.
- **Generated migrations are immutable.** To change one, delete the folder and re-run `db:generate`.
- **Every table needs RLS policies written before any feature uses it** (`pgPolicy` / `enableRLS` from `drizzle-orm/supabase`). RLS is the canonical authorization boundary — see §8.
- **All timestamps are `timestamptz`.** Money is **integer millimes** (`bigint`/`integer`), never float. Travel time-of-day is stored as `time`; the travel calendar day as `date`.

### 5. Recommended data model (Louaji)

This is the canonical entity map. Owners are assigned in [`DEV_ZONES.md`](DEV_ZONES.md); table-level detail is finalized when the schema is authored (code follow-up).

| Table            | Purpose                                                 | Key columns / notes                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`          | All accounts (passengers + operator + super-admin).     | Phone (unique, +216), name, optional email; auth via Supabase Auth.                                                                                                                          |
| `role_grants`    | Per-user role assignments.                              | `user_id`, `role` (`passenger` \| `company_admin` \| `driver` \| `super_admin`), optional `company_id` scope.                                                                                |
| `companies`      | Transport companies.                                    | name (ar/fr/en), logo, contact, `is_verified`. Owner/manager via `role_grants`.                                                                                                              |
| `drivers`        | Driver profiles.                                        | name, phone, `company_id` **nullable** (null = independent), optional `user_id` login link, `is_verified`.                                                                                   |
| `vehicles`       | Louages.                                                | owner = `company_id` **or** `driver_id` (exactly one), plate, model, `seat_count`, `seat_layout` (JSON: positions, driver seat, blocked), `is_active`.                                       |
| `cities`         | Search origin/destination units.                        | name (ar/fr/en), governorate, `location geography(POINT,4326)`, `is_active`.                                                                                                                 |
| `routes`         | Directional city pairs.                                 | `origin_city_id`, `destination_city_id`, `est_duration_min`, `est_distance_km`. Unique `(origin, destination)`.                                                                              |
| `trips`          | A single scheduled departure.                           | `route_id`, `company_id` (nullable), `driver_id`, `vehicle_id`, `service_date`, `departure_time`, `est_arrival_time`, `price_millimes`, `status`, `total_seats` (denormalized from vehicle). |
| `booking_seats`  | One row per booked seat on a trip (the hard inventory). | `booking_id`, `trip_id`, `seat_number`. **Unique `(trip_id, seat_number)`** = the double-booking guarantee.                                                                                  |
| `seat_holds`     | Temporary checkout locks.                               | `trip_id`, `seat_number`, `held_by` (user/session), `expires_at`. **Unique `(trip_id, seat_number)`** among active holds.                                                                    |
| `bookings`       | A reservation.                                          | `booking_number` (LJ-DDMMYY-NNNN, unique), `passenger_user_id`, `trip_id`, `status`, `seat_count`, `total_millimes`, `payment_method`, `passenger_name`, `passenger_phone`, timestamps.      |
| `search_history` | Recent searches.                                        | `user_id`, `origin_city_id`, `destination_city_id`, `service_date`, `searched_at`.                                                                                                           |
| `notifications`  | In-app notifications.                                   | `user_id`, `type`, `payload`, `read_at`.                                                                                                                                                     |

`FUTURE` tables: `stations` (sub-city), `ratings`, `payments`, `promotions`, `trip_templates` (recurring), `vehicle_positions` (live tracking).

> Independent-driver modeling decision: rather than a polymorphic `operators` table, a vehicle/trip points to **either** `company_id` **or** `driver_id`. An independent driver is a `drivers` row with `company_id = null` that owns vehicles/trips directly. Keeps joins simple; the "operator" concept is a read-time union, not a physical table. Revisit only if a real third operator type appears.

### 6. Booking & seat reservation (the critical flow)

The product rules are in [`SRS.md`](SRS.md) §4.3. The implementation:

```
Seat selection ──► HOLD ──► (checkout) ──► CONFIRM ──► confirmed booking
                    │                          ▲
                    └──── expires (10 min) ────┘ release
```

1. **HOLD** (`POST /trips/:id/hold`): in a single transaction, insert `seat_holds` rows for the requested `(trip, seat)` pairs with `expires_at = now() + interval '10 minutes'`. The **unique `(trip_id, seat_number)`** constraint on active holds + a check that no `booking_seats` row exists for those seats makes the insert fail atomically if any seat is taken → use-case raises `SeatUnavailable`. Holds owned by the requesting user/session.
2. **CONFIRM** (`POST /bookings`): in a single transaction — verify the user's holds still exist and are unexpired; generate the `booking_number`; insert `bookings` + `booking_seats` (the `(trip_id, seat_number)` unique constraint is the final guard); delete the holds. If a hold is missing/expired → `HoldExpired`, the passenger re-picks.
3. **EXPIRE / RELEASE**: holds are treated as expired when `expires_at < now()` — availability queries ignore expired holds. A periodic sweep (Edge Function cron, or lazy delete on read) purges stale rows so they don't accumulate.

**Availability** of a seat on a trip = no `booking_seats` row **and** no `seat_holds` row with `expires_at > now()`. The seat map query returns each seat's derived state (available / reserved / blocked) from `vehicles.seat_layout` ⨝ `booking_seats` ⨝ live `seat_holds`.

**Concurrency guarantee:** correctness rests on DB constraints, **not** on application-level checks. Two simultaneous confirms for the same seat: one commits, the other hits the unique violation and is translated to `SeatUnavailable`. Never "check then insert" without the constraint backing it. See [`CAUTIONS.md`](CAUTIONS.md).

### 7. Trip lifecycle

```
scheduled ──► boarding ──► departed ──► completed
     │            │
     └────────────┴──► cancelled   (releases all bookings, notifies passengers)
```

- `scheduled` — published and bookable.
- `boarding` — near departure (operator-set or time-derived); still bookable until departure per policy.
- `departed` — left; no new bookings; passengers can no longer cancel.
- `completed` — arrived (or end-of-day sweep).
- `cancelled` — operator cancelled; all `bookings` on the trip move to `cancelled`, seats released, passengers notified (SMS + in-app).

Per-booking statuses: `confirmed` → `boarded` / `no_show` (operator at boarding) or `cancelled` (passenger/operator).

### 8. Authorization (RLS model)

RLS is the authorization boundary. Policies are scoped `TO authenticated` (or `TO anon` for public reads) and wrap `auth.uid()` in `(SELECT auth.uid())` — see [`BEST_PRACTICES.md`](BEST_PRACTICES.md) §19.

| Data                                | Passenger                                | Operator (company/driver)                         | Super-admin          |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------- | -------------------- |
| `cities`, `routes`                  | read (public, incl. `anon`)              | read                                              | full                 |
| `trips` (verified, scheduled)       | read (public)                            | **write only own** (own `company_id`/`driver_id`) | full                 |
| `vehicles`, company/driver profiles | read public bits                         | **CRUD own only**                                 | full                 |
| `bookings`, `booking_seats`         | **own only** (`passenger_user_id = uid`) | read bookings **on own trips only**               | full                 |
| `seat_holds`                        | own holds only                           | read on own trips                                 | full                 |
| `companies`/`drivers` verification  | read `is_verified`                       | read own                                          | **set verification** |
| `users`                             | own row                                  | —                                                 | manage               |

Operators must **not** see other operators' bookings/passengers — enforced by the predicate, denormalizing `company_id`/`driver_id` onto `bookings`/`booking_seats` if needed to keep policies single-table (avoid multi-join policies — see [`CAUTIONS.md`](CAUTIONS.md)).

### 9. Transactions & integrity

- Booking confirm and seat hold run inside `db.transaction(...)`. Never split the read-check and the write across two round trips without a constraint enforcing the invariant.
- Money totals are computed server-side from `price_millimes × seat_count` at confirm time — never trusted from the client.
- `booking_number` generation is collision-safe (unique constraint + retry, or a per-(date) sequence).

### 10. Realtime

- **`FUTURE`/optional — live seat availability:** Postgres Changes on `booking_seats` / `seat_holds` scoped to the open trip, so a passenger sees seats grey out as others book. RLS applies to subscriptions — keep read policies tight so we don't leak passenger data over the wire.
- **`FUTURE` — live louage tracking:** driver position stream (Realtime Broadcast for ephemeral position, or Postgres Changes on `vehicle_positions`).
- Mind Realtime quotas (see [`CAUTIONS.md`](CAUTIONS.md)); subscribe per-trip/per-user, not globally.

### 11. Geo (PostGIS)

- City coordinates use `geography(POINT, 4326)` with **GIST indexes**. No geohash, no `lat`/`lng` pairs.
- `MVP` use is light (sort/nearest-city helpers). The heavier use — distance-along-route and **live tracking** — is `FUTURE`. Distance queries use `ST_DWithin(...)` (index-friendly); never `ST_Distance(...) < X`.

### 12. Authentication

- **Supabase Auth, phone-first** (SMS OTP) via a configured SMS provider (see [`TECHNOLOGIES.md`](TECHNOLOGIES.md)). Email+password optional. Social login is not in scope.
- Session lives in the Supabase auth client; server routes verify the JWT before invoking any use-case.
- Booking confirmation is gated server-side: a confirmed booking requires an authenticated user with a verified phone + name (the API route rejects otherwise with `OnboardingIncomplete`).

### 13. Internationalization & RTL

- Three locales: **ar (primary, RTL), fr, en**. A single i18n layer in `src/shared/lib/i18n/` with per-locale message catalogs. RTL handled via logical layout (start/end), not hardcoded left/right. City/operator names stored multilingually. See [`DESIGN.md`](DESIGN.md) and [`TECHNOLOGIES.md`](TECHNOLOGIES.md).

### 14. Multi-platform (web first, native later)

- Launch on **Expo for Web** only. Native later. Web-only libraries are wrapped so native can swap implementations via `.web.tsx` / `.native.tsx` without touching feature code. All feature code imports the wrapper, never the platform-specific lib.

### 15. Error model & validation

- Domain errors in `core/errors/` per feature (`SeatUnavailable`, `HoldExpired`, `TripNotFound`, `TripNotBookable`, `OperatorNotVerified`…). Adapters translate vendor errors to domain errors; API routes map domain errors → HTTP via `shared/lib/http/error-mapper.ts`. Unhandled → generic 500 + logged trace.
- All request payloads on API routes validated with **zod**, schema colocated with the route. Adapters do not re-validate.

### 16. Cross-cutting: where things live

| Concern                                     | Location                              |
| ------------------------------------------- | ------------------------------------- |
| Supabase client (browser)                   | `src/shared/lib/supabase/client.ts`   |
| Supabase client (server, service role)      | `src/shared/lib/supabase/server.ts`   |
| HTTP fetch wrapper                          | `src/shared/lib/http/fetch.ts`        |
| Error → HTTP mapper                         | `src/shared/lib/http/error-mapper.ts` |
| i18n / RTL                                  | `src/shared/lib/i18n/`                |
| Money formatting (millimes → `15.000 دت`)   | `src/shared/lib/money/`               |
| Date/time (Africa/Tunis)                    | `src/shared/lib/datetime/`            |
| Map wrapper (platform-switchable, `FUTURE`) | `src/shared/components/Map/index.ts`  |

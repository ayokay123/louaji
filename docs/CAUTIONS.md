# Louaji — Cautions, Pitfalls & Things to Watch

> Source of truth for **what tends to bite us**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's cautions. Infra pitfalls (web/native, migrations, PostGIS, RLS, secrets, dev workflow) carry over; the domain pitfalls are Louaji's — booking concurrency, money, time, RTL, and phone/SMS.

A consolidated list of things known (or expected) to cause issues. Read before working in any of these areas.

### 1. Seat booking & concurrency (highest risk)

#### Double-booking is a data-integrity problem, not a UI problem

- The guarantee that two passengers can't book the same seat lives in the **database**: a unique constraint on `booking_seats(trip_id, seat_number)` and on active `seat_holds(trip_id, seat_number)`. See [`ARCHITECTURE.md`](ARCHITECTURE.md) §6.
- **Never** "SELECT to check availability, then INSERT" without the constraint backing it — that's a race. Two requests both read "free" and both insert. Let the constraint reject the loser and translate the violation to `SeatUnavailable`.
- Hold and confirm run inside a single `db.transaction(...)`. Don't split the check and the write across round trips.

#### Holds must expire — and expiry must be enforced on read

- A `seat_holds` row is "active" only while `expires_at > now()`. Availability queries must filter expired holds out, **and** a sweep (Edge Function cron) must purge them so the table doesn't grow unbounded.
- Don't rely on the sweep for correctness — rely on the `expires_at` filter. The sweep is housekeeping.

#### Confirm can fail even after a successful hold

- Between hold and confirm a hold can expire and another passenger can grab the seat. Confirm must re-verify and fail cleanly (`HoldExpired`) so the UI sends the passenger back to seat selection. Handle this path explicitly — it's not an edge case, it's the normal race outcome.

#### Booking-number collisions

- `LJ-DDMMYY-NNNN` is not globally unique by construction. Back it with a unique constraint + retry, or a per-date sequence. Don't assume random 4 digits won't collide at volume.

### 2. Money

#### Store money as integer millimes, never float

- TND has **1000 millimes**. `15.000 دت` = `15000` millimes. Floats lose cents — never use them for money. Totals are computed server-side (`price_millimes × seat_count`) at confirm time, never trusted from the client.
- Display formatting (millimes → `15.000 دت`) lives in one place: `src/shared/lib/money/`. Don't reformat ad hoc.

### 3. Dates & times

#### One timezone, but be explicit about it

- All departures are **Africa/Tunis** (no DST). Store `service_date` as `date` and `departure_time` as `time`; don't smash them into a UTC `timestamptz` and lose the local intent.
- "Today" / "upcoming vs past" comparisons must be done in Africa/Tunis, not the server's or browser's local zone. Use `@date-fns/tz` consistently. A booking made at 23:30 in Tunis must not flip to "tomorrow" because the server is on UTC.

#### Day chips and "from today onward"

- Search day chips and the home date default are computed in Tunis local time. Off-by-one-day bugs here are user-visible and erode trust.

### 4. RTL & i18n

#### Arabic is the primary locale — RTL is the default, not an afterthought

- Use **logical** layout everywhere: `ps-`/`pe-`, `text-start`/`text-end`, `start-`/`end-`, flex direction that respects writing direction. Hardcoded `left`/`right`/`pl-`/`pr-` will break Arabic.
- Test every screen in **ar (RTL)** and at least one LTR locale (fr/en). Mirror icons that imply direction (back arrows, the route `→` arrow).

#### `I18nManager.forceRTL` triggers a reload on native

- On native, flipping RTL can require an app reload. Prefer locale-driven logical styling over forcing `I18nManager` at runtime. On web, set document `dir`. Decide direction at load from the chosen locale.

#### No hardcoded user-facing strings

- Every visible string goes through i18n with keys in all three catalogs (ar/fr/en). A missing key should be obvious in dev, not shipped.

### 5. Phone & OTP

#### Normalize phone numbers to E.164

- Store `+216########`. Validate Tunisian format on input. Inconsistent formats fragment identity (same person, two "accounts").

#### SMS costs money and is abusable

- Rate-limit OTP requests per phone and per IP. An unthrottled OTP endpoint is both a cost leak and an abuse vector. Booking-confirmation SMS is also metered — don't send duplicates.

#### OTP deliverability in Tunisia varies by provider

- Test real delivery to Tunisian carriers before committing to a provider. A provider that works in the EU sandbox may have poor TN deliverability. See [`TECHNOLOGIES.md`](TECHNOLOGIES.md).

### 6. Cash-on-boarding has no payment guarantee

- v1 takes no money. A confirmed booking is a **promise to pay cash on boarding**, not a paid transaction. No-shows cost the operator a seat with no recourse in v1. Don't build refund/escrow logic — there's nothing to refund. When online payment arrives (`FUTURE`), money semantics change substantially.

### 7. Privacy / GDPR (phone & personal data)

- We collect **phone numbers + names** — personal data. Don't log full phone numbers or names in app logs (`src/shared/lib/log`). Operators see passenger name+phone **only for their own trips** — enforced by RLS, not just UI.
- Don't expose one passenger's data to another, and don't expose one operator's bookings to another. Treat a cross-operator leak as a release blocker.

### 8. Web vs native

#### Native-only modules don't work on web

- We launch web-first. Anything native-only (camera, some sharing, future `react-native-maps`) must be wrapped via `.web.tsx` / `.native.tsx` so the web bundle stays clean and native can swap in later. Don't import a native-only lib into a v1 web feature.

#### New Architecture is mandatory from Expo SDK 55

- SDK 55 dropped Legacy Architecture. Every native dependency must support Fabric + TurboModules. Check before adding any native lib; ignore pre-2024 RN blog snippets that assume Legacy Arch.

#### Prefer `.web.tsx` / `.native.tsx` over inline `Platform.select`

- Metro picks the right file by extension → better tree-shaking, cleaner bundles. Use `Platform.select` only for tiny conditionals inside an otherwise-shared file.

### 9. Database & migrations

#### The full migration pipeline runs through Drizzle

- Author in `src/db/schemas/*.ts`; `pnpm db:generate` (or `db:generate:custom` for extensions, domains, trigger functions, and the **seat-hold uniqueness/exclusion constraints**); apply with `pnpm db:migrate`. Supabase CLI is container-lifecycle only (`[db.migrations] enabled = false`).
- **Generated migrations are immutable** — to change one, delete the folder and re-generate. Never hand-edit `migration.sql` / `snapshot.json`.
- drizzle-kit v1.0-beta's per-migration snapshots + UUID `prevIds` chain make parallel-branch migrations merge-conflict-free — but still review migration ordering on merge.

#### Every FK needs an explicit `relations()` entry

- Without it you lose typed nested `with: {}` queries.

#### PostGIS `geography` is introspected as `unknown` by Drizzle

- Wrap with a `customType` in the schema, or location columns won't be typed.

#### `db:reset` wipes local auth users

- Seed scripts must recreate any test users (passengers, operators, a super-admin) they assume. Don't hand-create accounts in local Studio and expect them to survive a reset.

### 10. PostGIS query patterns

- `ST_Distance(...) < X` does **not** use the index — always filter with `ST_DWithin(location, point, meters)`.
- `geography` distance math is ~10× slower than `geometry`; fine at our scale and light `MVP` use.
- Don't add geohash columns — PostGIS spatial indexes do the job.

### 11. RLS

- Wrap `auth.uid()` in `(SELECT auth.uid())` — caches per query instead of per row. Highest-impact RLS optimization.
- Scope policies `TO authenticated` (or `TO anon` for genuinely public reads like `cities`/`routes`/public `trips`) so anon requests short-circuit.
- **Index every column referenced in a policy predicate** (e.g. `passenger_user_id`, denormalized `company_id`/`driver_id` on `bookings`).
- **Avoid multi-table joins inside a policy** — denormalize the operator id onto `bookings`/`booking_seats` so the "operator sees only own trips' bookings" policy stays single-table.
- Write the policy in the same migration that creates the table. Treat "missing RLS" as a release blocker.

### 12. Realtime (`FUTURE`/optional)

- Live seat availability and live tracking use Realtime. Watch the quotas: ~100 concurrent channels, 200 clients/channel, Postgres Changes re-evaluates RLS per row per subscriber and caps ~500 concurrent clients per DB.
- Subscribe **per-trip** (open trip) and **per-user**, never globally. Keep read policies tight so subscriptions don't leak passenger data over the wire.
- Use Broadcast (not Postgres Changes) for ephemeral high-fanout streams like a moving vehicle position.

### 13. Secrets

- `EXPO_PUBLIC_*` is **bundled to the client** — never put the Supabase service-role key, the SMS provider key, or a future payment secret behind that prefix. Server-only secrets are set as EAS sensitive variables and read only in API routes / Edge Functions.
- Don't import server-only SDKs (SMS provider server SDK, service-role Supabase client, future payment server SDK) from client files — the bundler pulls them in and secrets can leak.

### 14. Dev workflow conflicts

- **Don't write migrations on tables you don't own** — go through the owner ([`DEV_ZONES.md`](DEV_ZONES.md)). The seat-hold / `booking_seats` constraints are Dev 2 + lead-review only.
- **Don't modify another dev's rendering code** — request the change from the owner.
- **No hardcoded user-facing strings** — everything through i18n in all three locales.

### 15. Documentation hygiene

- The append-only rule applies to **all** `.md` files including `CLAUDE.md` and this one. Never edit prior dated sections — append a new dated section. See `CLAUDE.md`.
- Every new doc gets indexed in `CLAUDE.md` (itself via a new dated section, not an edit to the original index).
- **UI source of truth is [`DESIGN.md`](DESIGN.md) + the reference mockup** until a Figma file exists. Don't invent UI details; ask the lead developer.

### 16. Vendor lock-in & exit ramps

- Adapters keep the core vendor-agnostic, but a few choices have real switching cost:
  - **Supabase** — Auth + Realtime + RLS would all need re-implementing elsewhere. High.
  - **PostGIS** — another spatial DB + query rewrite. High (but light use in `MVP`).
  - **SMS provider** — easy: another provider behind Supabase Auth / the `SmsSender` port.
  - **Payment gateway** (`FUTURE`) — moderate; keep it behind a `PaymentGateway` port from day one.
- Don't over-engineer for swappability beyond the adapter layer. Choose well, write the adapter cleanly, move on.

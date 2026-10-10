# Louaji — Developer Zones & Ownership

> Source of truth for **who owns what**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's ownership map. Same principle, new domains. This split is a proposal aligned to the Louaji feature set; the lead developer owns adjustments.

### 1. Why ownership matters

Three developers build in parallel against a shared Supabase Postgres. To avoid migration conflicts, contradictory schema changes, and rendering-layer collisions, every table and every feature has **one owner**. Other devs read; only the owner writes. Cross-table needs go through the owner.

### 2. Initial setup — first phase

| Dev 1                                                                                                                                      | Dev 2                                                                                                                         | Dev 3                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full Supabase schema foundation (all tables, relations, indexes, RLS, PostGIS, **seat-hold constraints**) + Expo project setup + repo + CI | Shared reusable frontend components (buttons, inputs, cards, chips, sheets, loaders, error/empty states) + **i18n/RTL layer** | Design system (NativeWind tokens from [`DESIGN.md`](DESIGN.md), Cairo/Tajawal typography, color, spacing) + app shell (bottom tabs, routing) + admin layout |

### 3. Data ownership (between devs)

| Table family                                                      | Owner     | Other devs                                  |
| ----------------------------------------------------------------- | --------- | ------------------------------------------- |
| `users`, `role_grants` (accounts, roles, auth)                    | **Dev 1** | Dev 2 / 3 read only                         |
| `cities`, `routes` (catalog)                                      | **Dev 1** | Dev 2 / 3 read only                         |
| `trips`, `booking_seats`, `seat_holds`, `bookings` (booking core) | **Dev 2** | Dev 1 / 3 read only                         |
| `search_history`                                                  | **Dev 2** | —                                           |
| `companies`, `drivers`, `vehicles` (operators & fleet)            | **Dev 3** | Dev 2 reads (trip publish, seat layout)     |
| `notifications`                                                   | **Dev 1** | Dev 2 / 3 publish via the notification port |

**Hard rules:**

- Each dev writes migrations only on tables related to their own features.
- Need a column on someone else's table → ask the owner to add it **same day**.
- No silent schema changes on someone else's tables.
- The **seat-hold / `booking_seats` uniqueness constraints** are correctness-critical — only Dev 2 changes them, and any change is reviewed by the lead developer ([`ARCHITECTURE.md`](ARCHITECTURE.md) §6).

### 4. Feature ownership

#### Dev 1 — Platform foundation, accounts & catalog

- **Schema foundation** — initial migrations, PostGIS bootstrap, RLS scaffolding, shared DB types.
- **Auth & onboarding** — phone OTP signup/login, phone verification, guest→account upgrade, session handling.
- **Passenger account** — profile, personal info edit, notification preferences, logout.
- **City / route catalog** — the searchable city list + route pairs (data + admin CRUD surface for super-admin).
- **Notifications** — in-app notification center + the notification **port** other devs publish to; SMS confirmation/cancellation sends (Edge Function).
- **Super-admin core** — user management, operator verification workflow, catalog management UI.
- **CI / env / project setup** — workflows, `env.ts`, husky, repo conventions.

#### Dev 2 — Search, booking & seats

- **Home & search** — from/to/date inputs, validation, recent searches.
- **Search results** — departure cards, day chips, free-seat counts, sorting.
- **Trip details & seat map** — render vehicle seat layout, seat states, selection.
- **Seat-hold & booking flow** — hold/confirm/expire transactions, booking-number generation, the concurrency guarantee, the hold-expiry sweep (Edge Function).
- **Booking summary & confirmation** — totals, payment-method (cash), success screen.
- **My bookings & tickets** — upcoming/past, status chips, ticket detail, passenger cancellation.
- **(`FUTURE`) live seat availability** via Realtime.

#### Dev 3 — Operators, fleet & design system

- **Design system** — NativeWind tokens, typography, components contract with Dev 2's shared components.
- **App shell** — bottom tab navigation, route structure, RTL-aware layout, admin layout.
- **Operator onboarding & profile** — company + independent-driver registration, verification status display.
- **Fleet & vehicles** — vehicle CRUD, the **seat-layout designer** (the data that drives the passenger seat map).
- **Routes served** — operator route selection.
- **Trip scheduling** — create/edit departures (route, date, times, price, vehicle, driver assignment).
- **Operator seat board & bookings** — per-trip seat board, passenger list, boarded/no-show, trip cancellation.
- **Operator dashboard** — today/upcoming, occupancy, quick actions.

### 5. Cross-team integration patterns

- **Trips depend on vehicles+seat-layout (Dev 3) and the catalog (Dev 1); bookings (Dev 2) read all three.** Dev 3 owns the `vehicles.seat_layout` shape; Dev 2 consumes it read-only to render the seat map. Any change to the layout schema is coordinated with Dev 2 the same day.
- **Notifications produced by other devs** — Dev 2 (booking confirmed, passenger cancellation) and Dev 3 (operator trip cancellation) publish through the notification **port** owned by Dev 1; they do not write the `notifications` table directly.
- **Shared components vs design tokens** — Dev 2 builds reusable primitives; Dev 3 owns the tokens they consume. **Nobody modifies another dev's rendering code** — request a change from the owner.
- **i18n** — Dev 2 owns the i18n/RTL plumbing; every dev adds their own message keys to the catalogs. No hardcoded user-facing strings.

### 6. Notes

- Each feature includes both backend and frontend work. Every backend task also includes the necessary migrations (tables, columns, indexes, RLS) on that dev's own tables.
- v1 is web-first. Native-only libraries are out of scope; if a feature needs one, wrap it via `.web.tsx` / `.native.tsx` so native can be added later — see [`CAUTIONS.md`](CAUTIONS.md).

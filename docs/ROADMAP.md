# Louaji — Roadmap (v1 + future releases)

> This file tracks **release scope and project-level engineering decisions**. [`SRS.md`](SRS.md) is the single source of truth for product features and their `MVP` / `FUTURE` / `IDEA` tags. This roadmap does _not_ restate the SRS. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's roadmap.

### Release scope

- **v1 — first release: web only.** Deployed on EAS Hosting. Everything in the `MVP` must run on web. This is the only release whose scope is committed.
- **Future releases — everything else.** Native iOS/Android apps and every `FUTURE` / `IDEA` item in the SRS land in later releases whose ordering is **not decided yet**. Committing to native brings `react-native-maps`, push, and EAS Build + EAS Submit online. Until then the codebase stays native-compatible from day 1 (via `.web.tsx` / `.native.tsx` resolution + cross-platform libraries) so adding native later is an _addition_, not a rewrite. See [`TECHNOLOGIES.md`](TECHNOLOGIES.md).

### Scope = SRS

- **`MVP` / `FUTURE` tags live in [`SRS.md`](SRS.md)** — every scope decision is recorded there. Do not copy feature lists here.
- When a feature moves `FUTURE → MVP` or back, update the SRS (append a dated correction there) and append a short dated entry _below this section_ citing the SRS section and who decided.
- When scoping work for a developer, cross-reference [`DEV_ZONES.md`](DEV_ZONES.md).

### Guiding principles

- The **fastest path to a usable booking flow** is the goal — don't gold-plate. A traveler searching a route and reserving a seat, and an operator publishing a departure and seeing who booked, is the whole of v1.
- **Search → results → seat selection → booking** is the core loop and should get the bulk of the engineering effort. Account, notifications, and the operator/super-admin surfaces support it.
- **Correctness over features for the booking core.** The seat-hold / no-double-booking guarantee is the one thing that must be right from day one (see [`ARCHITECTURE.md`](ARCHITECTURE.md) §6 and [`CAUTIONS.md`](CAUTIONS.md) §1). Everything else can iterate.
- **Lean vendor surface.** v1 runs on essentially Supabase + an SMS provider. No analytics/payment/email/maps vendors until a concrete need.

### Project-level engineering decisions (not per-feature, so they live here rather than in the SRS)

- **No automated tests.** Stated by the lead developer. Don't introduce test files, runners, or testing dependencies.
- **Cash on boarding only in v1.** No online payment, no platform-held funds. Online payment via a **Tunisian** gateway (Stripe doesn't operate in Tunisia) is `FUTURE` — see [`TECHNOLOGIES.md`](TECHNOLOGIES.md).
- **Phone-first identity.** Supabase Auth phone OTP is the primary credential; email/password optional; no social login in v1.
- **Arabic-first, RTL, tri-lingual (ar/fr/en)** from day one — not retrofitted. Cairo/Tajawal fonts. See [`DESIGN.md`](DESIGN.md).
- **Light theme only in v1.** Dark theme is `FUTURE`; every color is tokenized so it can be added without touching components.
- **Drizzle owns the full migration pipeline** (`db:generate` + `db:migrate`). Supabase CLI is container-lifecycle only.
- **No geo-hash columns.** PostGIS spatial indexes on `geography(POINT, 4326)` handle the (light, `MVP`) geo needs. Heavy geo (tracking) is `FUTURE`.
- **Web-first.** Any dependency that would prevent adding native later needs explicit justification.
- **UUIDv4 primary keys until Postgres 18.** `pg_uuidv7` isn't in the local Supabase Docker image (parity matters), and write-amplification isn't a bottleneck at our scale. Revisit when a PG 18 image ships to local CLI + hosted (native `uuidv7()` is then a one-line default swap, no data migration).

### How to apply

- Deciding _what_ the product does → write it in the SRS.
- Deciding _when_ to ship it → append a dated entry here.
- Deciding _who_ builds it → update [`DEV_ZONES.md`](DEV_ZONES.md).
- A project-level engineering choice → append it to the list above (extending/nuancing an existing decision) or as a new dated section (a new category).

### Indicative sequencing (not committed)

A rough order, owned by the lead developer and subject to change:

1. **Foundation** — schema, auth (phone OTP), city/route catalog, design system + app shell, i18n/RTL.
2. **Booking core** — search → results → trip detail + seat map → hold/confirm → confirmation; my bookings/tickets.
3. **Operator side** — operator onboarding + verification, fleet/vehicles + seat-layout designer, trip scheduling, seat board.
4. **Polish** — notifications (in-app + SMS), super-admin management, account screens.
5. **Then** — `FUTURE` items as prioritized: live tracking, ratings, online payment, stations, recurring schedules, native apps.

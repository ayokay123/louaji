# Louaji — Technologies

> Source of truth for the **stack we use, why, and where to learn more**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

> All docs URLs and version notes below were correct at the time the section was written. URLs and minor versions shift — when in doubt, click through to the official docs and verify.

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's stack doc. The app framework, language, styling, data layer, and hosting carry over (domain-agnostic). What changes: we **drop** the social-platform vendors (OpenAI moderation, Cloudflare R2 media, Stripe, FCM push, heavy product analytics, lifecycle email, Hungarian FTS) and **add** phone/SMS OTP auth, tri-lingual i18n + RTL, Arabic fonts, and — as `FUTURE` — a Tunisian payment gateway and maps for live tracking.

### Stack at a glance

| Layer                          | Choice                                                                  |
| ------------------------------ | ----------------------------------------------------------------------- |
| App framework                  | Expo (SDK 55+) + Expo Router                                            |
| Language                       | TypeScript (strict)                                                     |
| Web rendering                  | React Native for Web                                                    |
| Styling                        | NativeWind                                                              |
| Server data / cache            | `@tanstack/react-query`                                                 |
| Local state                    | Zustand (only when needed)                                              |
| Validation                     | Zod (v4)                                                                |
| Backend                        | Supabase (Postgres + Auth + Realtime + Edge Functions)                  |
| ORM + migrations               | Drizzle ORM + drizzle-kit (full pipeline)                               |
| Geo                            | PostGIS (`geography(POINT, 4326)` + GIST)                               |
| Auth                           | Supabase Auth — **phone OTP** (SMS), email/password optional            |
| SMS / OTP                      | SMS provider via Supabase Auth (Twilio default; local TN gateway alt)   |
| i18n                           | `i18next` + `react-i18next` + `expo-localization`                       |
| Fonts                          | Cairo + Tajawal (`@expo-google-fonts/*`)                                |
| Hosting (web)                  | EAS Hosting                                                             |
| CI runners                     | Blacksmith                                                              |
| Env validation                 | `@t3-oss/env-core` + Zod                                                |
| Dates                          | `date-fns` (+ `@date-fns/tz` for Africa/Tunis)                          |
| Misc                           | `expo-image`, `react-native-reanimated`, `react-native-gesture-handler` |
| **Payments** (`FUTURE`)        | Tunisian gateway (Flouci / Konnect / ClicToPay) — **not** Stripe        |
| **Maps / tracking** (`FUTURE`) | `@vis.gl/react-google-maps` (web) / `react-native-maps` (native)        |
| **Push** (`FUTURE`)            | web push limited; revisit with native                                   |
| Build/submit (native, later)   | EAS Build + EAS Submit                                                  |

---

### Release scope & tech-selection principle

- **v1 — first release: web only.** Deployed on EAS Hosting. Everything in the `MVP` must run on web. This is the only release whose scope is committed.
- **Future releases — everything else, ordering not committed.** Native iOS/Android, `FUTURE`-tagged SRS items (online payment, live tracking, ratings, stations, recurring schedules). When we commit to native, `react-native-maps`, push, EAS Build/Submit come online then. The codebase stays native-compatible from day 1 via `.web.tsx` / `.native.tsx` resolution.
- **Bias toward fewer vendors.** Every SaaS adds a DPA, secrets, and infra to monitor. v1 deliberately runs lean: Supabase + an SMS provider is essentially the whole external surface. No analytics/email/payment vendors until a concrete need arrives.
- **Web-first ≠ web-only forever.** Any choice that would _prevent_ adding native later needs explicit justification. Default cross-platform or swappable.

Before adding a dependency: "does this work on web today? will it work on native later?" Before adopting a SaaS vendor: "does an existing one already cover this?"

---

### Frontend

#### Expo (SDK 55+) + Expo Router

- **Why:** one codebase for web + iOS + Android, file-based routing, colocated server API routes, mature EAS build/deploy.
- **Docs:** https://docs.expo.dev/ · https://docs.expo.dev/router/introduction/ · API routes: https://docs.expo.dev/router/reference/api-routes/
- **Notes:** **SDK 55 (2026-02-25) dropped the Legacy Architecture — New Architecture (Fabric + TurboModules) only.** Any third-party native lib must support New Arch. Pin the SDK in `app.json`; bump deliberately.

#### React Native for Web

- **Why:** same RN components render on web with minimal divergence. Pairs with Expo Web.
- **Docs:** https://necolas.github.io/react-native-web/
- **Notes:** native-only modules don't work on web — use `.web.tsx` / `.native.tsx`. See [`CAUTIONS.md`](CAUTIONS.md).

#### NativeWind (v4+)

- **Why:** Tailwind utility classes across web + native; single styling system. Theme tokens (the green palette + Cairo/Tajawal scale from [`DESIGN.md`](DESIGN.md)) live in `tailwind.config.js`.
- **Docs:** https://www.nativewind.dev/
- **Notes:** v4 (4.2.x) stable. **RTL:** prefer logical utilities (`ps-`/`pe-`, `text-start`/`text-end`, `start-`/`end-`) over `pl-`/`pr-`/`left-`/`right-` so Arabic mirrors automatically.

#### TypeScript (strict) · `@tanstack/react-query` · Zustand · Zod (v4)

- **TypeScript** strict — see [`BEST_PRACTICES.md`](BEST_PRACTICES.md) §1. https://www.typescriptlang.org/docs/
- **React Query** v5 for all server data (search results, seat availability, bookings). https://tanstack.com/query/latest · key factory: https://tkdodo.eu/blog/effective-react-query-keys
- **Zustand** only for genuine global client state (e.g. the in-progress seat selection before checkout, locale toggle). Start without it. https://docs.pmnd.rs/zustand
- **Zod 4** at every boundary; root import `import * as z from "zod"`. Pin the version. https://zod.dev/ · v4 migration: https://zod.dev/v4/changelog

#### i18n & RTL

- **`i18next` + `react-i18next` + `expo-localization`** — three locales (`ar` primary/RTL, `fr`, `en`). Message catalogs under `src/shared/lib/i18n/`.
  - i18next: https://www.i18next.com/ · react-i18next: https://react.i18next.com/ · expo-localization: https://docs.expo.dev/versions/latest/sdk/localization/
- **RTL:** drive layout direction from the active locale. On web, set `dir="rtl"` on the document for Arabic; in RN use `I18nManager` awareness but prefer logical NativeWind utilities so we don't fight `I18nManager.forceRTL` reloads. Test FR/EN (LTR) and AR (RTL) on every screen — see [`CAUTIONS.md`](CAUTIONS.md).

#### Fonts — Cairo + Tajawal

- **`@expo-google-fonts/cairo` + `@expo-google-fonts/tajawal`** loaded with `expo-font` / `useFonts`. Cairo = headings/display, Tajawal = body/UI. Both cover Arabic + Latin. https://github.com/expo/google-fonts
- Preload before first paint; show a splash until fonts are ready to avoid a flash of fallback font.

#### Dates, animation, gestures, images

- **`date-fns`** (+ `@date-fns/tz` for Africa/Tunis math) — https://date-fns.org/ . The `tz` package is separate — install alongside.
- `react-native-reanimated` (Reanimated 4, New-Arch-only; also needs `react-native-worklets`) — seat-selection and success-screen motion. https://docs.swmansion.com/react-native-reanimated/
- `react-native-gesture-handler` — https://docs.swmansion.com/react-native-gesture-handler/
- `expo-image` — always set `width`/`height`. https://docs.expo.dev/versions/latest/sdk/image/

---

### Backend & data

#### Supabase

- **Why:** Postgres + Auth + Realtime + Edge Functions in one platform with an excellent local dev story (Docker via Supabase CLI).
- **Docs:** https://supabase.com/docs · Auth: https://supabase.com/docs/guides/auth · Phone login: https://supabase.com/docs/guides/auth/phone-login · Realtime: https://supabase.com/docs/guides/realtime/concepts · Edge Functions: https://supabase.com/docs/guides/functions
- **Notes:**
  - **Phone OTP** is configured under Auth → an SMS provider must be set (Twilio, MessageBird, Vonage, Textlocal). Each charges per SMS; configure templates and rate limits. See §SMS below.
  - **Edge Functions** (Deno): used for the **seat-hold expiry sweep** (scheduled), **SMS confirmation sends**, and future webhook handlers. Caps: wall clock 150s Free / 400s Paid, CPU 2s/req, 256 MB, 20 MB bundle. Keep bundles small.
  - **Realtime** (`FUTURE`/optional): live seat availability + live tracking. Watch the quotas in [`CAUTIONS.md`](CAUTIONS.md).

#### Drizzle ORM + drizzle-kit (full migration pipeline)

- **Why:** typed schema, typed nested-relation queries, and a merge-conflict-free migration pipeline (drizzle-kit v1.0-beta, per-migration snapshots, UUID `prevIds` chain — no shared journal).
- **Docs:** https://orm.drizzle.team/docs/overview · Supabase: https://orm.drizzle.team/docs/connect-supabase · relations: https://orm.drizzle.team/docs/rqb · RLS via `drizzle-orm/supabase`: https://orm.drizzle.team/docs/rls
- **Pipeline:** author in `src/db/schemas/*.ts` → `pnpm db:generate` (diff) or `pnpm db:generate:custom` (extensions, domains, trigger fns, **exclusion/unique constraints** for seat holds) → `pnpm db:migrate` (apply). `pnpm db:reset` wipes + replays. Supabase CLI is container-lifecycle only (`[db.migrations] enabled = false`). Full workflow: [`ENVIRONMENTS.md`](ENVIRONMENTS.md) §6.
- **Gotchas:** every FK needs an explicit `relations()` entry; PostGIS `geography` is introspected as `unknown` — wrap via `customType`; snake_case in DB ↔ camelCase in TS. Booking-confirm and seat-hold use `db.transaction(...)` — see [`ARCHITECTURE.md`](ARCHITECTURE.md) §6.

#### PostGIS

- **Docs:** https://postgis.net/docs/ · https://supabase.com/docs/guides/database/extensions/postgis
- **Use:** `cities.location geography(POINT,4326)` + GIST. `MVP` use is light (nearest/sort). The heavy use — distance-along-route, **live tracking** — is `FUTURE`. Always filter with `ST_DWithin`, never `ST_Distance(...) < X`. Enabled via a hand-authored `db:generate:custom` bootstrap migration.

#### Search — catalog-based, no FTS at MVP

- `MVP` search is an **exact origin/destination city pair on a date**, picked from the city catalog (a dropdown/typeahead over a small, controlled list). No full-text search engine needed. Fuzzy city/operator name matching via `pg_trgm` is **deferred** (`FUTURE`) — enable the extension only when a real typo-tolerance need surfaces.

---

### Auth & SMS

#### Supabase Auth — phone-first

- **Why:** identity is the Tunisian mobile number (the mockup keys everything off the phone). Phone OTP login + signup; email/password optional secondary. No social login.
- **Docs:** https://supabase.com/docs/guides/auth/phone-login
- **Notes:** verify on phone change; rate-limit OTP requests (cost + abuse). Store phone in E.164 (`+216########`).

#### SMS / OTP provider

- Supabase phone auth delegates SMS to a provider. **Default: Twilio** (broad TN deliverability, Verify API). Alternatives: MessageBird, Vonage, or a **local Tunisian SMS gateway** if pricing/deliverability favors it.
- Twilio: https://www.twilio.com/docs/verify · Supabase + Twilio: https://supabase.com/docs/guides/auth/phone-login/twilio
- **Notes:** SMS costs real money per message — budget and alert. Booking-confirmation SMS (transactional) also goes through the same provider via an Edge Function. Keep the provider key server-only.

---

### Payments (`FUTURE` — not in v1)

- **v1 has no online payment** — cash on boarding only (see [`SRS.md`](SRS.md) §4.5). No payment SDK ships in v1.
- When online payment is scoped, use a **Tunisian gateway** — **Stripe does not operate in Tunisia.** Candidates:
  - **Flouci** — https://flouci.com/ (TN mobile wallet / card).
  - **Konnect** — https://konnect.network/ (TN payment aggregator, card + wallet + e-DINAR).
  - **ClicToPay / SMT (Société Monétique Tunisie)** — bank card gateway used by Tunisian banks.
- Whichever is chosen sits behind a `PaymentGateway` port so the rest of the app is gateway-agnostic. Evaluate fees, settlement, refund support, and sandbox quality at selection time.

---

### Maps & tracking (`FUTURE`)

- Not needed for `MVP` (search is a city dropdown). When **live louage tracking** is scoped: `@vis.gl/react-google-maps` on web (https://visgl.github.io/react-google-maps/), `react-native-maps` on native, wrapped behind `src/shared/components/Map/`. Watch Google Maps per-SKU pricing (post-March-2025 model): https://developers.google.com/maps/billing-and-pricing/pricing . Don't leak `google.maps.*` types into callers.

---

### Hosting & CI

- **EAS Hosting** — web deploy, two aliases (`preview` = staging, `production`). https://docs.expo.dev/eas/hosting/
- **EAS Build & Submit** (native, later) — https://docs.expo.dev/eas/
- **Blacksmith** CI runners — https://www.blacksmith.sh/ . Full pipeline in [`ENVIRONMENTS.md`](ENVIRONMENTS.md).

---

### Env validation — `@t3-oss/env-core`

- **Why:** single typed, validated entry point for every `process.env.*` read; fails fast at boot if a required key is missing.
- **Docs:** https://env.t3.gg/ · core: https://env.t3.gg/docs/core
- **Pattern (this repo):** all keys declared in [src/shared/config/env.ts](../src/shared/config/env.ts) with `server` / `client` / `clientPrefix: "EXPO_PUBLIC_"`; `runtimeEnv` maps each key to a literal `process.env.FOO` (Expo's `no-dynamic-env-var` + Babel static inlining require literal dot access). App code never reads `process.env` directly. `dotenv` (devDependency) is used only by [drizzle.config.ts](../drizzle.config.ts) under `tsx`. See [`BEST_PRACTICES.md`](BEST_PRACTICES.md) §25.

---

### Excluded by decision

- **Stripe / non-TN payment processors** — Stripe doesn't operate in Tunisia; use a local gateway when online payment is scoped.
- **OpenAI / content moderation** — there is no user-generated content to moderate in Louaji.
- **Cloudflare R2 / heavy media storage** — no user media pipeline in v1 (logos/avatars are tiny; Supabase Storage suffices if needed).
- **PostHog / Smartlook / Hotjar, GA4/GTM/pixels, Loops, ZeptoMail, FCM** — no analytics/marketing/lifecycle-email/push vendor in v1. Add only with a concrete need.
- **Heavy form libraries** — inputs are controlled + zod-validated.
- **`react-native-maps` on web** — doesn't support web; native only, and only when tracking is scoped.

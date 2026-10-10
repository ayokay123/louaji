# Louaji — Software Requirements Specification (SRS)

> Source of truth for **what** we are building. This document follows the append-only rule defined in [`CLAUDE.md`](../CLAUDE.md): once the first version is committed, never edit content from prior dated sections — append a new dated section below.

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). This SRS replaces the prior product specification entirely — the project pivoted from a location-based social platform to **Louaji**, a louage (Tunisian shared-van) seat-reservation platform. Prior history lives in git.

Conventions in this document:

- Scope labels (`MVP`, `FUTURE`, `IDEA`) are kept verbatim and grep-able. `MVP` = committed to the first web release; `FUTURE` = later release, ordering not committed; `IDEA` = unconfirmed.
- Arabic terms appear inline in Arabic where they are part of the product's domain vocabulary (the UI is Arabic-first). Canonical definitions live in [`GLOSSARY.md`](GLOSSARY.md).
- UI **layout / visual** source of truth is [`DESIGN.md`](DESIGN.md) + the reference mockup. This SRS owns _behavior and rules_, not pixels.
- Technical implementation details (schema, RLS, concurrency) live in [`ARCHITECTURE.md`](ARCHITECTURE.md). This document owns _product requirements_; where a rule has a hard technical consequence it is flagged with a pointer.
- Where something is genuinely ambiguous, an inline `> NOTE:` flags it rather than guessing.

---

# 0. Product summary

**Louaji** ("وصلك في وقتو" — _gets you there on time_) lets travelers in Tunisia **search intercity louage departures and reserve seats** ahead of arriving at the station. Two sides:

- **Passenger app** — search a route (from city → to city, on a date), browse available departures (company, times, price, free seats), pick specific seats from a seat map, and reserve them. Payment is **cash on boarding** (`الدفع عند الصعود`) for the first release.
- **Operator admin** — transport **companies** and **independent drivers** publish departures, manage their fleet and seats, and see/manage the bookings on their trips.
- **Platform super-admin** — manages the city/station catalog, verifies operators, and oversees the platform.

**Release scope** (owned by [`ROADMAP.md`](ROADMAP.md)): v1 is **web only**. Native apps and `FUTURE`-tagged features come later.

---

# 1. Actors & roles

| Actor                      | Description                                                                                                                                                                                                               | Account                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Passenger** (`مسافر`)    | Books seats on departures. The default account type.                                                                                                                                                                      | Phone-first (Tunisian number) + password; email optional.                                                                        |
| **Company admin** (`شركة`) | Owns/operates a transport company. Manages the company's fleet, drivers, routes, departures, prices, and bookings.                                                                                                        | An operator account with the `company_admin` role bound to one company. A company can have an **owner** + **manager** sub-roles. |
| **Driver** (`سائق`)        | Drives a louage. Two flavors: (a) a driver **employed by a company** — sees the trips assigned to them; (b) an **independent driver** — operates their own vehicle and publishes their own departures (no company layer). | Operator account with the `driver` role. Independent drivers own vehicles/trips directly.                                        |
| **Super-admin**            | Louaji platform staff. Manages the city/station catalog, verifies and suspends operators, manages users, oversees the platform.                                                                                           | Internal account with the `super_admin` role. Invite-only.                                                                       |

`MVP`: all four actors. Role grants are per-account and configurable (see [`ARCHITECTURE.md`](ARCHITECTURE.md) for the authorization model). The terms **operator** (= a company _or_ an independent driver) and **trip** (= a single scheduled departure) are used throughout — see [`GLOSSARY.md`](GLOSSARY.md).

---

# 2. Passenger app

### 2.1 Onboarding & authentication `MVP`

- **Phone-first.** Identity is the Tunisian mobile number (`+216`, 8 local digits). Registration: name + phone, verified via **SMS one-time code (OTP)**. Email + password are optional secondary credentials.
- **Guest browsing.** Search and browsing of departures is available **without an account** (the splash offers `تخطي` — skip). An account is required only to **confirm a booking** (we need a name + phone to attach the reservation, and the booking history needs an owner).
- **Login / signup / skip** from the splash screen (`تسجيل الدخول` / `إنشاء حساب` / `تخطي`).
- Minimum profile to book: **full name + verified phone**. That is the whole gate — there is no heavy onboarding.

> NOTE: Whether guests can complete a booking purely with name+phone (a "guest checkout" that creates a lightweight account keyed by phone) or must register first is a product call. Default assumption: confirming a booking **upgrades** the guest into a real account keyed by the verified phone. Flagged for the lead developer.

### 2.2 Home & search `MVP`

The home screen greets the user and asks "وين تحب تروح اليوم؟" (where do you want to go today?). Search inputs:

- **From** (`من وين؟`) — origin city. `MVP` city-level (e.g. Tunis, Sousse, Sfax, Nabeul…). Selected from the city catalog (see §5).
- **To** (`إلى وين؟`) — destination city.
- **Date** (`التاريخ`) — travel date. Defaults to today.
- **Search** (`بحث`) CTA → results.
- A **swap** affordance to flip origin/destination is expected.

**Recent searches** (`آخر عمليات البحث`) — the user's last route+date searches, tappable to re-run, with a "view all" (`عرض الكل`). Stored per user (see §6 search history). For guests, stored in local storage.

Validation: origin ≠ destination; date not in the past; both cities must exist and be active.

### 2.3 Search results `MVP`

Header shows the route (`تونس → سوسة`) and the selected date, with **day chips** for adjacent dates (السبت 25 / الأحد 26 / …) so the user can jump ±days without re-searching. A count line ("`تتوفر 6 للواج`" — 6 departures available).

Each result is a **departure card** showing:

- Departure time and origin (`07:00 — تونس`)
- Arrival time and destination (`08:00 — سوسة`) — estimated
- **Operator name** (company or driver, e.g. `شركة السريعة`, `السريعة VIP`)
- **Free-seat count** (`9 أماكن متوفرة`) — green when available, distinct when low/sold out
- **Price per seat** (`15.000 دت`)
- Vehicle class/icon

Sorting: by departure time ascending (`MVP`). Only departures with status `scheduled`/`boarding` and at least one free seat on the chosen date are listed; **sold-out** departures may still be shown but visually marked and non-bookable (`FUTURE` decision — default `MVP`: hide sold-out).

`FUTURE`: filters (price, operator, departure window, vehicle class), sort options.

### 2.4 Trip details & seat selection `MVP`

Trip detail (`تفاصيل اللواج`) repeats the trip summary (origin/destination, departure/arrival times, operator, date, vehicle) and presents the **seat map** ("اختر بلاصتك" — choose your seat).

- The seat map renders the vehicle's **seat layout** (see §5 vehicles): the driver position (`سائق`) and the numbered passenger seats (e.g. 1–8 / 1–12 depending on the vehicle).
- **Seat states** (canonical names in [`GLOSSARY.md`](GLOSSARY.md)):
  - **Available** (`متاح`) — selectable.
  - **Selected** (`مختار`) — the seats this user is currently choosing (green).
  - **Reserved** (`محجوز`) — held or booked by someone else; not selectable.
  - **Blocked** (`X`) — permanently unavailable on this vehicle (broken seat, driver seat, layout gap).
- The user selects one or more seats, then confirms (`تأكيد الحجز`).

**Seat-hold rule (concurrency) `MVP`:** selecting seats and proceeding to checkout places a **temporary hold** on those exact seats so two passengers cannot book the same seat. A hold has a short expiry (default **10 minutes** — final value owned by [`ARCHITECTURE.md`](ARCHITECTURE.md)). If the hold expires before confirmation, the seats are released and the user must re-pick. The hard guarantee against double-booking is a uniqueness constraint on `(trip, seat)` — see [`ARCHITECTURE.md`](ARCHITECTURE.md) §"Booking & seat reservation".

`FUTURE`: live seat-availability updates (a seat greying out in real time as another passenger books it) via Realtime.

### 2.5 Booking summary & confirmation `MVP`

**Summary** (`ملخص الحجز`) shows the trip summary plus **booking details** (`تفاصيل الحجز`):

- **Seats** (`المقاعد`) — e.g. `2, 5`
- **Total price** (`السعر الإجمالي`) — seats × price-per-seat, e.g. `30.000 دت`
- **Full name** (`الاسم الكامل`)
- **Phone** (`رقم الهاتف`)
- **Payment method** (`طريقة الدفع`) — **cash on boarding** (`الدفع عند الصعود`) for `MVP`. No online payment in v1.
- Confirm (`تأكيد الحجز`).

On confirm, the held seats are converted into a confirmed booking atomically (see [`ARCHITECTURE.md`](ARCHITECTURE.md)).

**Confirmation** (`تم الحجز بنجاح!` — booking successful): shows the **booking number** and offers `عرض تذكرتي` (view my ticket) / `العودة للرئيسية` (back home). A confirmation is sent to the passenger's phone (SMS) `MVP`.

**Booking number format `MVP`:** `LJ` + travel date as `DDMMYY` + `-` + a 4-digit suffix. Example from the mockup: `LJ250524-7285` = travel date 25/05/24. The suffix is unique within that date/operator scope.

> NOTE: `250524` is read as **DDMMYY** (25 May 2024), matching the mockup's `25 ماي 2024`. If the product wants `YYMMDD` instead, flag before the code follow-up — it changes the generator.

### 2.6 My bookings & tickets `MVP`

- **My bookings** (`حجوزاتي`) with tabs **Upcoming** (`القادمة`) and **Past** (`الماضية`). Each entry: date, route, operator, seat list, and a **status chip** (`مؤكد` = confirmed, `ملغى` = cancelled, etc.).
- **Ticket** (`التذكرة`) — the bookable artifact the passenger shows at boarding: booking number, route, date, departure time, operator, seat numbers, passenger name. A scannable code (QR/barcode) is `FUTURE` (boarding is manual at `MVP`).
- **Cancellation `MVP`:** a passenger may cancel an upcoming booking up to a cutoff before departure (default: any time before `departed`; final policy owned here — see §4.4). Cancellation releases the seats back to availability and notifies the operator.

### 2.7 Account `MVP`

Account (`حسابي`) shows the profile header (name, phone, edit) and a menu:

- **Personal info** (`المعلومات الشخصية`) — edit name, phone (re-verify on change), email.
- **Payment methods** (`طرق الدفع`) — `MVP` shows only cash-on-boarding; real saved methods are `FUTURE` (online payment).
- **Notifications** (`إشعاراتي`) — notification preferences & history (see §6).
- **Help & support** (`المساعدة والدعم`) — `MVP` static help + contact; in-app support chat is `FUTURE`.
- **About** (`حول التطبيق`).
- **Logout** (`تسجيل الخروج`).

---

# 3. Operator admin (companies & drivers)

The admin side lets operators publish and run departures. Companies and independent drivers share most screens; the difference is the **company layer** (multiple drivers/vehicles, owner/manager roles) that independent drivers don't have.

### 3.1 Operator onboarding & profile `MVP`

- A company or independent driver registers as an operator and is **verified by a super-admin** before their departures become publicly bookable (`MVP` — manual verification; prevents fake operators).
- **Company profile:** name (ar/fr/en), logo, contact phone, optional description. Owner + optional managers.
- **Driver profile:** name, phone, optional license reference. For independent drivers this is also the operator profile.
- Verification status is visible to the operator and gates public visibility of their trips.

### 3.2 Fleet & vehicles `MVP`

- An operator manages its **vehicles** (louages): plate number, model/label, **seat capacity**, and **seat layout** (which grid positions are seats, which is the driver, which are permanently blocked).
- Seat layout drives the passenger seat map (§2.4). `MVP` supports common Tunisian configurations (8/9 seats) and the larger configurations shown in the mockup (up to ~12); the layout is data, not hardcoded.
- Companies can have many vehicles; an independent driver typically has one.

### 3.3 Routes `MVP`

- Operators run trips on **routes** (origin city → destination city). The route catalog (city pairs) is shared; an operator selects which routes they serve. Estimated duration/distance per route informs arrival-time defaults.

### 3.4 Departures (trips) — scheduling `MVP`

The core admin task: publish a **trip** = a single scheduled departure.

- Pick **route** (from/to), **date**, **departure time**, estimated **arrival time**, **price per seat** (in dinars/millimes), and assign a **vehicle** (and, for companies, a **driver**).
- The trip's seat inventory is derived from the assigned vehicle's layout.
- Trip **status** lifecycle (see §4): `scheduled → boarding → departed → completed`, with `cancelled` available before departure.
- `FUTURE`: recurring schedules (publish a daily/weekly template instead of one trip at a time), capacity templates, dynamic pricing.

### 3.5 Bookings & seat board `MVP`

- For each trip, the operator sees the **seat board**: which seats are free / held / booked, and the passenger (name + phone) per booked seat.
- Actions: mark a passenger **boarded** / **no-show** at departure; cancel a trip (notifies all booked passengers and releases their bookings); view totals (seats sold, expected cash).
- An operator cannot see other operators' trips or passengers (enforced by RLS — see [`ARCHITECTURE.md`](ARCHITECTURE.md)).

### 3.6 Operator dashboard `MVP`

A simple overview: today's departures, upcoming trips, seats sold / occupancy, and quick links to publish a trip or open a seat board.

`FUTURE`: revenue analytics, occupancy trends, passenger ratings (§7).

---

# 4. Core domain rules

### 4.1 Cities & routes

- A **route** is directional: `origin_city → destination_city`. Tunis→Sousse and Sousse→Tunis are two routes.
- Search matches an exact origin/destination city pair on a date. `MVP` is city-level; multi-station-per-city is `FUTURE` (§5).

### 4.2 Trip & seat inventory

- A trip's total seats come from its vehicle's seat layout. Blocked positions never count as inventory.
- A seat is **available** when it has no confirmed booking **and** no active (non-expired) hold for that trip.

### 4.3 Booking & seat-hold lifecycle (concurrency) `MVP`

This is the most safety-critical flow. Product-level rules (technical realization in [`ARCHITECTURE.md`](ARCHITECTURE.md)):

1. **Hold** — when a passenger proceeds from seat selection to checkout, the chosen seats are held for that passenger with an expiry (default 10 min). Holding a seat already booked or held by someone else fails; the UI tells the passenger those seats are gone.
2. **Confirm** — confirming converts the holds into a **confirmed booking** atomically. If any held seat is no longer valid (expired and snatched), confirmation fails and the passenger re-picks.
3. **Expire** — unconfirmed holds expire automatically and the seats return to availability.
4. **Hard guarantee** — a uniqueness constraint on `(trip, seat)` for confirmed bookings makes a double-booking impossible even under a race.

### 4.4 Cancellation & no-show `MVP`

- **Passenger cancellation** releases seats and notifies the operator. Default policy: allowed any time before the trip is marked `departed`. (A stricter cutoff, e.g. "≥1h before departure", is a tunable the lead developer may set.)
- **Operator trip cancellation** releases all bookings on the trip and notifies every booked passenger.
- **No-show** is recorded per booking by the operator at boarding; it does not refund anything (payment is cash on boarding) but feeds future reliability signals (`FUTURE`).

### 4.5 Payment `MVP`

- **Cash on boarding only** in v1 (`الدفع عند الصعود`). No card capture, no escrow, no platform-held funds. Total price is informational (what the passenger will pay the driver).
- `FUTURE`: online payment via a Tunisian gateway (see [`TECHNOLOGIES.md`](TECHNOLOGIES.md)) with the platform optionally taking a fee; cancellation/refund rules would then need real money semantics.

### 4.6 Money & currency `MVP`

- Currency is the **Tunisian dinar (TND)**. The dinar subdivides into **1000 millimes**. Prices are stored as **integer millimes** and displayed with three decimals, e.g. `15.000 دت`, `30.000 دت`, `17.000 دت`. Never store money as a float. See [`CAUTIONS.md`](CAUTIONS.md).

### 4.7 Dates & times `MVP`

- Departures are local Tunisian time (Africa/Tunis, no DST). A trip's `service_date` + `departure_time` define when it leaves. See [`CAUTIONS.md`](CAUTIONS.md) for the timezone-handling rule.

---

# 5. Cities, stations & catalog

- **Cities** `MVP` — the searchable origin/destination units. Each city has a name in **ar/fr/en**, a governorate, and a coordinate (for distance/sorting and future map/tracking use). Maintained by super-admins.
- **Stations** `FUTURE` — real louage stations within a city (e.g. a city may have several departure stations). v1 treats search at city granularity; the model is designed so stations can be added without reworking search.
- The catalog (cities, routes) is **super-admin-owned**; operators select from it, they do not invent cities.

---

# 6. Cross-cutting passenger/operator features

### 6.1 Search history `MVP`

- Per-user record of recent route+date searches, surfaced as "recent searches" on home. Recency-ordered. Guests: local storage.

### 6.2 Notifications `MVP`

- **Passenger:** booking confirmed, trip reminder (before departure), trip cancelled by operator, seat/booking cancelled.
- **Operator:** new booking on a trip, passenger cancellation.
- In-app notification center with read/unread. **SMS** is used for the booking confirmation and for operator-initiated trip cancellations (things a passenger must not miss). Push notifications are `FUTURE` (web push is limited; see [`CAUTIONS.md`](CAUTIONS.md)).

### 6.3 Internationalization & RTL `MVP`

- The app ships **Arabic (primary, RTL), French, and English**. Arabic UI copy uses Tunisian phrasing (see the mockup). Layout mirrors correctly in RTL. Fonts: **Cairo / Tajawal**. See [`DESIGN.md`](DESIGN.md) and [`TECHNOLOGIES.md`](TECHNOLOGIES.md).
- City/operator names are stored multilingually where it makes sense; user-entered names (passenger name) are stored as entered.

---

# 7. Future / ideas (not committed)

From the mockup footnote ("هذه مجرد فكرة للواجهة… تتبع اللواج مباشر، تقييم السائق والشركة، عروض خاصة…") and product discussion:

- **`FUTURE` Live louage tracking** — show the vehicle's live position en route (the splash lists "تتبع اللواج (مستقبلاً)" — tracking, later). Needs driver-side GPS, maps, Realtime.
- **`FUTURE` Driver & company ratings** — passengers rate the trip/driver/company; ratings feed operator reputation and result ranking.
- **`FUTURE` Special offers / promotions** — discounts, promo codes, loyalty.
- **`FUTURE` Online payment** — Tunisian payment gateway, platform fee, refunds.
- **`FUTURE` Stations within cities** — sub-city departure points.
- **`FUTURE` Recurring schedules** — operators publish repeating templates.
- **`FUTURE` Native iOS/Android apps** — v1 is web only; see [`ROADMAP.md`](ROADMAP.md).
- **`FUTURE` In-app support chat** — beyond static help.
- **`IDEA` Multi-leg / connecting routes**, **`IDEA` seat preferences**, **`IDEA` waitlist for sold-out departures**.

---

# 8. Related documents

- [`DESIGN.md`](DESIGN.md) — visual design system, tokens, and screen inventory (UI source of truth).
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — data model, booking/seat-hold concurrency, RLS, system structure.
- [`TECHNOLOGIES.md`](TECHNOLOGIES.md) — stack, auth/SMS, i18n, payment (future).
- [`GLOSSARY.md`](GLOSSARY.md) — domain vocabulary (louage, operator, trip, seat states…).
- [`DEV_ZONES.md`](DEV_ZONES.md) — per-developer ownership.
- [`ROADMAP.md`](ROADMAP.md) — release scope and engineering decisions.
- [`ENVIRONMENTS.md`](ENVIRONMENTS.md), [`BEST_PRACTICES.md`](BEST_PRACTICES.md), [`CAUTIONS.md`](CAUTIONS.md) — engineering operations.

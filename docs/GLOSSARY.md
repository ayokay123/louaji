# Louaji — Glossary

> Source of truth for **the words we use**. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Replaces the prior project's glossary.

### Product / domain terms

| Term                                      | Definition                                                                                                                                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Louaji**                                | The product. A web (later native) platform to search intercity **louage** departures in Tunisia and reserve seats. Tagline "وصلك في وقتو" (_gets you there on time_). v1 is web-only.                                                        |
| **Louage** (`لواج`)                       | A Tunisian shared inter-city van/taxi that runs fixed city-to-city routes, departing from louage stations. The vehicle being booked.                                                                                                         |
| **Operator**                              | A party that runs departures: a **company** _or_ an **independent driver**. Not a physical table — a read-time union over `companies` and `drivers` (see [`ARCHITECTURE.md`](ARCHITECTURE.md) §5).                                           |
| **Company** (`شركة`)                      | A transport company operating a fleet of louages, with drivers, vehicles, and published departures (e.g. `شركة السريعة`, `السريعة VIP`). Has an owner + optional managers.                                                                   |
| **Driver** (`سائق`)                       | A person who drives a louage. **Company driver:** sees the trips assigned to them. **Independent driver:** operates their own vehicle and publishes their own departures (no company).                                                       |
| **Super-admin**                           | Louaji platform staff. Manages the city/route catalog, verifies/suspends operators, manages users. Invite-only.                                                                                                                              |
| **Passenger** (`مسافر`)                   | A traveler who searches departures and reserves seats. Default account type.                                                                                                                                                                 |
| **City**                                  | A searchable origin/destination unit (e.g. Tunis, Sousse, Sfax, Nabeul). Has multilingual name, governorate, coordinate. v1 search is city-level.                                                                                            |
| **Station** (`محطة`)                      | A real louage departure point within a city. `FUTURE` — v1 searches at city granularity.                                                                                                                                                     |
| **Route**                                 | A **directional** city pair (`origin → destination`). Tunis→Sousse and Sousse→Tunis are two routes.                                                                                                                                          |
| **Vehicle**                               | A specific louage owned by an operator: plate, model, seat count, and **seat layout**.                                                                                                                                                       |
| **Seat layout**                           | The grid description of a vehicle's seats — which positions are passenger seats, which is the driver (`سائق`), which are permanently blocked. Drives the passenger seat map.                                                                 |
| **Trip** (a.k.a. **departure**)           | A single scheduled departure: route + operator + vehicle + `service_date` + departure/arrival time + price per seat. The unit a passenger books onto.                                                                                        |
| **Trip status**                           | `scheduled → boarding → departed → completed`, plus `cancelled` before departure. See [`ARCHITECTURE.md`](ARCHITECTURE.md) §7.                                                                                                               |
| **Seat** (`بلاصة` / `مقعد`)               | A numbered position on a trip's vehicle.                                                                                                                                                                                                     |
| **Seat states**                           | **Available** (`متاح`) — bookable. **Selected** (`مختار`) — the current user's in-progress choice. **Reserved** (`محجوز`) — held/booked by someone else. **Blocked** (`X`) — permanently unavailable (driver seat, broken seat, layout gap). |
| **Seat hold**                             | A short-lived lock (default 10 min) placed on chosen seats during checkout so two passengers can't book the same seat. Expires if not confirmed. See [`ARCHITECTURE.md`](ARCHITECTURE.md) §6.                                                |
| **Booking** (`حجز`)                       | A passenger's reservation of one or more seats on a trip. Has a status, total price, and a booking number.                                                                                                                                   |
| **Booking number**                        | Human-readable reservation id: `LJ` + travel date `DDMMYY` + `-` + 4 digits (e.g. `LJ250524-7285`).                                                                                                                                          |
| **Booking status**                        | `confirmed` → `boarded` / `no_show` (operator at boarding) or `cancelled` (passenger/operator).                                                                                                                                              |
| **Cash on boarding** (`الدفع عند الصعود`) | The v1 payment method: the passenger pays the driver in cash when boarding. No online payment, no platform-held funds.                                                                                                                       |
| **No-show**                               | A confirmed passenger who didn't board. Recorded by the operator; no refund (cash).                                                                                                                                                          |
| **Seat board**                            | The operator's per-trip view of every seat's state + the passenger booked on each.                                                                                                                                                           |
| **Ticket** (`التذكرة`)                    | The artifact a passenger shows at boarding: booking number, route, date, time, operator, seats, name. Scannable code is `FUTURE`.                                                                                                            |
| **Recent searches** (`آخر عمليات البحث`)  | The user's last route+date searches, surfaced on home. Per-user; local storage for guests.                                                                                                                                                   |
| **Verification (operator)**               | Super-admin approval that makes an operator's departures publicly bookable. Guards against fake operators.                                                                                                                                   |

### Money, locale & time

| Term                | Definition                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **TND**             | Tunisian dinar — the currency. Displayed as `دت`.                                                                                               |
| **Millime**         | 1/1000 of a dinar. Money is stored as **integer millimes**; `15.000 دت` = 15 000 millimes. Never stored as float.                               |
| **Africa/Tunis**    | The single timezone for all departures (no DST). Travel times are local.                                                                        |
| **RTL**             | Right-to-left layout, used for Arabic (the primary locale). FR/EN render LTR. Handled via logical (start/end) layout, not hardcoded left/right. |
| **Cairo / Tajawal** | The Arabic+Latin font families. Cairo for headings/display, Tajawal for body. See [`DESIGN.md`](DESIGN.md).                                     |
| **Locale**          | One of `ar` (primary, RTL), `fr`, `en`.                                                                                                         |

### Technical terms

| Term                           | Definition                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP**                        | The first release (v1, web only). `MVP`-tagged items in the SRS are in scope; `FUTURE` / `IDEA` are deferred.                                                    |
| **v1**                         | First release: web only (EAS Hosting). The only release whose scope is committed. Native apps + `FUTURE` items land later.                                       |
| **SRS**                        | Software Requirements Specification — the product spec. [`SRS.md`](SRS.md).                                                                                      |
| **Hexagonal architecture**     | Ports & Adapters. Core domain logic depends only on interfaces (`ports/`); concrete service code lives in `adapters/`. See [`ARCHITECTURE.md`](ARCHITECTURE.md). |
| **Port**                       | An interface declared by the core (e.g. `TripRepository`, `BookingRepository`, `SmsSender`).                                                                     |
| **Adapter**                    | A concrete implementation of a port against a real service.                                                                                                      |
| **Use case**                   | A pure domain function — business logic with no I/O. Calls ports, returns data or domain errors.                                                                 |
| **Domain error**               | A typed error class in `core/errors/<feature>/` (e.g. `SeatUnavailable`, `HoldExpired`). Adapters translate vendor errors into these.                            |
| **API route**                  | An Expo Router server endpoint colocated with client code. Validates input (zod), wires adapters into use-cases, maps domain errors → HTTP.                      |
| **RLS**                        | Row Level Security — Postgres per-request row filtering. Our authorization boundary. See [`ARCHITECTURE.md`](ARCHITECTURE.md) §8.                                |
| **Seat-hold transaction**      | The atomic insert of `seat_holds` rows guarded by a `(trip_id, seat_number)` unique constraint — the concurrency mechanism that prevents double-booking.         |
| **PostGIS**                    | Postgres spatial extension. Used for city coordinates and (`FUTURE`) tracking.                                                                                   |
| **`geography(POINT, 4326)`**   | The PostGIS column type for locations. EPSG:4326 = WGS84. Distances in meters.                                                                                   |
| **GIST index**                 | The spatial index type for fast PostGIS lookups.                                                                                                                 |
| **`ST_DWithin`**               | PostGIS "within X meters" function — uses the GIST index (unlike `ST_Distance(...) < X`).                                                                        |
| **Drizzle**                    | TypeScript ORM. Owns schema authoring, type inference, query building, **and** migrations (drizzle-kit).                                                         |
| **`relations()`**              | Drizzle's API for declaring FK relationships, required for nested-with query type inference.                                                                     |
| **drizzle-kit migrate**        | The migration applier. The full pipeline (generate + migrate) runs through Drizzle; Supabase CLI is container-lifecycle only.                                    |
| **Edge Function**              | A Supabase Deno serverless function. Used for cron sweeps (hold expiry), SMS sends, and other server-only work outside Expo Router routes.                       |
| **EAS**                        | Expo Application Services — EAS Build, Submit, Update, Hosting.                                                                                                  |
| **EAS Hosting**                | Expo's web hosting product. Our web deployment target.                                                                                                           |
| **NativeWind**                 | Tailwind CSS for React Native — single styling system across web and native. Theme tokens live in `tailwind.config.js`.                                          |
| **OTP**                        | One-time passcode sent by SMS for phone verification / login.                                                                                                    |
| **`.web.tsx` / `.native.tsx`** | File-extension resolution for swapping web vs native implementations. Preferred over inline `Platform.select`.                                                   |

# Louaji — Design System & UI

> Source of truth for **how the product looks and feels**. The SRS owns behavior; this doc owns the visual language, design tokens, and the screen inventory. Append-only history per [`CLAUDE.md`](../CLAUDE.md).

---

## 2026-05-28 — Original entry (Louaji)

**Stewarded by:** Constantin (lead developer). Derived from the Louaji reference mockup ([`assets/louaji-mockup.jpeg`](assets/louaji-mockup.jpeg)). This file replaces the previous project's "UI lives only in Figma" rule: until a Figma file exists, **the reference mockup + the tokens in this document are the visual source of truth.** When a Figma file is set up, link it here in a new dated section and treat it as authoritative for pixels; this doc keeps owning tokens.

### Design intent

Modern, friendly, **fast** intercity-travel booking — closer to a polished transit app than a generic CRUD admin. The mockup direction: clean white/off-white surfaces, a confident **green** brand, soft rounded cards with gentle depth, generous spacing, and a warm Arabic-first personality. **Arabic-first, RTL** by default; French and English mirror back to LTR.

Quality bar (per the project's design-quality rules): clear typographic hierarchy through scale contrast; intentional spacing rhythm (not uniform padding everywhere); depth via soft surfaces/shadows, not flat boxes; designed hover/press/focus/disabled states; status communicated with color **and** label; never a default-template look. The seat map and booking confirmation are signature moments — they should feel crafted, not utilitarian.

---

### 1. Color

Palette derived from the mockup's "الألوان" swatches: a green ramp (deep → mint), warm neutrals, and a charcoal ink. Tokens are the contract; raw hex never appears in component code (they live in `tailwind.config.js` — see [`BEST_PRACTICES.md`](BEST_PRACTICES.md) §10).

| Token                               | Hex (approx.) | Use                                                                    |
| ----------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `brand/900` (`green-deep`)          | `#0B3D26`     | Logo ground, darkest accents, high-contrast text on light.             |
| `brand/700` (`green-dark`)          | `#13693B`     | Pressed CTA, headings accent, wordmark on light.                       |
| `brand/500` (`green` — **primary**) | `#1FA45D`     | Primary CTAs (`بحث`, `تأكيد الحجز`), active tab, selected seat, brand. |
| `brand/300` (`green-soft`)          | `#8FCDAC`     | Secondary fills, soft highlights, low-emphasis chips.                  |
| `brand/100` (`green-tint`)          | `#E7F4EC`     | Selected-seat background tint, success surface, subtle section bg.     |
| `ink/900` (`text`)                  | `#1C2420`     | Primary text.                                                          |
| `ink/600` (`text-muted`)            | `#5E6B64`     | Secondary text, captions, placeholder.                                 |
| `neutral/300` (`border`)            | `#E3E7E4`     | Borders, dividers, seat outlines.                                      |
| `neutral/200` (`surface-alt`)       | `#F4F6F4`     | App background / off-white.                                            |
| `neutral/0` (`surface`)             | `#FFFFFF`     | Cards, sheets, inputs.                                                 |
| `state/success`                     | `#1FA45D`     | Confirmed status chip (`مؤكد`), success screen.                        |
| `state/warning`                     | `#E0A030`     | Low-seats / pending.                                                   |
| `state/danger`                      | `#D7453B`     | Cancelled (`ملغى`), destructive (`تسجيل الخروج`), errors.              |

Seat-map color mapping (see [`GLOSSARY.md`](GLOSSARY.md) for state names):

| Seat state                      | Fill          | Outline / text                  |
| ------------------------------- | ------------- | ------------------------------- |
| Available (`متاح`)              | `surface`     | `border` outline, `text` number |
| Selected (`مختار`)              | `brand/500`   | white number                    |
| Reserved (`محجوز`)              | `neutral/200` | `text-muted`, lock affordance   |
| Blocked / driver (`X` / `سائق`) | `neutral/300` | `text-muted`, icon              |

- **Contrast:** all text/background pairings meet **WCAG AA**. `brand/500` on white passes for large text and UI; use `brand/700`/`ink/900` for small body text on light.
- **Theme:** the mockup is a **single light theme**. v1 ships light only. A dark theme is `FUTURE` — but define every color via token so a dark ramp can be added without touching components. (This overrides the prior project's "dark mode is first-class" stance — see [`BEST_PRACTICES.md`](BEST_PRACTICES.md).)

### 2. Typography

- **Families:** **Cairo** and **Tajawal** (Google Fonts; first-class Arabic + Latin). Cairo for headings/display and emphasis; Tajawal for body/UI text. Loaded via `@expo-google-fonts/cairo` + `@expo-google-fonts/tajawal` (see [`TECHNOLOGIES.md`](TECHNOLOGIES.md)).
- Both cover Arabic, French, and English glyphs — one type system across all three locales.
- **Scale** (fluid sizes tuned per platform; names are the token contract):

| Token       | Role                                                            |
| ----------- | --------------------------------------------------------------- |
| `display`   | Splash wordmark, big numbers (price total, booking number).     |
| `h1` / `h2` | Screen titles (`تفاصيل اللواج`, `ملخص الحجز`), section headers. |
| `body`      | Default text.                                                   |
| `caption`   | Times, seat counts, metadata, helper text.                      |
| `label`     | Buttons, chips, tab labels.                                     |

- Numerals: support both Western (`0-9`) and Arabic-Indic where the locale calls for it; times/prices in the mockup use Western digits — default to Western, revisit per-locale if needed.
- **RTL:** never hardcode text alignment; use logical alignment (start/end) so Arabic renders right-aligned and FR/EN left-aligned automatically.

### 3. Shape, depth & spacing

- **Radius:** cards/sheets ~`16–20`; inputs/buttons ~`12`; seat tiles ~`10`; chips/pills fully rounded. The mockup is consistently soft-cornered.
- **Elevation:** soft, low-spread shadows on cards and the bottom tab bar; avoid harsh borders. Surfaces float on the off-white background.
- **Spacing:** generous and rhythmic — comfortable card padding, clear separation between sections, roomy tap targets. Not uniform padding everywhere; lead with hierarchy.
- **Touch targets:** ≥ 44×44.

### 4. Core components

- **Buttons:** primary (filled `brand/500`, white label — the green CTAs), secondary (outline / `surface` with `border`), text/link, and destructive (`state/danger`). Full press/disabled/loading states.
- **Inputs:** rounded `surface` fields with a leading icon (location pin for from/to, calendar for date), `text-muted` placeholder, clear focus ring. RTL-aware icon placement.
- **Cards:** departure card (§5.3 of SRS), booking card, vehicle card — soft surface, clear hierarchy (time/price prominent, metadata muted).
- **Status chips:** rounded pills — `مؤكد` (success), `ملغى` (danger), low-seats (warning). Color + label, never color alone.
- **Day chips:** horizontal scroller of date pills with a selected (filled green) state.
- **Seat tile:** rounded square, number centered, state-colored per the table in §1; selected animates in.
- **Bottom tab bar:** 4 tabs — **Home** (`الرئيسية`), **Bookings** (`حجوزاتي`), **Tickets** (`التذاكر`), **Account** (`حسابي`) — icon + label, active tab in `brand/500`. In RTL the first tab sits on the right.
- **Success / confetti:** the booking-success moment uses a celebratory illustration (green shield/ticket check) — a deliberate signature screen.

### 5. Screen inventory

Behavior for each is specified in [`SRS.md`](SRS.md); this is the surface checklist.

**Passenger**

1. Splash / intro — logo, tagline, feature highlights, `تسجيل الدخول` / `إنشاء حساب` / `تخطي`.
2. Auth — login, signup (phone + OTP), phone verification.
3. Home / search — greeting, From / To / Date, `بحث`, recent searches.
4. Search results — route header, day chips, departure cards, free-seat counts.
5. Trip details + seat map — trip summary, seat grid with states, `تأكيد الحجز`.
6. Booking summary — seats, total, name, phone, payment method.
7. Booking confirmation — success illustration, booking number, view-ticket / home.
8. My bookings — Upcoming / Past tabs, booking cards with status chips.
9. Ticket detail — booking number, trip info, seats (scannable code `FUTURE`).
10. Account — profile header + menu (personal info, payment methods, notifications, help, about, logout).

**Operator admin (company / driver)**

A. Operator dashboard — today's/upcoming departures, occupancy, quick actions.
B. Fleet & vehicles — vehicle list, vehicle editor with **seat-layout designer**.
C. Routes — select served routes.
D. Trip scheduling — create/edit a departure (route, date, times, price, vehicle, driver).
E. Trip seat board — per-trip seat grid with passenger info, boarded/no-show, cancel trip.
F. Operator profile — company/driver profile, verification status.

**Super-admin**

S1. Cities / stations catalog.
S2. Operator verification & management.
S3. User management.
S4. Platform overview.

### 6. Reference

- Mockup: [`assets/louaji-mockup.jpeg`](assets/louaji-mockup.jpeg) — passenger flow, palette, fonts, and tone. Treat as the v1 visual baseline; the admin and super-admin surfaces follow the same system (the mockup only depicts the passenger app).

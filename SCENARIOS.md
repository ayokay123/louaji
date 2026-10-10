# Louaji — Try-It Scenarios

A hands-on guide to exercising the system end-to-end against the **local stack with
seeded demo data**. Every scenario below was validated against the running app.
This file is a dev convenience guide, not part of the append-only `docs/` system.

---

## 0. Start everything

```bash
# 1. Docker must be running (Docker Desktop).
# 2. Local Supabase stack:
pnpm db:start
#    Copy the keys it prints into .env  (or run `supabase status -o env`):
#      EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY (= ANON_KEY),
#      SUPABASE_SERVICE_ROLE_KEY (= SERVICE_ROLE_KEY),
#      DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
# 3. Migrate + seed (idempotent):
pnpm db:reset            # migrate + seed   (or: pnpm db:migrate && pnpm db:seed)
# 4. Run the app:
pnpm web                 # http://localhost:8081
#    …or containerized on the shifted port:  docker compose up --build  → :3100
```

Useful local URLs: **App** http://localhost:8081 · **Supabase Studio** http://localhost:54323

### Demo accounts (OTP is always `123456` locally — test-OTP, no SMS needed)

| Role                                    | Phone               | Notes                                             |
| --------------------------------------- | ------------------- | ------------------------------------------------- |
| Passenger                               | **+216 12 345 678** | books seats                                       |
| Operator (independent driver "السريعة") | **+216 98 765 432** | verified; owns 1 louage (8 seats) + 24 departures |

### Seeded data

- **Cities**: Tunis (تونس), Sousse (سوسة), Sfax (صفاقس), Nabeul (نابل)
- **Routes**: Tunis↔Sousse, Tunis→Sfax
- **Departures**: 24 trips across **today + next 3 days** (6/day). Prices 15.000–28.000 دت.

---

## A. Passenger happy path — search → seat → book

**UI** (smoothest if you sign in first: Account tab → log in with **+216 12 345 678** / **123456**)

1. Open http://localhost:8081. On the home screen pick **From = تونس**, **To = سوسة**, date = today, tap **بحث** (Search).
2. You'll see 3 departures (07:00, 09:30, 14:00). Tap one.
3. On the seat map, tap one or two green (available) seats → tap **تأكيد الحجز**.
   - If you're **not signed in**, you're routed to sign-in here (holding a seat needs an account). After verifying you land back on this trip — re-pick your seats and tap **تأكيد الحجز** again.
4. Review the summary (seats, total, cash-on-boarding) → confirm.
5. See **تم الحجز بنجاح!** with a booking number like `LJ140626-8534`. It now appears under **حجوزاتي** (Bookings) and **التذاكر** (Tickets).

**What to verify**: total = price × seats; the seat map now shows those seats as _reserved_; a **booking-confirmed** notification appears in the notifications center.

---

## B. Double-booking is impossible (concurrency guarantee)

The integrity boundary is a DB constraint (`unique (trip_id, seat_number)`), not a UI check.

**UI**: open the same trip in two browser tabs. Select **seat 2** in both. Whoever confirms
first wins; the other gets _"some selected seats are no longer available"_ and is asked to re-pick.

**API** (validated):

```bash
# After booking seat 2 on a trip, trying to hold it again returns 409:
curl -s -XPOST "http://localhost:8081/api/trips/$TRIP/hold" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"seatNumbers":[2,3]}'
# → HTTP 409 {"error":"...no longer available","tag":"SeatUnavailable"}
```

---

## C. Seat-hold expiry

Selecting seats places a **10-minute hold** (`src/features/booking/core/config/holds.ts`).
A held seat shows as reserved to everyone else. If you don't confirm within 10 minutes the
hold expires and the seats free up automatically — every availability read filters
`expires_at > now()`, so correctness never depends on the cleanup job.

**Try it fast**: temporarily lower `HOLD_DURATION_MINUTES` to `1`, hold seats in tab A,
wait a minute, and watch them become available again in tab B (refreshes every 30s).

**Confirm-after-expiry**: if your hold lapses before you confirm, the confirm fails with
`HoldExpired` and the UI sends you back to seat selection.

---

## D. Passenger cancels a booking

**UI**: **حجوزاتي** → an upcoming booking → **إلغاء الحجز** → confirm.

**Verify**: booking status → _cancelled_; its seats return to availability on the seat map;
the operator receives a **passenger-cancellation** notification.

---

## E. Operator publishes a departure

**UI**: sign in as the **operator** (+216 98 765 432). Account → **فضاء الناقل** (Operator space).

- **Dashboard** shows today's/upcoming departures + occupancy.
- **الأسطول** (Fleet): the seeded 8-seat Mercedes Vito, plus the **seat-layout designer**
  (tap cells to cycle passenger / driver / blocked) to add a new vehicle.
- **جدولة رحلة** (Schedule): pick a route, date, departure/arrival time, price (in dinars),
  vehicle → publish. It immediately appears in passenger search.

**Verify**: search that route/date as a passenger — the new departure is listed.

---

## F. Operator cancels a trip → passengers notified (SRS §4.4)

**UI**: operator → a trip's seat board → **إلغاء الرحلة**.

**Verify** (validated end-to-end): the trip → _cancelled_, **all bookings on it → cancelled**,
their **seats released**, every affected passenger gets a **trip-cancelled** notification
(+ SMS when Twilio is configured), and the trip disappears from passenger search.

---

## G. Guest gating

Browse and search without an account freely. The moment you try to **hold/checkout** seats
you're routed to sign in (`/(auth)/welcome`) — booking requires a verified phone (SRS §2.1).
After verifying you're returned to the same trip to finish. (Sign-in works locally with the
test OTP **123456**; no real SMS provider is needed — see config note below.)

---

## H. Super-admin: catalog + operator verification

The seeded operator is already verified. To exercise admin yourself, grant super-admin to a
user and use the admin space (Account → **إدارة المنصة**):

```bash
# grant super_admin to the passenger account (then re-open the app as them):
docker exec supabase_db_louaji psql -U postgres -d postgres -c \
 "INSERT INTO role_grants (user_id, role)
  SELECT id,'super_admin' FROM users WHERE phone='+21612345678'
  ON CONFLICT DO NOTHING;"
```

Admin screens: **المدن** (add cities), **المسارات** (add routes), **الناقلين** (verify pending
operators — unverified operators can't publicly publish), **المستخدمين** (users).

To see verification gating, register a _new_ operator (Account → operator onboarding) and
note publishing is blocked until an admin verifies them.

---

## I. Notifications center & languages

- **Notifications** (Account → إشعاراتي): booking-confirmed, new-booking, trip-cancelled, etc.,
  with unread styling and mark-all-read.
- **Languages / RTL**: the app is Arabic-first (RTL); French and English mirror to LTR. All
  copy is localized — switch the device/browser language to see fr/en.

---

## Full API walkthrough (no UI)

```bash
API=http://127.0.0.1:54321 ; APP=http://localhost:8081
ANON=$(supabase status -o env | sed -n 's/^ANON_KEY="\(.*\)"/\1/p')
TUNIS=00000000-0000-4000-8000-0000000000c1 ; SOUSSE=00000000-0000-4000-8000-0000000000c2
TODAY=$(date +%F)

# 1. sign in (test OTP)
curl -s -XPOST "$API/auth/v1/otp" -H "apikey: $ANON" -H "content-type: application/json" \
  -d '{"phone":"+21612345678"}' >/dev/null
TOKEN=$(curl -s -XPOST "$API/auth/v1/verify" -H "apikey: $ANON" -H "content-type: application/json" \
  -d '{"type":"sms","phone":"+21612345678","token":"123456"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")

# 2. search → grab a trip id
TRIP=$(curl -s "$APP/api/trips/search?originCityId=$TUNIS&destinationCityId=$SOUSSE&serviceDate=$TODAY" \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).trips[0].id")

# 3. seat map → 4. hold → 5. confirm
curl -s "$APP/api/trips/$TRIP/seatmap"
curl -s -XPOST "$APP/api/trips/$TRIP/hold" -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -d '{"seatNumbers":[1,2]}'
curl -s -XPOST "$APP/api/bookings" -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d "{\"tripId\":\"$TRIP\",\"seatNumbers\":[1,2],\"passengerName\":\"أحمد\",\"passengerPhone\":\"+21612345678\"}"

# 6. my bookings  → 7. cancel
curl -s "$APP/api/bookings" -H "authorization: Bearer $TOKEN"
curl -s -XPOST "$APP/api/bookings/<BOOKING_ID>/cancel" -H "authorization: Bearer $TOKEN"
```

---

## Reset to a clean slate any time

```bash
docker exec supabase_db_louaji psql -U postgres -d postgres \
  -c "DELETE FROM notifications; DELETE FROM seat_holds; DELETE FROM bookings;"
pnpm db:seed
```

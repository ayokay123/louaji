# Supabase Edge Functions

Standalone Deno functions that run in the Supabase Edge runtime. They are **not**
part of the Expo app's TypeScript project: they import their dependencies via
`jsr:` / `npm:` specifiers, are not covered by the app's `tsc`, and must never
import app code (`@/...`).

Local Supabase ports (see `supabase/config.toml`): API `54321`, DB `54322`.

## Functions

### `expire-holds`

Scheduled sweep that deletes stale seat holds:

```sql
DELETE FROM seat_holds WHERE expires_at < now();
```

- **Correctness does NOT depend on this function.** Every availability read in
  the app already filters `expires_at > now()` (see
  `src/features/booking/adapters/supabase/bookingRepository.ts`), so an expired
  hold never blocks a seat even if the sweep never runs. This is pure
  housekeeping to keep `seat_holds` small.
- Returns `{ ok: true, deleted: <count> }`.

**Env vars** (injected automatically on deploy):

| Var                         | Purpose                         |
| --------------------------- | ------------------------------- |
| `SUPABASE_URL`              | Project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (bypasses RLS) |

**Deploy & schedule:**

```bash
supabase functions deploy expire-holds
```

Schedule it on a cron (e.g. every minute) via `pg_cron` + `pg_net`, or a Supabase
scheduled function:

```sql
select cron.schedule(
  'expire-holds',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/expire-holds',
       headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
     ) $$
);
```

### `send-sms`

Transactional SMS channel via the Twilio REST API — used for
booking-confirmation and operator-initiated trip-cancellation messages
(`docs/SRS.md` §6.2).

- `POST { "to": "+216...", "body": "..." }`.
- In local dev / when Twilio is unconfigured it is a **no-op**: returns
  `{ ok: true, skipped: true }` so booking flows don't break without credentials.
- On success returns `{ ok: true, sid: <message-sid> }`; errors are normalized to
  JSON with a non-2xx status.

**Env vars** (set as secrets before deploy):

| Var                  | Purpose                      |
| -------------------- | ---------------------------- |
| `TWILIO_ACCOUNT_SID` | Twilio account SID           |
| `TWILIO_AUTH_TOKEN`  | Twilio auth token            |
| `TWILIO_FROM`        | Sending phone number (E.164) |

**Deploy:**

```bash
supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=...
supabase functions deploy send-sms
```

## Follow-up integration (not wired yet)

After a booking is confirmed (and on operator-initiated trip cancellation), the
booking flow should fan out:

1. `notificationRepository.createNotification(recipientId, data)` — the in-app
   notification (e.g. `{ type: "booking_confirmed", bookingId }`).
2. `send-sms` — the transactional SMS to the passenger phone.

This wiring belongs in a use-case / orchestration layer, **not** in the booking
adapter (which stays a pure data-access boundary). It is intentionally left as a
follow-up and no existing booking code was modified.

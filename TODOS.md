# TODOS — Louaji

> Deferred work, append-only like the rest of the docs system. Add a new dated section below; never edit prior ones.

## 2026-06-27 — Deferred from CEO review (finish-v1)

Source: `/plan-ceo-review` on 2026-06-27 (CEO plan in `~/.gstack/projects/Louaji/ceo-plans/2026-06-27-louaji-finish-v1.md`). Mode: SELECTIVE EXPANSION. These were surfaced and deliberately deferred — they are NOT cut.

### Deferred expansions (revisit after baseline ships + one real route is live)

- **Live seat availability (Realtime)** — P2 — seats update live on the trip screen via Supabase Realtime (subscribe per-trip). Removes the "someone grabbed my seat between load and tap" surprise. Depends on a Realtime quota/ops plan. Effort M (CC: S).
- **Stations within cities** — P2 — sub-city departure points instead of city-level only. Touches catalog + search + schema. SRS deliberately city-level for v1. Effort M (CC: S).
- **Web push notifications** — P3 — browser push beyond SMS + in-app. Deliverability on web is patchy; not the core loop. Effort M (CC: S).
- **Online payment (Tunisian gateway)** — P2 — Flouci/Konnect/ClicToPay (not Stripe — doesn't operate in TN), platform fee, refund semantics. Changes booking from promise-to-pay-cash to real money. Keep the `PaymentGateway` port ready. Effort L (CC: M).
- **Live louage GPS tracking** — P3 — the "تتبع اللواج" feature in the mockup. Needs driver-side GPS capture, maps, Realtime Broadcast, battery/privacy handling. Its own release. Effort XL (CC: L).

### Strategic watch-items

- **No-show economics** — cash-on-boarding makes every hold/booking a free option; vans may leave half-empty from no-shows. Watch on first live route; if it bites, consider a reliability signal or small deposit (changes money semantics).
- **Ranking-by-rating** — once ratings (E3) collect data, ranking results by operator reputation is a separate algorithm; deferred until there's rating volume.

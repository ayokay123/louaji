import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

// Local demo seed — run AFTER migrations (`pnpm db:seed`, or chained by
// `pnpm db:reset`). Creates a verified independent-driver operator with an
// 8-seat louage and several live departures so search returns results, plus a
// demo passenger. Auth users are created via the Admin API (so auth.users +
// public.users line up); the matching OTP codes live in supabase/config.toml
// under [auth.sms.test_otp]. Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE) {
  console.error("✖ SUPABASE_SERVICE_ROLE_KEY is required. Run `supabase status` and set it in .env.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const pool = new pg.Pool({ connectionString: DATABASE_URL });

// Stable ids so re-runs are idempotent.
const IDS = {
  operator: "00000000-0000-4000-8000-000000000001",
  passenger: "00000000-0000-4000-8000-000000000002",
  driver: "00000000-0000-4000-8000-000000000010",
  vehicle: "00000000-0000-4000-8000-000000000020",
  tunis: "00000000-0000-4000-8000-0000000000c1",
  sousse: "00000000-0000-4000-8000-0000000000c2",
  sfax: "00000000-0000-4000-8000-0000000000c3",
  nabeul: "00000000-0000-4000-8000-0000000000c4",
  routeTunisSousse: "00000000-0000-4000-8000-0000000000d1",
  routeSousseTunis: "00000000-0000-4000-8000-0000000000d2",
  routeTunisSfax: "00000000-0000-4000-8000-0000000000d3",
};

const SEAT_LAYOUT = {
  rows: 5,
  cols: 2,
  seats: [
    { number: 0, row: 0, col: 0, kind: "driver" },
    { number: 1, row: 0, col: 1, kind: "passenger" },
    { number: 2, row: 1, col: 0, kind: "passenger" },
    { number: 3, row: 1, col: 1, kind: "passenger" },
    { number: 4, row: 2, col: 0, kind: "passenger" },
    { number: 5, row: 2, col: 1, kind: "passenger" },
    { number: 6, row: 3, col: 0, kind: "passenger" },
    { number: 7, row: 3, col: 1, kind: "passenger" },
    { number: 8, row: 4, col: 0, kind: "passenger" },
    { number: 0, row: 4, col: 1, kind: "blocked" },
  ],
};

async function ensureAuthUser(id, phone, fullName) {
  // Try to create; if the phone already exists, look up the existing id.
  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error && data.user) return data.user.id;
  const { rows } = await pool.query("SELECT id FROM auth.users WHERE phone = $1", [
    phone.replace("+", ""),
  ]);
  if (rows[0]) return rows[0].id;
  throw error ?? new Error(`Could not create or find auth user for ${phone}`);
}

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const c = await pool.connect();
  try {
    // 1. Auth users (operator + passenger). Their ids drive the FK graph below.
    const operatorId = await ensureAuthUser(IDS.operator, "+21698765432", "شركة السريعة");
    const passengerId = await ensureAuthUser(IDS.passenger, "+21612345678", "أحمد بن علي");

    await c.query("BEGIN");

    // 2. public.users mirror rows.
    await c.query(
      `INSERT INTO users (id, full_name, phone) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [operatorId, "السريعة", "+21698765432"],
    );
    await c.query(
      `INSERT INTO users (id, full_name, phone) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [passengerId, "أحمد بن علي", "+21612345678"],
    );

    // 3. Operator role grant (independent driver).
    await c.query(
      `INSERT INTO role_grants (user_id, role) VALUES ($1,'driver')
       ON CONFLICT (user_id, role, company_id) DO NOTHING`,
      [operatorId],
    );

    // 4. Cities.
    const cities = [
      [IDS.tunis, "تونس", "Tunis", "Tunis", "Tunis"],
      [IDS.sousse, "سوسة", "Sousse", "Sousse", "Sousse"],
      [IDS.sfax, "صفاقس", "Sfax", "Sfax", "Sfax"],
      [IDS.nabeul, "نابل", "Nabeul", "Nabeul", "Nabeul"],
    ];
    for (const [id, name, nameFr, nameEn, gov] of cities) {
      await c.query(
        `INSERT INTO cities (id, name, name_fr, name_en, governorate) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, nameFr, nameEn, gov],
      );
    }

    // 5. Routes.
    const routes = [
      [IDS.routeTunisSousse, IDS.tunis, IDS.sousse, 140, 60],
      [IDS.routeSousseTunis, IDS.sousse, IDS.tunis, 140, 60],
      [IDS.routeTunisSfax, IDS.tunis, IDS.sfax, 270, 130],
    ];
    for (const [id, origin, dest, dur, dist] of routes) {
      await c.query(
        `INSERT INTO routes (id, origin_city_id, destination_city_id, est_duration_min, est_distance_km)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [id, origin, dest, dur, dist],
      );
    }

    // 6. Driver profile (independent, verified) + vehicle.
    await c.query(
      `INSERT INTO drivers (id, full_name, phone, company_id, user_id, is_verified, verified_at)
       VALUES ($1,$2,$3,NULL,$4,true,now()) ON CONFLICT (id) DO NOTHING`,
      [IDS.driver, "السريعة", "+21698765432", operatorId],
    );
    await c.query(
      `INSERT INTO vehicles (id, company_id, driver_id, plate, model, seat_count, seat_layout, is_active)
       VALUES ($1,NULL,$2,$3,$4,8,$5,true) ON CONFLICT (id) DO NOTHING`,
      [IDS.vehicle, IDS.driver, "123 TUN 4567", "Mercedes Vito", JSON.stringify(SEAT_LAYOUT)],
    );

    // 7. Live departures: clear any prior demo trips for this vehicle, then seed
    //    fresh ones on the next few days so search always returns results.
    await c.query("DELETE FROM trips WHERE vehicle_id = $1 AND service_date >= CURRENT_DATE", [
      IDS.vehicle,
    ]);
    const schedule = [
      [IDS.routeTunisSousse, "07:00:00", "08:20:00", 15000],
      [IDS.routeTunisSousse, "09:30:00", "10:50:00", 15000],
      [IDS.routeTunisSousse, "14:00:00", "15:20:00", 17000],
      [IDS.routeSousseTunis, "08:00:00", "09:20:00", 15000],
      [IDS.routeSousseTunis, "16:30:00", "17:50:00", 16000],
      [IDS.routeTunisSfax, "06:30:00", "11:00:00", 28000],
    ];
    for (let day = 0; day < 4; day++) {
      const serviceDate = isoDate(day);
      for (const [routeId, dep, arr, price] of schedule) {
        await c.query(
          `INSERT INTO trips (route_id, company_id, driver_id, vehicle_id, operator_user_id,
             service_date, departure_time, est_arrival_time, price_millimes, status, total_seats)
           VALUES ($1,NULL,$2,$3,$4,$5,$6,$7,$8,'scheduled',8)`,
          [routeId, IDS.driver, IDS.vehicle, operatorId, serviceDate, dep, arr, price],
        );
      }
    }

    await c.query("COMMIT");
    console.log("✓ Seed complete.");
    console.log("  Operator login: +216 98 765 432  (OTP 123456)");
    console.log("  Passenger login: +216 12 345 678  (OTP 123456)");
    console.log(`  Seeded ${schedule.length * 4} departures across 4 days (Tunis↔Sousse, Tunis→Sfax).`);
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✖ Seed failed:", err);
  process.exit(1);
});

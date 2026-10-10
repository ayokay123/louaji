import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { AppLocale } from "@/shared/lib/i18n";
import { todayServiceDate } from "@/shared/lib/datetime";
import { AlreadyAnOperator } from "../../core/errors";
import type {
  OnboardOperatorInput,
  OnboardOperatorResult,
  OperatorContext,
} from "../../core/entities/operator";
import type { DashboardTrip, OperatorDashboard } from "../../core/entities/dashboard";
import type { OperatorRepository } from "../../core/ports/OperatorRepository";

// Supabase/Drizzle adapter for the operator side. All writes here run on the
// server-only service-role db client. Raw SQL rows are typed via an explicit
// `interface Row` so dot access satisfies `noPropertyAccessFromIndexSignature`;
// values are `unknown` and coerced at the mapping boundary.

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err && err.code === PG_UNIQUE_VIOLATION
  );
}

interface Row {
  company_id?: unknown;
  driver_id?: unknown;
  company_name?: unknown;
  company_fr?: unknown;
  company_en?: unknown;
  driver_name?: unknown;
  company_verified?: unknown;
  driver_verified?: unknown;
  role?: unknown;
  id?: unknown;
  route_id?: unknown;
  origin_ar?: unknown;
  origin_fr?: unknown;
  origin_en?: unknown;
  dest_ar?: unknown;
  dest_fr?: unknown;
  dest_en?: unknown;
  service_date?: unknown;
  departure_time?: unknown;
  est_arrival_time?: unknown;
  status?: unknown;
  price_millimes?: unknown;
  total_seats?: unknown;
  booked_seats?: unknown;
  vehicle_plate?: unknown;
  trip_driver_name?: unknown;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function localized(locale: AppLocale, ar: unknown, fr: unknown, en: unknown): string {
  const pick = locale === "fr" ? fr : locale === "en" ? en : ar;
  return String(pick ?? ar ?? "");
}

function mapDashboardTrip(row: Row, locale: AppLocale): DashboardTrip {
  return {
    id: String(row.id),
    routeId: String(row.route_id),
    originCity: localized(locale, row.origin_ar, row.origin_fr, row.origin_en),
    destinationCity: localized(locale, row.dest_ar, row.dest_fr, row.dest_en),
    serviceDate: String(row.service_date),
    departureTime: String(row.departure_time).slice(0, 5),
    estArrivalTime: row.est_arrival_time ? String(row.est_arrival_time).slice(0, 5) : null,
    status: row.status as DashboardTrip["status"],
    priceMillimes: Number(row.price_millimes),
    totalSeats: Number(row.total_seats),
    bookedSeats: Number(row.booked_seats ?? 0),
    vehiclePlate: String(row.vehicle_plate ?? ""),
    driverName: row.trip_driver_name ? String(row.trip_driver_name) : null,
  };
}

const DASHBOARD_SELECT = sql`
  t.id, t.route_id, t.service_date, t.departure_time, t.est_arrival_time,
  t.status, t.price_millimes, t.total_seats,
  oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
  dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en,
  v.plate AS vehicle_plate, dr.full_name AS trip_driver_name,
  COALESCE((
    SELECT count(*) FROM booking_seats bs WHERE bs.trip_id = t.id
  ), 0) AS booked_seats
`;

const DASHBOARD_FROM = sql`
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN cities oc ON oc.id = r.origin_city_id
  JOIN cities dc ON dc.id = r.destination_city_id
  JOIN vehicles v ON v.id = t.vehicle_id
  LEFT JOIN drivers dr ON dr.id = t.driver_id
`;

export const operatorRepository: OperatorRepository = {
  async resolveOperator(userId: string, locale: AppLocale): Promise<OperatorContext | null> {
    // A company_admin grant binds to a company; a driver grant is matched to the
    // driver row owned by this user. Prefer a company grant when both exist.
    const rows = await query(sql`
      SELECT
        rg.role,
        co.id AS company_id, co.name AS company_name, co.name_fr AS company_fr,
        co.name_en AS company_en, co.is_verified AS company_verified,
        dr.id AS driver_id, dr.full_name AS driver_name, dr.is_verified AS driver_verified
      FROM role_grants rg
      LEFT JOIN companies co ON co.id = rg.company_id
      LEFT JOIN drivers dr ON dr.user_id = rg.user_id AND dr.company_id IS NULL
      WHERE rg.user_id = ${userId}
        AND rg.role IN ('company_admin', 'driver')
      ORDER BY CASE rg.role WHEN 'company_admin' THEN 0 ELSE 1 END
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) return null;

    if (row.role === "company_admin" && row.company_id != null) {
      return {
        userId,
        kind: "company",
        companyId: String(row.company_id),
        driverId: null,
        name: localized(locale, row.company_name, row.company_fr, row.company_en),
        isVerified: row.company_verified === true,
      };
    }
    if (row.role === "driver" && row.driver_id != null) {
      return {
        userId,
        kind: "driver",
        companyId: null,
        driverId: String(row.driver_id),
        name: String(row.driver_name ?? ""),
        isVerified: row.driver_verified === true,
      };
    }
    return null;
  },

  async onboard(userId: string, input: OnboardOperatorInput): Promise<OnboardOperatorResult> {
    return db.transaction(async (tx) => {
      try {
        if (input.kind === "company") {
          return await onboardCompany(tx, userId, input.companyName ?? "", input.phone);
        }
        return await onboardDriver(tx, userId, input.fullName ?? "", input.phone);
      } catch (err) {
        if (isUniqueViolation(err)) throw new AlreadyAnOperator();
        throw err;
      }
    });
  },

  async getDashboard(operator: OperatorContext, locale: AppLocale): Promise<OperatorDashboard> {
    const today = todayServiceDate();
    const todayRows = await query(sql`
      SELECT ${DASHBOARD_SELECT} ${DASHBOARD_FROM}
      WHERE t.operator_user_id = ${operator.userId} AND t.service_date = ${today}
      ORDER BY t.departure_time ASC
    `);
    const upcomingRows = await query(sql`
      SELECT ${DASHBOARD_SELECT} ${DASHBOARD_FROM}
      WHERE t.operator_user_id = ${operator.userId} AND t.service_date > ${today}
        AND t.status IN ('scheduled', 'boarding')
      ORDER BY t.service_date ASC, t.departure_time ASC
      LIMIT 50
    `);
    return {
      operatorName: operator.name,
      isVerified: operator.isVerified,
      todayTrips: todayRows.map((r) => mapDashboardTrip(r, locale)),
      upcomingTrips: upcomingRows.map((r) => mapDashboardTrip(r, locale)),
    };
  },
};

// ── helpers ────────────────────────────────────────────────────────────────

async function onboardCompany(
  tx: Tx,
  userId: string,
  name: string,
  phone: string | null,
): Promise<OnboardOperatorResult> {
  const companyRows = (await tx.execute(sql`
    INSERT INTO companies (name, owner_user_id, contact_phone)
    VALUES (${name}, ${userId}, ${phone})
    RETURNING id
  `)) as unknown as { rows?: Row[] };
  const companyId = companyRows.rows?.[0]?.id;
  if (!companyId) throw new Error("Failed to create company");

  await tx.execute(sql`
    INSERT INTO role_grants (user_id, role, company_id, company_member_role)
    VALUES (${userId}, 'company_admin', ${String(companyId)}, 'owner')
  `);
  return { kind: "company", companyId: String(companyId), driverId: null };
}

async function onboardDriver(
  tx: Tx,
  userId: string,
  fullName: string,
  phone: string | null,
): Promise<OnboardOperatorResult> {
  const driverRows = (await tx.execute(sql`
    INSERT INTO drivers (full_name, phone, user_id)
    VALUES (${fullName}, ${phone}, ${userId})
    RETURNING id
  `)) as unknown as { rows?: Row[] };
  const driverId = driverRows.rows?.[0]?.id;
  if (!driverId) throw new Error("Failed to create driver");

  await tx.execute(sql`
    INSERT INTO role_grants (user_id, role) VALUES (${userId}, 'driver')
  `);
  return { kind: "driver", companyId: null, driverId: String(driverId) };
}

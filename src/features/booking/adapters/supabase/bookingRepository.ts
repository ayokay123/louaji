import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingNumberDateSegment } from "@/shared/lib/datetime";
import type { AppLocale } from "@/shared/lib/i18n";
import { totalMillimes } from "@/shared/lib/money";
import { deriveSeatStates, type SeatLayout, type TripSeatMap } from "../../core/entities/seat";
import type { SearchResultTrip, SearchTripsQuery, TripDetail } from "../../core/entities/trip";
import type { BookingSummary, SeatHoldResult } from "../../core/entities/booking";
import { HOLD_DURATION_MS } from "../../core/config/holds";
import { HoldExpired, SeatUnavailable, TripNotBookable } from "../../core/errors";
import type {
  BookingRepository,
  ConfirmBookingInput,
  HoldSeatsInput,
} from "../../core/ports/BookingRepository";

// Supabase/Drizzle adapter for the booking flow. This is where the
// constraint-backed concurrency lives — the unique (trip_id, seat_number) on
// booking_seats and seat_holds is the integrity boundary, not any
// check-then-write in JS. Holds and confirms run inside db.transaction(...).
// See docs/ARCHITECTURE.md §6 and docs/CAUTIONS.md §1.

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps the pg driver error in a DrizzleQueryError, so the Postgres
  // SQLSTATE lives at `.cause.code`, not the top level. Walk the cause chain so
  // the booking_seats (trip_id, seat_number) unique violation reliably maps to
  // SeatUnavailable instead of leaking a raw 500. Verified via the B1 race probe.
  for (let cur: unknown = err, depth = 0; cur != null && depth < 5; depth++) {
    if (
      typeof cur === "object" &&
      "code" in cur &&
      (cur as { code?: unknown }).code === PG_UNIQUE_VIOLATION
    ) {
      return true;
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

// Bind a JS number[] as a real Postgres int[] literal. Interpolating an array
// directly (`${nums}::int[]`) makes Drizzle expand it into a tuple `($1, $2)`,
// which Postgres rejects ("cannot cast record to integer[]"). Each element is a
// separate bound param, so this stays injection-safe.
function intArray(nums: number[]): ReturnType<typeof sql> {
  return sql`ARRAY[${sql.join(
    nums.map((n) => sql`${n}`),
    sql`, `,
  )}]::int[]`;
}

// Explicit (non-index-signature) shape for raw SQL rows so dot access satisfies
// `noPropertyAccessFromIndexSignature`. All values are `unknown` and coerced at
// the mapping boundary.
interface Row {
  id?: unknown;
  service_date?: unknown;
  departure_time?: unknown;
  est_arrival_time?: unknown;
  price_millimes?: unknown;
  total_seats?: unknown;
  available_seats?: unknown;
  origin_ar?: unknown;
  origin_fr?: unknown;
  origin_en?: unknown;
  dest_ar?: unknown;
  dest_fr?: unknown;
  dest_en?: unknown;
  company_name?: unknown;
  company_fr?: unknown;
  company_en?: unknown;
  driver_name?: unknown;
  vehicle_model?: unknown;
  layout?: unknown;
  seat_number?: unknown;
  operator_user_id?: unknown;
  status?: unknown;
  is_past?: unknown;
  trip_status?: unknown;
  booking_number?: unknown;
  trip_id?: unknown;
  seat_count?: unknown;
  total_millimes?: unknown;
  passenger_name?: unknown;
  passenger_phone?: unknown;
  created_at?: unknown;
  seat_numbers?: unknown;
}

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function localized(locale: AppLocale, ar: unknown, fr: unknown, en: unknown): string {
  const pick = locale === "fr" ? fr : locale === "en" ? en : ar;
  return String(pick ?? ar ?? "");
}

function mapSearchRow(row: Row, locale: AppLocale): SearchResultTrip {
  const isCompany = row.company_name != null;
  return {
    id: String(row.id),
    originCity: localized(locale, row.origin_ar, row.origin_fr, row.origin_en),
    destinationCity: localized(locale, row.dest_ar, row.dest_fr, row.dest_en),
    serviceDate: String(row.service_date),
    departureTime: String(row.departure_time).slice(0, 5),
    estArrivalTime: row.est_arrival_time ? String(row.est_arrival_time).slice(0, 5) : null,
    operator: {
      name: isCompany
        ? localized(locale, row.company_name, row.company_fr, row.company_en)
        : String(row.driver_name ?? ""),
      isCompany,
    },
    priceMillimes: Number(row.price_millimes),
    totalSeats: Number(row.total_seats),
    availableSeats: Number(row.available_seats),
  };
}

const TRIP_SELECT = sql`
  t.id, t.service_date, t.departure_time, t.est_arrival_time, t.price_millimes, t.total_seats,
  oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
  dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en,
  co.name AS company_name, co.name_fr AS company_fr, co.name_en AS company_en,
  dr.full_name AS driver_name, v.model AS vehicle_model,
  (t.total_seats
     - COALESCE((SELECT count(*) FROM booking_seats bs WHERE bs.trip_id = t.id), 0)
     - COALESCE((SELECT count(*) FROM seat_holds sh WHERE sh.trip_id = t.id AND sh.expires_at > now()), 0)
  ) AS available_seats
`;

const TRIP_FROM = sql`
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN cities oc ON oc.id = r.origin_city_id
  JOIN cities dc ON dc.id = r.destination_city_id
  JOIN vehicles v ON v.id = t.vehicle_id
  LEFT JOIN companies co ON co.id = t.company_id
  LEFT JOIN drivers dr ON dr.id = t.driver_id
`;

export const bookingRepository: BookingRepository = {
  async searchTrips(q: SearchTripsQuery, locale: AppLocale): Promise<SearchResultTrip[]> {
    const rows = await query(sql`
      SELECT ${TRIP_SELECT} ${TRIP_FROM}
      WHERE r.origin_city_id = ${q.originCityId}
        AND r.destination_city_id = ${q.destinationCityId}
        AND t.service_date = ${q.serviceDate}
        AND t.status IN ('scheduled', 'boarding')
        -- Effective status derived on read (no status cron): a departure whose
        -- date+time has passed in Africa/Tunis is no longer bookable even if the
        -- stored status is still 'scheduled'. See eng review B12.
        AND (
          t.service_date > (now() AT TIME ZONE 'Africa/Tunis')::date
          OR (t.service_date = (now() AT TIME ZONE 'Africa/Tunis')::date
              AND t.departure_time > (now() AT TIME ZONE 'Africa/Tunis')::time)
        )
      ORDER BY t.departure_time ASC
    `);
    return rows.map((row) => mapSearchRow(row, locale));
  },

  async getTripDetail(tripId: string, locale: AppLocale): Promise<TripDetail | null> {
    const rows = await query(sql`
      SELECT ${TRIP_SELECT} ${TRIP_FROM} WHERE t.id = ${tripId} LIMIT 1
    `);
    const row = rows[0];
    if (!row) return null;
    return {
      ...mapSearchRow(row, locale),
      vehicleModel: row.vehicle_model ? String(row.vehicle_model) : null,
    };
  },

  async getSeatMap(tripId: string): Promise<TripSeatMap | null> {
    const layoutRows = await query(sql`
      SELECT v.seat_layout AS layout FROM trips t
      JOIN vehicles v ON v.id = t.vehicle_id WHERE t.id = ${tripId} LIMIT 1
    `);
    const layoutRow = layoutRows[0];
    if (!layoutRow) return null;
    const layout = layoutRow.layout as SeatLayout;

    const booked = await query(
      sql`SELECT seat_number FROM booking_seats WHERE trip_id = ${tripId}`,
    );
    const held = await query(
      sql`SELECT seat_number FROM seat_holds WHERE trip_id = ${tripId} AND expires_at > now()`,
    );
    const bookedSet = new Set(booked.map((r) => Number(r.seat_number)));
    const heldSet = new Set(held.map((r) => Number(r.seat_number)));
    const seats = deriveSeatStates(layout, bookedSet, heldSet);
    return {
      tripId,
      rows: layout.rows,
      cols: layout.cols,
      seats,
      availableCount: seats.filter((s) => s.state === "available").length,
    };
  },

  async holdSeats(input: HoldSeatsInput): Promise<SeatHoldResult> {
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
    return db.transaction(async (tx) => {
      // A booked seat has no hold row, so ON CONFLICT can't catch it — check first.
      const bookedRows = (await tx.execute(sql`
        SELECT seat_number FROM booking_seats
        WHERE trip_id = ${input.tripId} AND seat_number = ANY(${intArray(input.seatNumbers)})
      `)) as unknown as { rows?: Row[] };
      const booked = bookedRows.rows ?? [];
      if (booked.length > 0) {
        throw new SeatUnavailable(booked.map((r) => Number(r.seat_number)));
      }

      // Insert/refresh a hold per seat. ON CONFLICT updates only when the
      // existing hold is expired or already ours; otherwise the row is skipped
      // and excluded from RETURNING — fewer rows back means a live foreign hold.
      const heldRows = (await tx.execute(sql`
        INSERT INTO seat_holds (trip_id, seat_number, held_by, expires_at)
        SELECT ${input.tripId}, s, ${input.userId}, ${expiresAt.toISOString()}
        FROM unnest(${intArray(input.seatNumbers)}) AS s
        ON CONFLICT (trip_id, seat_number) DO UPDATE
          SET held_by = EXCLUDED.held_by, expires_at = EXCLUDED.expires_at, created_at = now()
          WHERE seat_holds.expires_at < now() OR seat_holds.held_by = EXCLUDED.held_by
        RETURNING seat_number
      `)) as unknown as { rows?: Row[] };
      const held = heldRows.rows ?? [];
      if (held.length !== input.seatNumbers.length) {
        throw new SeatUnavailable();
      }
      return {
        tripId: input.tripId,
        seatNumbers: input.seatNumbers,
        expiresAt: expiresAt.toISOString(),
      };
    });
  },

  async confirmBooking(input: ConfirmBookingInput, locale: AppLocale): Promise<BookingSummary> {
    return db.transaction(async (tx) => {
      const tripRows = (await tx.execute(sql`
        SELECT id, price_millimes, operator_user_id, service_date, status,
          (service_date < (now() AT TIME ZONE 'Africa/Tunis')::date
            OR (service_date = (now() AT TIME ZONE 'Africa/Tunis')::date
                AND departure_time <= (now() AT TIME ZONE 'Africa/Tunis')::time)) AS is_past
        FROM trips WHERE id = ${input.tripId} FOR UPDATE
      `)) as unknown as { rows?: Row[] };
      const trip = tripRows.rows?.[0];
      if (!trip) throw new TripNotBookable();
      if (trip.status !== "scheduled" && trip.status !== "boarding") throw new TripNotBookable();
      // Derive bookability from the clock too (eng review B12): a departure whose
      // time has passed in Africa/Tunis is no longer bookable even if status is
      // still 'scheduled' (no cron flips rows — effective status is read-derived).
      if (trip.is_past === true) throw new TripNotBookable();

      // Every seat must still be held by THIS user and not expired.
      const validHolds = (await tx.execute(sql`
        SELECT seat_number FROM seat_holds
        WHERE trip_id = ${input.tripId}
          AND held_by = ${input.userId}
          AND expires_at > now()
          AND seat_number = ANY(${intArray(input.seatNumbers)})
      `)) as unknown as { rows?: Row[] };
      if ((validHolds.rows ?? []).length !== input.seatNumbers.length) {
        throw new HoldExpired();
      }

      const priceMillimes = Number(trip.price_millimes);
      const total = totalMillimes(priceMillimes, input.seatNumbers.length);
      const dateSeg = bookingNumberDateSegment(new Date(`${String(trip.service_date)}T12:00:00`));

      const bookingId = await insertBookingWithNumber(tx, dateSeg, {
        passengerUserId: input.userId,
        tripId: input.tripId,
        operatorUserId: String(trip.operator_user_id),
        seatCount: input.seatNumbers.length,
        total,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
      });

      try {
        await tx.execute(sql`
          INSERT INTO booking_seats (booking_id, trip_id, seat_number)
          SELECT ${bookingId}, ${input.tripId}, s FROM unnest(${intArray(input.seatNumbers)}) AS s
        `);
      } catch (err) {
        if (isUniqueViolation(err)) throw new SeatUnavailable();
        throw err;
      }

      await tx.execute(sql`
        DELETE FROM seat_holds
        WHERE trip_id = ${input.tripId} AND held_by = ${input.userId}
          AND seat_number = ANY(${intArray(input.seatNumbers)})
      `);

      const summary = await loadBookingSummary(tx, bookingId, locale);
      if (!summary) throw new Error("Booking row vanished after insert");
      return summary;
    });
  },

  async listBookings(userId: string, locale: AppLocale): Promise<BookingSummary[]> {
    const rows = await query(bookingSummaryQuery(sql`b.passenger_user_id = ${userId}`));
    return rows.map((r) => mapBookingRow(r, locale));
  },

  async getBooking(
    bookingId: string,
    userId: string,
    locale: AppLocale,
  ): Promise<BookingSummary | null> {
    const rows = await query(
      bookingSummaryQuery(sql`b.id = ${bookingId} AND b.passenger_user_id = ${userId}`),
    );
    const row = rows[0];
    return row ? mapBookingRow(row, locale) : null;
  },

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const rows = (await tx.execute(sql`
        SELECT b.id, b.status, t.status AS trip_status
        FROM bookings b JOIN trips t ON t.id = b.trip_id
        WHERE b.id = ${bookingId} AND b.passenger_user_id = ${userId} FOR UPDATE
      `)) as unknown as { rows?: Row[] };
      const row = rows.rows?.[0];
      if (!row) throw new TripNotBookable();
      if (row.status === "cancelled") return;
      if (row.trip_status === "departed" || row.trip_status === "completed") {
        throw new TripNotBookable();
      }
      await tx.execute(sql`
        UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = ${bookingId}
      `);
      // Releasing the seats: delete the hard inventory rows.
      await tx.execute(sql`DELETE FROM booking_seats WHERE booking_id = ${bookingId}`);
    });
  },
};

// ── helpers ────────────────────────────────────────────────────────────────

interface BookingInsert {
  passengerUserId: string;
  tripId: string;
  operatorUserId: string;
  seatCount: number;
  total: number;
  passengerName: string;
  passengerPhone: string;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Insert the booking, retrying on the rare LJ-DDMMYY-NNNN number collision. */
async function insertBookingWithNumber(tx: Tx, dateSeg: string, b: BookingInsert): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const bookingNumber = `LJ${dateSeg}-${suffix}`;
    try {
      const res = (await tx.execute(sql`
        INSERT INTO bookings (
          booking_number, passenger_user_id, trip_id, operator_user_id,
          seat_count, total_millimes, passenger_name, passenger_phone, confirmed_at
        ) VALUES (
          ${bookingNumber}, ${b.passengerUserId}, ${b.tripId}, ${b.operatorUserId},
          ${b.seatCount}, ${b.total}, ${b.passengerName}, ${b.passengerPhone}, now()
        ) RETURNING id
      `)) as unknown as { rows?: Row[] };
      const id = res.rows?.[0]?.id;
      if (id) return String(id);
    } catch (err) {
      if (isUniqueViolation(err) && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a unique booking number");
}

function bookingSummaryQuery(where: ReturnType<typeof sql>): ReturnType<typeof sql> {
  return sql`
    SELECT
      b.id, b.booking_number, b.trip_id, b.operator_user_id, b.status, b.seat_count, b.total_millimes,
      b.passenger_name, b.passenger_phone, b.created_at,
      t.service_date, t.departure_time,
      oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
      dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en,
      co.name AS company_name, co.name_fr AS company_fr, co.name_en AS company_en,
      dr.full_name AS driver_name,
      COALESCE(
        (SELECT array_agg(bs.seat_number ORDER BY bs.seat_number)
         FROM booking_seats bs WHERE bs.booking_id = b.id), '{}'
      ) AS seat_numbers
    FROM bookings b
    JOIN trips t ON t.id = b.trip_id
    JOIN routes r ON r.id = t.route_id
    JOIN cities oc ON oc.id = r.origin_city_id
    JOIN cities dc ON dc.id = r.destination_city_id
    LEFT JOIN companies co ON co.id = t.company_id
    LEFT JOIN drivers dr ON dr.id = t.driver_id
    WHERE ${where}
    ORDER BY t.service_date DESC, t.departure_time DESC
  `;
}

async function loadBookingSummary(
  tx: Tx,
  bookingId: string,
  locale: AppLocale,
): Promise<BookingSummary | null> {
  const res = (await tx.execute(bookingSummaryQuery(sql`b.id = ${bookingId}`))) as unknown as {
    rows?: Row[];
  };
  const row = res.rows?.[0];
  return row ? mapBookingRow(row, locale) : null;
}

function mapBookingRow(row: Row, locale: AppLocale): BookingSummary {
  const seatNumbers = Array.isArray(row.seat_numbers)
    ? (row.seat_numbers as unknown[]).map((n) => Number(n))
    : [];
  const operatorName = row.company_name
    ? localized(locale, row.company_name, row.company_fr, row.company_en)
    : String(row.driver_name ?? "");
  return {
    id: String(row.id),
    bookingNumber: String(row.booking_number),
    tripId: String(row.trip_id),
    operatorUserId: String(row.operator_user_id),
    originCity: localized(locale, row.origin_ar, row.origin_fr, row.origin_en),
    destinationCity: localized(locale, row.dest_ar, row.dest_fr, row.dest_en),
    operatorName,
    serviceDate: String(row.service_date),
    departureTime: String(row.departure_time).slice(0, 5),
    status: row.status as BookingSummary["status"],
    seatNumbers,
    seatCount: Number(row.seat_count),
    totalMillimes: Number(row.total_millimes),
    passengerName: String(row.passenger_name),
    passengerPhone: String(row.passenger_phone),
    createdAt: String(row.created_at),
  };
}

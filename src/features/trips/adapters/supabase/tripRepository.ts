import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { AppLocale } from "@/shared/lib/i18n";
import { OperatorResourceNotFound } from "@/features/operators/core/errors";
import type { OperatorContext } from "@/features/operators/core/entities/operator";
import type { OperatorTrip, ScheduleTripInput } from "../../core/entities/trip";
import {
  buildBoardSeats,
  type BoardBooking,
  type BoardingMark,
  type CancelledBookingRef,
  type SeatLayout,
  type TripBoard,
} from "../../core/entities/board";
import type { TripRepository } from "../../core/ports/TripRepository";

// Supabase/Drizzle adapter for operator trip scheduling and the seat board.
// All writes run on the service-role db client and are scoped to the operator's
// context (operator_user_id = caller). Raw SQL rows are typed via explicit
// `interface Row` shapes (noPropertyAccessFromIndexSignature).

interface Row {
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
  vehicle_id?: unknown;
  vehicle_plate?: unknown;
  driver_id?: unknown;
  driver_name?: unknown;
  seat_count?: unknown;
  seat_layout?: unknown;
  seat_number?: unknown;
  booking_id?: unknown;
  booking_number?: unknown;
  booking_status?: unknown;
  passenger_name?: unknown;
  passenger_phone?: unknown;
  passenger_user_id?: unknown;
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

function vehicleOwnerFilter(operator: OperatorContext): ReturnType<typeof sql> {
  return operator.kind === "company"
    ? sql`v.company_id = ${operator.companyId}`
    : sql`v.driver_id = ${operator.driverId}`;
}

function mapTrip(row: Row, locale: AppLocale): OperatorTrip {
  return {
    id: String(row.id),
    routeId: String(row.route_id),
    originCity: localized(locale, row.origin_ar, row.origin_fr, row.origin_en),
    destinationCity: localized(locale, row.dest_ar, row.dest_fr, row.dest_en),
    serviceDate: String(row.service_date),
    departureTime: String(row.departure_time).slice(0, 5),
    estArrivalTime: row.est_arrival_time ? String(row.est_arrival_time).slice(0, 5) : null,
    status: row.status as OperatorTrip["status"],
    priceMillimes: Number(row.price_millimes),
    totalSeats: Number(row.total_seats),
    bookedSeats: Number(row.booked_seats ?? 0),
    vehicleId: String(row.vehicle_id),
    vehiclePlate: String(row.vehicle_plate ?? ""),
    driverId: row.driver_id ? String(row.driver_id) : null,
    driverName: row.driver_name ? String(row.driver_name) : null,
  };
}

const TRIP_SELECT = sql`
  t.id, t.route_id, t.service_date, t.departure_time, t.est_arrival_time,
  t.status, t.price_millimes, t.total_seats, t.vehicle_id, t.driver_id,
  oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
  dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en,
  v.plate AS vehicle_plate, dr.full_name AS driver_name,
  COALESCE((SELECT count(*) FROM booking_seats bs WHERE bs.trip_id = t.id), 0) AS booked_seats
`;

const TRIP_FROM = sql`
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN cities oc ON oc.id = r.origin_city_id
  JOIN cities dc ON dc.id = r.destination_city_id
  JOIN vehicles v ON v.id = t.vehicle_id
  LEFT JOIN drivers dr ON dr.id = t.driver_id
`;

export const tripRepository: TripRepository = {
  async listTrips(operator: OperatorContext, locale: AppLocale): Promise<OperatorTrip[]> {
    const rows = await query(sql`
      SELECT ${TRIP_SELECT} ${TRIP_FROM}
      WHERE t.operator_user_id = ${operator.userId}
      ORDER BY t.service_date DESC, t.departure_time DESC
      LIMIT 100
    `);
    return rows.map((r) => mapTrip(r, locale));
  },

  async scheduleTrip(
    operator: OperatorContext,
    input: ScheduleTripInput,
    locale: AppLocale,
  ): Promise<OperatorTrip> {
    return db.transaction(async (tx) => {
      // The vehicle must belong to this operator; its passenger seat count
      // becomes the trip's totalSeats.
      const vehicleRows = (await tx.execute(sql`
        SELECT v.id, v.seat_count FROM vehicles v
        WHERE v.id = ${input.vehicleId} AND ${vehicleOwnerFilter(operator)}
        LIMIT 1
      `)) as unknown as { rows?: Row[] };
      const vehicle = vehicleRows.rows?.[0];
      if (!vehicle) throw new OperatorResourceNotFound("Vehicle not found");
      const totalSeats = Number(vehicle.seat_count);

      const driverId = await resolveDriverId(tx, operator, input.driverId);
      const companyId = operator.kind === "company" ? operator.companyId : null;

      const inserted = (await tx.execute(sql`
        INSERT INTO trips (
          route_id, company_id, driver_id, vehicle_id, operator_user_id,
          service_date, departure_time, est_arrival_time, price_millimes,
          status, total_seats
        ) VALUES (
          ${input.routeId}, ${companyId}, ${driverId}, ${input.vehicleId}, ${operator.userId},
          ${input.serviceDate}, ${input.departureTime}, ${input.estArrivalTime},
          ${input.priceMillimes}, 'scheduled', ${totalSeats}
        ) RETURNING id
      `)) as unknown as { rows?: Row[] };
      const tripId = inserted.rows?.[0]?.id;
      if (!tripId) throw new Error("Trip insert returned no row");

      const rows = (await tx.execute(sql`
        SELECT ${TRIP_SELECT} ${TRIP_FROM} WHERE t.id = ${String(tripId)} LIMIT 1
      `)) as unknown as { rows?: Row[] };
      const row = rows.rows?.[0];
      if (!row) throw new Error("Trip row vanished after insert");
      return mapTrip(row, locale);
    });
  },

  async cancelTrip(operator: OperatorContext, tripId: string): Promise<CancelledBookingRef[]> {
    return db.transaction(async (tx) => {
      const tripRows = (await tx.execute(sql`
        UPDATE trips SET status = 'cancelled', updated_at = now()
        WHERE id = ${tripId} AND operator_user_id = ${operator.userId}
          AND status IN ('scheduled', 'boarding')
        RETURNING id
      `)) as unknown as { rows?: Row[] };
      if ((tripRows.rows ?? []).length === 0) {
        throw new OperatorResourceNotFound("Trip not found or not cancellable");
      }

      // Snapshot the affected confirmed bookings BEFORE releasing the seats.
      const affected = (await tx.execute(sql`
        SELECT id AS booking_id, booking_number, passenger_user_id, passenger_phone
        FROM bookings WHERE trip_id = ${tripId} AND status = 'confirmed'
      `)) as unknown as { rows?: Row[] };

      // Cancel the bookings and release the hard seat inventory.
      await tx.execute(sql`
        UPDATE bookings SET status = 'cancelled', cancelled_at = now()
        WHERE trip_id = ${tripId} AND status = 'confirmed'
      `);
      await tx.execute(sql`DELETE FROM booking_seats WHERE trip_id = ${tripId}`);

      return (affected.rows ?? []).map((r) => ({
        userId: String(r.passenger_user_id),
        phone: String(r.passenger_phone ?? ""),
        bookingId: String(r.booking_id),
        bookingNumber: String(r.booking_number),
      }));
    });
  },

  async getBoard(
    operator: OperatorContext,
    tripId: string,
    locale: AppLocale,
  ): Promise<TripBoard | null> {
    const tripRows = await query(sql`
      SELECT
        t.id, t.service_date, t.departure_time, t.status, t.total_seats,
        oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
        dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en,
        v.seat_layout AS seat_layout
      FROM trips t
      JOIN routes r ON r.id = t.route_id
      JOIN cities oc ON oc.id = r.origin_city_id
      JOIN cities dc ON dc.id = r.destination_city_id
      JOIN vehicles v ON v.id = t.vehicle_id
      WHERE t.id = ${tripId} AND t.operator_user_id = ${operator.userId}
      LIMIT 1
    `);
    const trip = tripRows[0];
    if (!trip) return null;
    const layout = trip.seat_layout as SeatLayout;

    // One row per booked seat with its booking PII. Cancelled bookings have no
    // booking_seats rows (deleted on cancel), so they don't appear here.
    const seatRows = await query(sql`
      SELECT bs.seat_number, b.id AS booking_id, b.status AS booking_status,
             b.passenger_name, b.passenger_phone
      FROM booking_seats bs
      JOIN bookings b ON b.id = bs.booking_id
      WHERE bs.trip_id = ${tripId}
    `);
    const bookingBySeat = new Map<number, BoardBooking>();
    for (const r of seatRows) {
      bookingBySeat.set(Number(r.seat_number), {
        bookingId: String(r.booking_id),
        status: r.booking_status as BoardBooking["status"],
        passengerName: String(r.passenger_name ?? ""),
        passengerPhone: String(r.passenger_phone ?? ""),
      });
    }

    const seats = buildBoardSeats(layout, bookingBySeat);
    return {
      tripId,
      originCity: localized(locale, trip.origin_ar, trip.origin_fr, trip.origin_en),
      destinationCity: localized(locale, trip.dest_ar, trip.dest_fr, trip.dest_en),
      serviceDate: String(trip.service_date),
      departureTime: String(trip.departure_time).slice(0, 5),
      status: trip.status as TripBoard["status"],
      rows: layout.rows,
      cols: layout.cols,
      seats,
      totalSeats: Number(trip.total_seats),
      bookedSeats: bookingBySeat.size,
    };
  },

  async markBoarding(
    operator: OperatorContext,
    bookingId: string,
    mark: BoardingMark,
  ): Promise<void> {
    // Scope by the booking's trip belonging to the operator. operator_user_id is
    // denormalized onto bookings, so a single-table check suffices.
    const result = (await db.execute(sql`
      UPDATE bookings SET status = ${mark}
      WHERE id = ${bookingId} AND operator_user_id = ${operator.userId}
        AND status IN ('confirmed', 'boarded', 'no_show')
      RETURNING id
    `)) as unknown as { rows?: Row[] };
    if ((result.rows ?? []).length === 0) {
      throw new OperatorResourceNotFound("Booking not found on your trips");
    }
  },
};

// ── helpers ────────────────────────────────────────────────────────────────

/** Validate an assigned driver belongs to the operator; return null when none. */
async function resolveDriverId(
  tx: Tx,
  operator: OperatorContext,
  driverId: string | null,
): Promise<string | null> {
  if (operator.kind === "driver") {
    // An independent driver always operates as their own driver row.
    return operator.driverId;
  }
  if (!driverId) return null;
  const rows = (await tx.execute(sql`
    SELECT id FROM drivers WHERE id = ${driverId} AND company_id = ${operator.companyId} LIMIT 1
  `)) as unknown as { rows?: Row[] };
  if ((rows.rows ?? []).length === 0) {
    throw new OperatorResourceNotFound("Driver not found");
  }
  return driverId;
}

import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { integer, pgPolicy, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { trips } from "./trips";

// One row per booked seat on a trip — the hard seat inventory. The
// **unique (trip_id, seat_number)** constraint is the double-booking guarantee:
// two concurrent confirms for the same seat → one commits, the other hits the
// violation (translated to a SeatUnavailable domain error). On cancellation
// these rows are DELETED to release the seats, so the unique constraint only
// ever covers active bookings. Public-readable (occupancy only, no PII) so the
// seat map can render availability. See docs/ARCHITECTURE.md §6.
export const bookingSeats = pgTable.withRLS(
  "booking_seats",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    bookingId: uuid()
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    seatNumber: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("booking_seats_trip_seat_unique").on(t.tripId, t.seatNumber),
    pgPolicy("booking_seats_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("booking_seats_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

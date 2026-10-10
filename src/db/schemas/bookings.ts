import { sql } from "drizzle-orm";
import { authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { index, integer, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookingStatusEnum, paymentMethodEnum } from "./enums";
import { trips } from "./trips";
import { users } from "./users";

// A passenger's reservation of one or more seats on a trip. Created `confirmed`
// (cash on boarding) inside the booking-confirm transaction (server-mediated,
// service role) — clients never mutate bookings directly. `operatorUserId` is
// denormalized from the trip so an operator can read bookings on their own
// trips without a cross-table RLS join. `passengerName`/`passengerPhone` are
// snapshotted so the seat board shows them without exposing the users table.
export const bookings = pgTable.withRLS(
  "bookings",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    bookingNumber: text().notNull().unique(),
    passengerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "restrict" }),
    operatorUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: bookingStatusEnum().notNull().default("confirmed"),
    seatCount: integer().notNull(),
    totalMillimes: integer().notNull(),
    paymentMethod: paymentMethodEnum().notNull().default("cash_on_boarding"),
    passengerName: text().notNull(),
    passengerPhone: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("bookings_passenger_idx").on(t.passengerUserId),
    index("bookings_operator_idx").on(t.operatorUserId),
    index("bookings_trip_idx").on(t.tripId),
    pgPolicy("bookings_passenger_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.passengerUserId} = (select auth.uid())`,
    }),
    pgPolicy("bookings_operator_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.operatorUserId} = (select auth.uid())`,
    }),
    pgPolicy("bookings_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

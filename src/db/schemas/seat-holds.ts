import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { index, integer, pgPolicy, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { users } from "./users";

// A temporary lock on a seat during checkout so two passengers can't book the
// same seat. **unique (trip_id, seat_number)** keeps one hold row per seat; the
// hold use-case takes over an expired row via upsert (ON CONFLICT ... WHERE
// expires_at < now()). A seat is available only when it has no booking_seats
// row AND no seat_holds row with expires_at > now(). A scheduled sweep purges
// truly abandoned rows. Public-readable (occupancy only) for the seat map.
// See docs/ARCHITECTURE.md §6 and docs/CAUTIONS.md §1.
export const seatHolds = pgTable.withRLS(
  "seat_holds",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    seatNumber: integer().notNull(),
    heldBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("seat_holds_trip_seat_unique").on(t.tripId, t.seatNumber),
    // Backs the expiry sweep and the "active holds" availability filter.
    index("seat_holds_expires_idx").on(t.expiresAt),
    pgPolicy("seat_holds_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("seat_holds_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

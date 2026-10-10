import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import {
  date,
  index,
  integer,
  pgPolicy,
  pgTable,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tripStatusEnum } from "./enums";
import { companies } from "./companies";
import { drivers } from "./drivers";
import { routes } from "./routes";
import { users } from "./users";
import { vehicles } from "./vehicles";

// A single scheduled departure on a route, operated by a company (with an
// assigned driver) or an independent driver. `operatorUserId` denormalizes the
// operating account so RLS stays single-table (operator sees only own trips) —
// see docs/CAUTIONS.md §11. `totalSeats` is copied from the vehicle's
// passenger-seat count; `priceMillimes` is integer millimes (docs/CAUTIONS §2).
export const trips = pgTable.withRLS(
  "trips",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    routeId: uuid()
      .notNull()
      .references(() => routes.id, { onDelete: "restrict" }),
    companyId: uuid().references(() => companies.id, { onDelete: "set null" }),
    driverId: uuid().references(() => drivers.id, { onDelete: "set null" }),
    vehicleId: uuid()
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    operatorUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    serviceDate: date().notNull(),
    departureTime: time().notNull(),
    estArrivalTime: time(),
    priceMillimes: integer().notNull(),
    status: tripStatusEnum().notNull().default("scheduled"),
    totalSeats: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Backs the passenger search: route + date + status, ordered by departure.
    index("trips_search_idx").on(t.routeId, t.serviceDate, t.status),
    // Backs the operator dashboard (their own trips).
    index("trips_operator_idx").on(t.operatorUserId),
    pgPolicy("trips_public_read_bookable", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${t.status} IN ('scheduled', 'boarding')`,
    }),
    pgPolicy("trips_operator_write", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.operatorUserId} = (select auth.uid())`,
      withCheck: sql`${t.operatorUserId} = (select auth.uid())`,
    }),
    pgPolicy("trips_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { drivers } from "./drivers";

// A seat's fixed position on a vehicle. `kind` drives the passenger seat map:
// passenger seats are bookable; the driver seat and blocked positions never
// count as inventory. `number` is what the passenger sees and books.
export type SeatPosition = {
  number: number;
  row: number;
  col: number;
  kind: "passenger" | "driver" | "blocked";
};

export type SeatLayout = {
  rows: number;
  cols: number;
  seats: SeatPosition[];
};

// A louage owned by exactly one operator — a company OR an independent driver
// (enforced by the check constraint). `seatLayout` is the source of truth for
// the seat map; `seatCount` denormalizes the count of passenger seats.
export const vehicles = pgTable.withRLS(
  "vehicles",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    companyId: uuid().references(() => companies.id, { onDelete: "cascade" }),
    driverId: uuid().references(() => drivers.id, { onDelete: "cascade" }),
    plate: text().notNull(),
    model: text(),
    seatCount: integer().notNull(),
    seatLayout: jsonb().$type<SeatLayout>().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("vehicles_one_owner", sql`num_nonnulls(${t.companyId}, ${t.driverId}) = 1`),
    index("vehicles_company_idx")
      .on(t.companyId)
      .where(sql`${t.companyId} IS NOT NULL`),
    index("vehicles_driver_idx")
      .on(t.driverId)
      .where(sql`${t.driverId} IS NOT NULL`),
    pgPolicy("vehicles_public_read_active", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${t.isActive} = true`,
    }),
    pgPolicy("vehicles_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

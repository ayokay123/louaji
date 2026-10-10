import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import {
  type AnyPgColumn,
  integer,
  numeric,
  pgPolicy,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { cities } from "./cities";

// A directional city pair (origin → destination). Tunis→Sousse and
// Sousse→Tunis are two routes. Estimated duration/distance inform default
// arrival times. Super-admin owned catalog (server-mediated writes).
export const routes = pgTable.withRLS(
  "routes",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    originCityId: uuid()
      .notNull()
      .references((): AnyPgColumn => cities.id, { onDelete: "restrict" }),
    destinationCityId: uuid()
      .notNull()
      .references((): AnyPgColumn => cities.id, { onDelete: "restrict" }),
    estDurationMin: integer(),
    estDistanceKm: numeric({ precision: 6, scale: 1 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("routes_origin_destination_unique").on(t.originCityId, t.destinationCityId),
    pgPolicy("routes_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("routes_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

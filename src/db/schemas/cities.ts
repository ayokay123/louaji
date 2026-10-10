import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { geographyPoint } from "../types/geography";

// A searchable origin/destination unit (e.g. Tunis, Sousse, Sfax, Nabeul).
// v1 searches at city granularity; sub-city stations are FUTURE. Names are
// multilingual (ar primary). Coordinate supports nearest-city helpers and
// future map/tracking use. Super-admin owned catalog (server-mediated writes).
export const cities = pgTable.withRLS(
  "cities",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    name: text().notNull(),
    nameFr: text(),
    nameEn: text(),
    governorate: text(),
    location: geographyPoint(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Backs nearest-city / proximity helpers (FUTURE tracking). Light use in v1.
    index("cities_location_gist_idx").using("gist", t.location),
    index("cities_active_idx")
      .on(t.id)
      .where(sql`${t.isActive} = true`),
    pgPolicy("cities_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("cities_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

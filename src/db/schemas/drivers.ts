import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import {
  type AnyPgColumn,
  boolean,
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

// A driver profile. `companyId` null = an independent driver (operates their
// own vehicle/trips directly). `userId` links to the driver's login account
// (independents always have one; company drivers may). Verified before their
// trips become publicly bookable.
export const drivers = pgTable.withRLS(
  "drivers",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    fullName: text().notNull(),
    phone: text(),
    licenseRef: text(),
    companyId: uuid().references((): AnyPgColumn => companies.id, { onDelete: "set null" }),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    isVerified: boolean().notNull().default(false),
    verifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("drivers_company_idx")
      .on(t.companyId)
      .where(sql`${t.companyId} IS NOT NULL`),
    index("drivers_user_idx")
      .on(t.userId)
      .where(sql`${t.userId} IS NOT NULL`),
    pgPolicy("drivers_public_read_verified", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${t.isVerified} = true OR ${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("drivers_self_write", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.userId} = (select auth.uid())`,
      withCheck: sql`${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("drivers_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

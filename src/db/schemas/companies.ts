import { sql } from "drizzle-orm";
import { anonRole, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { boolean, index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

// A transport company that operates a fleet of louages. Owner + optional
// managers are modeled via role_grants. Verified by a super-admin before its
// trips become publicly bookable. Names are multilingual (ar primary).
export const companies = pgTable.withRLS(
  "companies",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    name: text().notNull(),
    nameFr: text(),
    nameEn: text(),
    logoUrl: text(),
    contactPhone: text(),
    description: text(),
    ownerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    isVerified: boolean().notNull().default(false),
    verifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("companies_owner_idx").on(t.ownerUserId),
    pgPolicy("companies_public_read_verified", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${t.isVerified} = true OR ${t.ownerUserId} = (select auth.uid())`,
    }),
    pgPolicy("companies_owner_write", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.ownerUserId} = (select auth.uid())`,
      withCheck: sql`${t.ownerUserId} = (select auth.uid())`,
    }),
    pgPolicy("companies_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

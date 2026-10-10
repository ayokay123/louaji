import { sql } from "drizzle-orm";
import { authenticatedRole, authUsers, serviceRole } from "drizzle-orm/supabase";
import { index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// One row per Supabase auth user. `id` FKs into auth.users so deleting the
// auth user cascades the app user. Identity is the Tunisian phone number
// (E.164, unique); name is required to confirm a booking. Personal data is
// self-only — operators see a passenger's name/phone only via the denormalized
// fields on `bookings` for their own trips, never via this table.
export const users = pgTable.withRLS(
  "users",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text(),
    phone: text().notNull().unique(),
    email: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("users_phone_idx").on(t.phone),
    pgPolicy("users_self_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.id} = (select auth.uid())`,
    }),
    pgPolicy("users_self_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.id} = (select auth.uid())`,
    }),
    pgPolicy("users_self_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.id} = (select auth.uid())`,
      withCheck: sql`${t.id} = (select auth.uid())`,
    }),
    pgPolicy("users_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

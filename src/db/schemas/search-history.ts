import { sql } from "drizzle-orm";
import { authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { date, index, pgPolicy, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { cities } from "./cities";
import { users } from "./users";

// Per-user recent route+date searches, surfaced as "recent searches" on home.
// Self-only (GDPR). Guests keep this in local storage instead.
export const searchHistory = pgTable.withRLS(
  "search_history",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    originCityId: uuid()
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    destinationCityId: uuid()
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    serviceDate: date(),
    searchedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("search_history_user_idx").on(t.userId, t.searchedAt.desc()),
    pgPolicy("search_history_self_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("search_history_self_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("search_history_self_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("search_history_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

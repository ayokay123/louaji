import { sql } from "drizzle-orm";
import { authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import {
  type AnyPgColumn,
  index,
  pgPolicy,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { appRoleEnum, companyMemberRoleEnum } from "./enums";
import { companies } from "./companies";
import { users } from "./users";

// Per-user role assignments. A user is a passenger by default (no row needed);
// rows grant operator/staff roles. `companyId` scopes a `company_admin` grant
// to one company, with `companyMemberRole` distinguishing owner vs manager.
// Granted/revoked by a super-admin (server-mediated, service role).
export const roleGrants = pgTable.withRLS(
  "role_grants",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: appRoleEnum().notNull(),
    companyId: uuid().references((): AnyPgColumn => companies.id, { onDelete: "cascade" }),
    companyMemberRole: companyMemberRoleEnum(),
    grantedByUserId: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    grantedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("role_grants_user_role_company_unique").on(t.userId, t.role, t.companyId),
    index("role_grants_user_idx").on(t.userId),
    pgPolicy("role_grants_self_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = (select auth.uid())`,
    }),
    pgPolicy("role_grants_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

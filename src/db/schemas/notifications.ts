import { sql } from "drizzle-orm";
import { authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { index, jsonb, pgPolicy, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { notificationTypeEnum } from "./enums";
import { users } from "./users";

// In-app notifications for the recipient. Display copy is rendered client-side
// from `type` + `data`, never stored, so copy changes don't need a migration.
// SMS (booking confirmation, operator-initiated trip cancellation) is sent via
// an Edge Function, not stored here. `readAt IS NULL` = unread.
export type NotificationData =
  | { type: "booking_confirmed"; bookingId: string }
  | { type: "trip_reminder"; bookingId: string; tripId: string }
  | { type: "trip_cancelled"; bookingId: string; tripId: string }
  | { type: "booking_cancelled"; bookingId: string }
  | { type: "new_booking"; bookingId: string; tripId: string }
  | { type: "passenger_cancellation"; bookingId: string; tripId: string };

export const notifications = pgTable.withRLS(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    recipientId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum().notNull(),
    data: jsonb().$type<NotificationData>().notNull(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_recipient_idx").on(t.recipientId, t.createdAt.desc()),
    index("notifications_recipient_unread_idx")
      .on(t.recipientId, t.createdAt.desc())
      .where(sql`${t.readAt} IS NULL`),
    pgPolicy("notifications_recipient_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.recipientId} = (select auth.uid())`,
    }),
    pgPolicy("notifications_recipient_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.recipientId} = (select auth.uid())`,
      withCheck: sql`${t.recipientId} = (select auth.uid())`,
    }),
    pgPolicy("notifications_service_role_write", {
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

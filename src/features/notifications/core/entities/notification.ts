import type { NotificationData } from "@/db/schemas/notifications";
import type { NotificationType } from "@/db/schemas/enums";

export type { NotificationData, NotificationType };

// A single in-app notification for the recipient. Display copy is NOT stored —
// the UI renders it from `type` + `data` via i18n, so copy changes never need a
// migration (see src/db/schemas/notifications.ts). `readAt === null` = unread.
export interface Notification {
  id: string;
  type: NotificationType;
  data: NotificationData;
  readAt: string | null; // ISO timestamp, or null when unread
  createdAt: string; // ISO timestamp
}

// Maps a notification `type` to its i18n key under `notifications.*`. The UI
// passes the returned key to `t(...)`; this layer never touches translations so
// the core stays presentation-agnostic.
const TITLE_KEY: Record<NotificationType, string> = {
  booking_confirmed: "notifications.bookingConfirmed",
  trip_reminder: "notifications.tripReminder",
  trip_cancelled: "notifications.tripCancelled",
  booking_cancelled: "notifications.bookingCancelled",
  new_booking: "notifications.newBooking",
  passenger_cancellation: "notifications.passengerCancellation",
};

/** Derive the i18n key for a notification's display title from its type. */
export function notificationTitleKey(type: NotificationType): string {
  return TITLE_KEY[type];
}

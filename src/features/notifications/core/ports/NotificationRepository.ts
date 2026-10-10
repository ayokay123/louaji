import type { NotificationData } from "@/db/schemas/notifications";
import type { Notification } from "../entities/notification";

// The port the notification use-cases depend on. The Supabase/Drizzle adapter
// implements it; the use-cases never see Drizzle, pg, or supabase-js. Keeping
// this interface narrow is what makes the core testable and vendor-swappable
// (docs/ARCHITECTURE.md §2). Mirrors the BookingRepository shape.
export interface NotificationRepository {
  listForUser(userId: string): Promise<Notification[]>;
  /** Mark a single notification read; no-op if it isn't the caller's. */
  markRead(notificationId: string, userId: string): Promise<void>;
  /** Mark every unread notification for the caller read. */
  markAllRead(userId: string): Promise<void>;
  /** Insert a notification for the recipient; `type` is derived from `data.type`. */
  createNotification(recipientId: string, data: NotificationData): Promise<Notification>;
}

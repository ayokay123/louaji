import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { NotificationData } from "@/db/schemas/notifications";
import type { NotificationType } from "@/db/schemas/enums";
import type { Notification } from "../../core/entities/notification";
import type { NotificationRepository } from "../../core/ports/NotificationRepository";

// Supabase/Drizzle adapter for in-app notifications. Raw SQL mirroring the
// booking adapter (src/features/booking/adapters/supabase/bookingRepository.ts):
// `db.execute(sql\`...\`)` cast through an explicit `interface Row` so dot access
// satisfies `noPropertyAccessFromIndexSignature`, with all values coerced at the
// mapping boundary. Display copy is never stored — only `type` + `data` (see
// src/db/schemas/notifications.ts).

// Explicit (non-index-signature) shape for raw SQL rows so dot access satisfies
// `noPropertyAccessFromIndexSignature`. All values are `unknown` and coerced at
// the mapping boundary.
interface Row {
  id?: unknown;
  type?: unknown;
  data?: unknown;
  read_at?: unknown;
  created_at?: unknown;
}

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function mapRow(row: Row): Notification {
  return {
    id: String(row.id),
    type: row.type as NotificationType,
    data: row.data as NotificationData,
    readAt: row.read_at != null ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

export const notificationRepository: NotificationRepository = {
  async listForUser(userId: string): Promise<Notification[]> {
    const rows = await query(sql`
      SELECT id, type, data, read_at, created_at
      FROM notifications
      WHERE recipient_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return rows.map(mapRow);
  },

  async markRead(notificationId: string, userId: string): Promise<void> {
    await db.execute(sql`
      UPDATE notifications
      SET read_at = now()
      WHERE id = ${notificationId} AND recipient_id = ${userId} AND read_at IS NULL
    `);
  },

  async markAllRead(userId: string): Promise<void> {
    await db.execute(sql`
      UPDATE notifications
      SET read_at = now()
      WHERE recipient_id = ${userId} AND read_at IS NULL
    `);
  },

  async createNotification(recipientId: string, data: NotificationData): Promise<Notification> {
    const rows = await query(sql`
      INSERT INTO notifications (recipient_id, type, data)
      VALUES (${recipientId}, ${data.type}, ${JSON.stringify(data)}::jsonb)
      RETURNING id, type, data, read_at, created_at
    `);
    const row = rows[0];
    if (!row) throw new Error("Notification row vanished after insert");
    return mapRow(row);
  },
};

// POST /api/notifications/read-all — mark every unread notification read (auth required)
import { markAllReadHandler } from "@/features/notifications/api";

export function POST(request: Request): Promise<Response> {
  return markAllReadHandler(request);
}

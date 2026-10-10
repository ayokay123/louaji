// GET /api/notifications — list own notifications (auth required)
import { listHandler } from "@/features/notifications/api";

export function GET(request: Request): Promise<Response> {
  return listHandler(request);
}

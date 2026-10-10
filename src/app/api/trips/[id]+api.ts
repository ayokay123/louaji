// GET /api/trips/:id — trip detail
import { tripDetailHandler } from "@/features/booking/api";

export function GET(request: Request, { id }: { id: string }): Promise<Response> {
  return tripDetailHandler(request, id);
}

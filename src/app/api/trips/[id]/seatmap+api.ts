// GET /api/trips/:id/seatmap — seat map with live availability
import { seatMapHandler } from "@/features/booking/api";

export function GET(request: Request, { id }: { id: string }): Promise<Response> {
  return seatMapHandler(request, id);
}

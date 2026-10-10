// GET /api/bookings/:id — a single booking / ticket (auth required)
import { getBookingHandler } from "@/features/booking/api";

export function GET(request: Request, { id }: { id: string }): Promise<Response> {
  return getBookingHandler(request, id);
}

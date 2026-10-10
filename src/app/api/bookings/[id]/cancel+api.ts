// POST /api/bookings/:id/cancel — passenger cancels, releasing the seats
import { cancelBookingHandler } from "@/features/booking/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return cancelBookingHandler(request, id);
}

// GET /api/bookings — list own bookings;  POST /api/bookings — confirm a booking
import { confirmHandler, listBookingsHandler } from "@/features/booking/api";

export function GET(request: Request): Promise<Response> {
  return listBookingsHandler(request);
}

export function POST(request: Request): Promise<Response> {
  return confirmHandler(request);
}

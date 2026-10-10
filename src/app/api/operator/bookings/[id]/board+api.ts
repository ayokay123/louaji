// POST /api/operator/bookings/:id/board — mark a booking boarded / no_show
import { markBoardingHandler } from "@/features/trips/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return markBoardingHandler(request, id);
}

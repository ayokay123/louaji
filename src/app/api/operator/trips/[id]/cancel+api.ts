// POST /api/operator/trips/:id/cancel — cancel one of the caller's own trips
import { cancelTripHandler } from "@/features/trips/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return cancelTripHandler(request, id);
}

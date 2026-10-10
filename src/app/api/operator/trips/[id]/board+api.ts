// GET /api/operator/trips/:id/board — seat board with passenger names/phones
import { tripBoardHandler } from "@/features/trips/api";

export function GET(request: Request, { id }: { id: string }): Promise<Response> {
  return tripBoardHandler(request, id);
}

// POST /api/trips/:id/hold — take a temporary seat hold (auth required)
import { holdHandler } from "@/features/booking/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return holdHandler(request, id);
}

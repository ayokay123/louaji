// GET /api/operator/me — the caller's operator context, or null if not an operator
import { meHandler } from "@/features/operators/api";

export function GET(request: Request): Promise<Response> {
  return meHandler(request);
}

// GET /api/routes — catalog routes (origin→destination) for scheduling pickers
import { routesHandler } from "@/features/catalog/api";

export function GET(request: Request): Promise<Response> {
  return routesHandler(request);
}

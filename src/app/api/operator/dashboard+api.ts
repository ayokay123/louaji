// GET /api/operator/dashboard — today's + upcoming trips for the caller, with occupancy
import { dashboardHandler } from "@/features/operators/api";

export function GET(request: Request): Promise<Response> {
  return dashboardHandler(request);
}

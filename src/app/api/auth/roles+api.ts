// GET /api/auth/roles — the caller's granted roles (passenger by default → [])
import { rolesHandler } from "@/features/auth/api";

export function GET(request: Request): Promise<Response> {
  return rolesHandler(request);
}

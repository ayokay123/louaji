// GET /api/admin/users — list platform users + their role grants (super-admin)
import { listUsersHandler } from "@/features/admin/api";

export function GET(request: Request): Promise<Response> {
  return listUsersHandler(request);
}

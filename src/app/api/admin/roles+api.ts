// POST /api/admin/roles — grant a role to a user (super-admin)
import { grantRoleHandler } from "@/features/admin/api";

export function POST(request: Request): Promise<Response> {
  return grantRoleHandler(request);
}

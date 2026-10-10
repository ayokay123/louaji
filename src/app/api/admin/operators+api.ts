// GET /api/admin/operators — pending (unverified) operators awaiting review
import { listPendingOperatorsHandler } from "@/features/admin/api";

export function GET(request: Request): Promise<Response> {
  return listPendingOperatorsHandler(request);
}

// POST /api/admin/operators/:id/verify — verify an operator (body {kind})
import { verifyOperatorHandler } from "@/features/admin/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return verifyOperatorHandler(request, id);
}

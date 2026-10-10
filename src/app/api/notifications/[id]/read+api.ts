// POST /api/notifications/:id/read — mark a single notification read (auth required)
import { markReadHandler } from "@/features/notifications/api";

export function POST(request: Request, { id }: { id: string }): Promise<Response> {
  return markReadHandler(request, id);
}

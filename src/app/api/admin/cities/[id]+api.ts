// PUT /api/admin/cities/:id — edit a catalog city (super-admin)
import { updateCityHandler } from "@/features/admin/api";

export function PUT(request: Request, { id }: { id: string }): Promise<Response> {
  return updateCityHandler(request, id);
}

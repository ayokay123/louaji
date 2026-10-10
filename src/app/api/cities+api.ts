// GET /api/cities — active cities for search / scheduling pickers
import { citiesHandler } from "@/features/catalog/api";

export function GET(request: Request): Promise<Response> {
  return citiesHandler(request);
}

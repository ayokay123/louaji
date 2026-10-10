// GET /api/admin/cities — list catalog cities;  POST /api/admin/cities — add one
import { createCityHandler, listCitiesHandler } from "@/features/admin/api";

export function GET(request: Request): Promise<Response> {
  return listCitiesHandler(request);
}

export function POST(request: Request): Promise<Response> {
  return createCityHandler(request);
}

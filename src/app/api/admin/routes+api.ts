// GET /api/admin/routes — list routes;  POST /api/admin/routes — add a route
import { createRouteHandler, listRoutesHandler } from "@/features/admin/api";

export function GET(request: Request): Promise<Response> {
  return listRoutesHandler(request);
}

export function POST(request: Request): Promise<Response> {
  return createRouteHandler(request);
}

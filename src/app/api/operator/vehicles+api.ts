// GET /api/operator/vehicles — list own fleet;  POST — add a vehicle (with seat layout)
import { createVehicleHandler, listVehiclesHandler } from "@/features/fleet/api";

export function GET(request: Request): Promise<Response> {
  return listVehiclesHandler(request);
}

export function POST(request: Request): Promise<Response> {
  return createVehicleHandler(request);
}

// GET /api/operator/trips — list own trips;  POST — schedule a new trip
import { listTripsHandler, scheduleTripHandler } from "@/features/trips/api";

export function GET(request: Request): Promise<Response> {
  return listTripsHandler(request);
}

export function POST(request: Request): Promise<Response> {
  return scheduleTripHandler(request);
}

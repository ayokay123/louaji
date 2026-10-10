// GET /api/trips/search?originCityId=&destinationCityId=&serviceDate=&locale=
import { searchHandler } from "@/features/booking/api";

export function GET(request: Request): Promise<Response> {
  return searchHandler(request);
}

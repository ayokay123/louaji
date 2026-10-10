import { getRequestLocale, jsonError, jsonOk } from "@/shared/lib/http/api";
import { catalogRepository } from "../adapters/supabase/catalogRepository";

// Public read endpoints for the city/route catalog (guests can browse).

export async function citiesHandler(request: Request): Promise<Response> {
  try {
    return jsonOk({ cities: await catalogRepository.listCities(getRequestLocale(request)) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function routesHandler(request: Request): Promise<Response> {
  try {
    return jsonOk({ routes: await catalogRepository.listRoutes(getRequestLocale(request)) });
  } catch (err) {
    return jsonError(err);
  }
}

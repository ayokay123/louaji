import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/shared/lib/http/client";
import type { City, Route } from "../core/entities";

export const catalogKeys = {
  cities: () => ["catalog", "cities"] as const,
  routes: () => ["catalog", "routes"] as const,
};

export function useCities() {
  return useQuery({
    queryKey: catalogKeys.cities(),
    queryFn: async () => (await apiGet<{ cities: City[] }>("/api/cities")).cities,
    staleTime: 5 * 60 * 1000, // catalog rarely changes
  });
}

export function useRoutes() {
  return useQuery({
    queryKey: catalogKeys.routes(),
    queryFn: async () => (await apiGet<{ routes: Route[] }>("/api/routes")).routes,
    staleTime: 5 * 60 * 1000,
  });
}

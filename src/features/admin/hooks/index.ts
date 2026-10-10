import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import type {
  AdminCity,
  AdminRoute,
  AdminUser,
  CreateCityInput,
  CreateRouteInput,
  GrantRoleInput,
  OperatorKind,
  PendingOperator,
} from "../core/entities";

// React Query hooks for the super-admin surface. Query keys are arrays so
// mutations can invalidate precisely. All requests go through apiGet/apiSend,
// which attach the Supabase access token (so requireSuperAdmin can resolve the
// caller). See docs/BEST_PRACTICES.md (data fetching).

export const adminKeys = {
  cities: () => ["admin", "cities"] as const,
  routes: () => ["admin", "routes"] as const,
  operators: () => ["admin", "operators"] as const,
  users: () => ["admin", "users"] as const,
};

export function useAdminCities() {
  return useQuery({
    queryKey: adminKeys.cities(),
    queryFn: async () => (await apiGet<{ cities: AdminCity[] }>("/api/admin/cities")).cities,
  });
}

export function useCreateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCityInput) =>
      apiSend<{ city: AdminCity }>("/api/admin/cities", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.cities() });
    },
  });
}

export function useAdminRoutes() {
  return useQuery({
    queryKey: adminKeys.routes(),
    queryFn: async () => (await apiGet<{ routes: AdminRoute[] }>("/api/admin/routes")).routes,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRouteInput) =>
      apiSend<{ route: AdminRoute }>("/api/admin/routes", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.routes() });
    },
  });
}

export function usePendingOperators() {
  return useQuery({
    queryKey: adminKeys.operators(),
    queryFn: async () =>
      (await apiGet<{ operators: PendingOperator[] }>("/api/admin/operators")).operators,
  });
}

export function useVerifyOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; kind: OperatorKind }) =>
      apiSend(`/api/admin/operators/${input.id}/verify`, "POST", { kind: input.kind }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.operators() });
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async () => (await apiGet<{ users: AdminUser[] }>("/api/admin/users")).users,
  });
}

export function useGrantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GrantRoleInput) => apiSend("/api/admin/roles", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

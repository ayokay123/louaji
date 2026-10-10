import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import type {
  OnboardOperatorInput,
  OnboardOperatorResult,
  OperatorContext,
} from "../core/entities/operator";
import type { OperatorDashboard } from "../core/entities/dashboard";

// React Query hooks for the operator profile, onboarding, and dashboard.

export const operatorKeys = {
  me: () => ["operator", "me"] as const,
  dashboard: () => ["operator", "dashboard"] as const,
};

export function useOperatorProfile() {
  return useQuery({
    queryKey: operatorKeys.me(),
    queryFn: async () =>
      (await apiGet<{ operator: OperatorContext | null }>("/api/operator/me")).operator,
  });
}

export function useOperatorDashboard() {
  return useQuery({
    queryKey: operatorKeys.dashboard(),
    queryFn: async () =>
      (await apiGet<{ dashboard: OperatorDashboard }>("/api/operator/dashboard")).dashboard,
    refetchInterval: 60_000,
  });
}

export function useOnboardOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardOperatorInput) =>
      apiSend<{ operator: OnboardOperatorResult }>("/api/operator/onboard", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: operatorKeys.me() });
      void qc.invalidateQueries({ queryKey: operatorKeys.dashboard() });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import type { CreateVehicleInput, Vehicle } from "../core/entities/vehicle";

// React Query hooks for the operator fleet.

export const fleetKeys = {
  vehicles: () => ["fleet", "vehicles"] as const,
};

export function useVehicles() {
  return useQuery({
    queryKey: fleetKeys.vehicles(),
    queryFn: async () => (await apiGet<{ vehicles: Vehicle[] }>("/api/operator/vehicles")).vehicles,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) =>
      apiSend<{ vehicle: Vehicle }>("/api/operator/vehicles", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.vehicles() });
    },
  });
}

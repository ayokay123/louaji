import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import { operatorKeys } from "@/features/operators/hooks";
import type { OperatorTrip, ScheduleTripInput } from "../core/entities/trip";
import type { BoardingMark, TripBoard } from "../core/entities/board";

// React Query hooks for operator trip scheduling and the seat board.

export const tripKeys = {
  trips: () => ["operator", "trips"] as const,
  board: (id: string) => ["operator", "board", id] as const,
};

export function useOperatorTrips() {
  return useQuery({
    queryKey: tripKeys.trips(),
    queryFn: async () => (await apiGet<{ trips: OperatorTrip[] }>("/api/operator/trips")).trips,
  });
}

export function useScheduleTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleTripInput) =>
      apiSend<{ trip: OperatorTrip }>("/api/operator/trips", "POST", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tripKeys.trips() });
      void qc.invalidateQueries({ queryKey: operatorKeys.dashboard() });
    },
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => apiSend(`/api/operator/trips/${tripId}/cancel`, "POST"),
    onSuccess: (_data, tripId) => {
      void qc.invalidateQueries({ queryKey: tripKeys.trips() });
      void qc.invalidateQueries({ queryKey: tripKeys.board(tripId) });
      void qc.invalidateQueries({ queryKey: operatorKeys.dashboard() });
    },
  });
}

export function useSeatBoard(tripId: string) {
  return useQuery({
    queryKey: tripKeys.board(tripId),
    queryFn: async () =>
      (await apiGet<{ board: TripBoard }>(`/api/operator/trips/${tripId}/board`)).board,
    refetchInterval: 30_000,
  });
}

export function useMarkBoarding(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { bookingId: string; status: BoardingMark }) =>
      apiSend(`/api/operator/bookings/${input.bookingId}/board`, "POST", {
        status: input.status,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tripKeys.board(tripId) });
    },
  });
}

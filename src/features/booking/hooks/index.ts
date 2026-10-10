import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import type { SearchResultTrip, SearchTripsQuery, TripDetail } from "../core/entities/trip";
import type { TripSeatMap } from "../core/entities/seat";
import type { BookingSummary, SeatHoldResult } from "../core/entities/booking";

// React Query hooks calling the booking API routes. Query keys are arrays so
// mutations can invalidate precisely. See docs/BEST_PRACTICES.md (data fetching).

export const bookingKeys = {
  search: (q: SearchTripsQuery) => ["trips", "search", q] as const,
  trip: (id: string) => ["trips", "detail", id] as const,
  seatMap: (id: string) => ["trips", "seatmap", id] as const,
  bookings: () => ["bookings", "list"] as const,
  booking: (id: string) => ["bookings", "detail", id] as const,
};

export function useSearchTrips(query: SearchTripsQuery | null) {
  return useQuery({
    queryKey: query ? bookingKeys.search(query) : ["trips", "search", "idle"],
    enabled: query !== null && query.originCityId !== query.destinationCityId,
    queryFn: async () => {
      const q = query!;
      const params = new URLSearchParams({
        originCityId: q.originCityId,
        destinationCityId: q.destinationCityId,
        serviceDate: q.serviceDate,
      });
      const res = await apiGet<{ trips: SearchResultTrip[] }>(`/api/trips/search?${params}`);
      return res.trips;
    },
  });
}

export function useTripDetail(tripId: string) {
  return useQuery({
    queryKey: bookingKeys.trip(tripId),
    queryFn: async () => (await apiGet<{ trip: TripDetail }>(`/api/trips/${tripId}`)).trip,
  });
}

export function useSeatMap(tripId: string) {
  return useQuery({
    queryKey: bookingKeys.seatMap(tripId),
    queryFn: async () =>
      (await apiGet<{ seatMap: TripSeatMap }>(`/api/trips/${tripId}/seatmap`)).seatMap,
    // Holds expire; keep the seat map reasonably fresh while a passenger picks.
    refetchInterval: 30_000,
  });
}

export function useHoldSeats(tripId: string) {
  return useMutation({
    mutationFn: (seatNumbers: number[]) =>
      apiSend<SeatHoldResult>(`/api/trips/${tripId}/hold`, "POST", { seatNumbers }),
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tripId: string;
      seatNumbers: number[];
      passengerName: string;
      passengerPhone: string;
    }) => apiSend<{ booking: BookingSummary }>("/api/bookings", "POST", input),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: bookingKeys.bookings() });
      void qc.invalidateQueries({ queryKey: bookingKeys.seatMap(variables.tripId) });
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: bookingKeys.bookings(),
    queryFn: async () => (await apiGet<{ bookings: BookingSummary[] }>("/api/bookings")).bookings,
  });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: bookingKeys.booking(bookingId),
    queryFn: async () =>
      (await apiGet<{ booking: BookingSummary }>(`/api/bookings/${bookingId}`)).booking,
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => apiSend(`/api/bookings/${bookingId}/cancel`, "POST"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookingKeys.bookings() });
    },
  });
}

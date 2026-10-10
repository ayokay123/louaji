import type { AppLocale } from "@/shared/lib/i18n";
import type { SearchResultTrip, SearchTripsQuery, TripDetail } from "../entities/trip";
import type { BookingSummary, SeatHoldResult } from "../entities/booking";
import type { TripSeatMap } from "../entities/seat";

// The port the booking use-cases depend on. The Supabase/Drizzle adapter
// implements it; the use-cases never see Drizzle, pg, or supabase-js. Keeping
// this interface narrow is what makes the core testable and vendor-swappable
// (docs/ARCHITECTURE.md §2).

export interface HoldSeatsInput {
  tripId: string;
  seatNumbers: number[];
  userId: string;
}

export interface ConfirmBookingInput {
  tripId: string;
  seatNumbers: number[];
  userId: string;
  passengerName: string;
  passengerPhone: string;
}

export interface BookingRepository {
  searchTrips(query: SearchTripsQuery, locale: AppLocale): Promise<SearchResultTrip[]>;
  getTripDetail(tripId: string, locale: AppLocale): Promise<TripDetail | null>;
  getSeatMap(tripId: string): Promise<TripSeatMap | null>;
  /** Take a hold on the given seats; throws SeatUnavailable if any are taken. */
  holdSeats(input: HoldSeatsInput): Promise<SeatHoldResult>;
  /** Atomically convert held seats into a confirmed booking. */
  confirmBooking(input: ConfirmBookingInput, locale: AppLocale): Promise<BookingSummary>;
  listBookings(userId: string, locale: AppLocale): Promise<BookingSummary[]>;
  getBooking(bookingId: string, userId: string, locale: AppLocale): Promise<BookingSummary | null>;
  /** Passenger-initiated cancellation; releases the seats. */
  cancelBooking(bookingId: string, userId: string): Promise<void>;
}

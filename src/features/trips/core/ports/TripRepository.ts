import type { AppLocale } from "@/shared/lib/i18n";
import type { OperatorContext } from "@/features/operators/core/entities/operator";
import type { OperatorTrip, ScheduleTripInput } from "../entities/trip";
import type { BoardingMark, CancelledBookingRef, TripBoard } from "../entities/board";

// The port the trip use-cases depend on, implemented by the Supabase/Drizzle
// adapter. Every operation is scoped to the operator's context so an operator
// only ever reads/writes their own trips and the bookings on them.

export interface TripRepository {
  listTrips(operator: OperatorContext, locale: AppLocale): Promise<OperatorTrip[]>;
  /**
   * Schedule a trip. The adapter copies totalSeats from the vehicle and verifies
   * the vehicle (and driver, when given) belong to the operator. `companyId` /
   * `driverId` columns are derived from the operator context.
   */
  scheduleTrip(
    operator: OperatorContext,
    input: ScheduleTripInput,
    locale: AppLocale,
  ): Promise<OperatorTrip>;
  /** Cancel the trip, cancel its confirmed bookings, release the seats, and
   * return the affected passengers so they can be notified. */
  cancelTrip(operator: OperatorContext, tripId: string): Promise<CancelledBookingRef[]>;
  getBoard(operator: OperatorContext, tripId: string, locale: AppLocale): Promise<TripBoard | null>;
  /** Mark a booking on the operator's trip as boarded / no_show. */
  markBoarding(operator: OperatorContext, bookingId: string, mark: BoardingMark): Promise<void>;
}

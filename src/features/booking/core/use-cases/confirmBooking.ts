import type { AppLocale } from "@/shared/lib/i18n";
import type { BookingRepository, ConfirmBookingInput } from "../ports/BookingRepository";
import type { BookingSummary } from "../entities/booking";

// Atomically convert held seats into a confirmed booking (cash on boarding).
// The adapter verifies the holds are still valid and owned by the caller, then
// inserts the booking + booking_seats inside one transaction; the unique
// (trip_id, seat_number) constraint is the double-booking guarantee. The total
// is computed server-side from the trip price — never trusted from the client.
export async function confirmBooking(
  repo: BookingRepository,
  input: ConfirmBookingInput,
  locale: AppLocale,
): Promise<BookingSummary> {
  const passengerName = input.passengerName.trim();
  if (passengerName.length === 0) {
    throw new Error("Passenger name is required");
  }
  if (input.seatNumbers.length === 0) {
    throw new Error("At least one seat must be selected");
  }
  return repo.confirmBooking({ ...input, passengerName }, locale);
}

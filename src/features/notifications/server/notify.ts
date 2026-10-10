import { formatMillimes } from "@/shared/lib/money";
import { logger } from "@/shared/lib/log/server";
import { sendSms } from "@/shared/lib/sms/server";
import type { BookingSummary } from "@/features/booking/core/entities/booking";
import { notificationRepository } from "../adapters/supabase/notificationRepository";

// Server-side side-effect orchestration: fan a domain event out to the in-app
// notification center (always) and SMS (best-effort, the can't-miss channel —
// docs/SRS.md §6.2). Called from API handlers AFTER the booking/trip
// transaction commits, so the data-access adapters stay pure. Everything here
// is best-effort: a notification or SMS failure must never roll back a
// confirmed booking, so each step is guarded and only logged on failure.

/** Passenger confirmed a booking → confirm the passenger (+ SMS), alert the operator. */
export async function notifyBookingConfirmed(
  passengerUserId: string,
  booking: BookingSummary,
): Promise<void> {
  await safe("booking_confirmed:passenger", () =>
    notificationRepository.createNotification(passengerUserId, {
      type: "booking_confirmed",
      bookingId: booking.id,
    }),
  );
  await safe("new_booking:operator", () =>
    notificationRepository.createNotification(booking.operatorUserId, {
      type: "new_booking",
      bookingId: booking.id,
      tripId: booking.tripId,
    }),
  );
  await safe("booking_confirmed:sms", () =>
    sendSms(
      booking.passengerPhone,
      `Louaji: ${booking.bookingNumber} — ${booking.originCity} → ${booking.destinationCity} ${booking.serviceDate} ${booking.departureTime}. ` +
        `${booking.seatNumbers.join(", ")} | ${formatMillimes(booking.totalMillimes)}.`,
    ),
  );
}

/** Passenger cancelled their booking → alert the operator. */
export async function notifyPassengerCancelled(
  operatorUserId: string,
  bookingId: string,
  tripId: string,
): Promise<void> {
  await safe("passenger_cancellation:operator", () =>
    notificationRepository.createNotification(operatorUserId, {
      type: "passenger_cancellation",
      bookingId,
      tripId,
    }),
  );
}

export interface AffectedPassenger {
  userId: string;
  phone: string;
  bookingId: string;
  bookingNumber: string;
}

/** Operator cancelled a trip → notify every booked passenger (+ SMS). */
export async function notifyTripCancelled(
  tripId: string,
  passengers: AffectedPassenger[],
): Promise<void> {
  for (const p of passengers) {
    await safe("trip_cancelled:notify", () =>
      notificationRepository.createNotification(p.userId, {
        type: "trip_cancelled",
        bookingId: p.bookingId,
        tripId,
      }),
    );
    await safe("trip_cancelled:sms", () =>
      sendSms(
        p.phone,
        `Louaji: ${p.bookingNumber} — your departure was cancelled by the operator.`,
      ),
    );
  }
}

async function safe(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.warn({ err, event: label }, "notification side-effect failed");
  }
}

import * as z from "zod";
import {
  getRequestLocale,
  jsonError,
  jsonOk,
  parseJson,
  requireUserId,
} from "@/shared/lib/http/api";
import { logger } from "@/shared/lib/log/server";
import { tunisianPhoneSchema } from "@/shared/lib/validation/phone";
import {
  notifyBookingConfirmed,
  notifyPassengerCancelled,
} from "@/features/notifications/server/notify";
import { bookingRepository as repo } from "../adapters/supabase/bookingRepository";
import { searchTrips } from "../core/use-cases/searchTrips";
import { holdSeats } from "../core/use-cases/holdSeats";
import { confirmBooking } from "../core/use-cases/confirmBooking";

// Expo Router API handlers for the booking flow. Each is a thin wiring layer:
// resolve the caller + locale, validate input, invoke a use-case, map errors.
// The matching `+api.ts` files under src/app/api/ re-export these per HTTP verb.

const seatNumbersSchema = z.array(z.number().int().positive()).min(1).max(12);

const holdSchema = z.object({ seatNumbers: seatNumbersSchema });

const confirmSchema = z.object({
  tripId: z.uuid(),
  seatNumbers: seatNumbersSchema,
  passengerName: z.string().trim().min(1).max(120),
  passengerPhone: tunisianPhoneSchema,
});

const searchSchema = z.object({
  originCityId: z.uuid(),
  destinationCityId: z.uuid(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function searchHandler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = searchSchema.safeParse({
      originCityId: url.searchParams.get("originCityId"),
      destinationCityId: url.searchParams.get("destinationCityId"),
      serviceDate: url.searchParams.get("serviceDate"),
    });
    if (!parsed.success) return jsonOk({ trips: [] });
    const trips = await searchTrips(repo, parsed.data, getRequestLocale(request));
    return jsonOk({ trips });
  } catch (err) {
    return jsonError(err);
  }
}

export async function tripDetailHandler(request: Request, tripId: string): Promise<Response> {
  try {
    const trip = await repo.getTripDetail(tripId, getRequestLocale(request));
    if (!trip) return jsonError({ _tag: "NotFoundError", message: "Trip not found" });
    return jsonOk({ trip });
  } catch (err) {
    return jsonError(err);
  }
}

export async function seatMapHandler(request: Request, tripId: string): Promise<Response> {
  try {
    const seatMap = await repo.getSeatMap(tripId);
    if (!seatMap) return jsonError({ _tag: "NotFoundError", message: "Trip not found" });
    return jsonOk({ seatMap });
  } catch (err) {
    return jsonError(err);
  }
}

export async function holdHandler(request: Request, tripId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const { seatNumbers } = await parseJson(request, holdSchema);
    const result = await holdSeats(repo, { tripId, seatNumbers, userId });
    logger.info({ tripId, seatNumbers, userId, event: "seats_held" }, "seats held");
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}

export async function confirmHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const body = await parseJson(request, confirmSchema);
    const booking = await confirmBooking(repo, { ...body, userId }, getRequestLocale(request));
    logger.info(
      {
        bookingNumber: booking.bookingNumber,
        tripId: booking.tripId,
        seatNumbers: booking.seatNumbers,
        userId,
        event: "booking_confirmed",
      },
      "booking confirmed",
    );
    // Side effects after the booking transaction commits (best-effort).
    await notifyBookingConfirmed(userId, booking);
    return jsonOk({ booking }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

export async function listBookingsHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const bookings = await repo.listBookings(userId, getRequestLocale(request));
    return jsonOk({ bookings });
  } catch (err) {
    return jsonError(err);
  }
}

export async function getBookingHandler(request: Request, bookingId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const booking = await repo.getBooking(bookingId, userId, getRequestLocale(request));
    if (!booking) return jsonError({ _tag: "NotFoundError", message: "Booking not found" });
    return jsonOk({ booking });
  } catch (err) {
    return jsonError(err);
  }
}

export async function cancelBookingHandler(request: Request, bookingId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    // Read the booking first so we can notify the operator after cancelling.
    const booking = await repo.getBooking(bookingId, userId, getRequestLocale(request));
    await repo.cancelBooking(bookingId, userId);
    logger.info({ bookingId, userId, event: "booking_cancelled" }, "booking cancelled");
    if (booking) {
      await notifyPassengerCancelled(booking.operatorUserId, booking.id, booking.tripId);
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

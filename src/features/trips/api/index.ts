import * as z from "zod";
import {
  getRequestLocale,
  jsonError,
  jsonOk,
  parseJson,
  requireUserId,
} from "@/shared/lib/http/api";
import { logger } from "@/shared/lib/log/server";
import { operatorRepository } from "@/features/operators/adapters/supabase/operatorRepository";
import { requireOperator } from "@/features/operators/core/use-cases/requireOperator";
import { notifyTripCancelled } from "@/features/notifications/server/notify";
import { tripRepository as repo } from "../adapters/supabase/tripRepository";
import { scheduleTrip } from "../core/use-cases/scheduleTrip";

// Expo Router API handlers for operator trip scheduling, cancellation, the seat
// board, and boarding marks. Each resolves requireUserId → requireOperator and
// scopes everything to the caller's operating context.

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const scheduleSchema = z.object({
  routeId: z.uuid(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: timeSchema,
  estArrivalTime: timeSchema.nullable().optional(),
  priceMillimes: z.number().int().positive(),
  vehicleId: z.uuid(),
  driverId: z.uuid().nullable().optional(),
});

const boardingSchema = z.object({ status: z.enum(["boarded", "no_show"]) });

export async function listTripsHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const trips = await repo.listTrips(operator, locale);
    return jsonOk({ trips });
  } catch (err) {
    return jsonError(err);
  }
}

export async function scheduleTripHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const body = await parseJson(request, scheduleSchema);
    const trip = await scheduleTrip(
      repo,
      operator,
      {
        routeId: body.routeId,
        serviceDate: body.serviceDate,
        departureTime: body.departureTime,
        estArrivalTime: body.estArrivalTime ?? null,
        priceMillimes: body.priceMillimes,
        vehicleId: body.vehicleId,
        driverId: body.driverId ?? null,
      },
      locale,
    );
    logger.info(
      { tripId: trip.id, operatorUserId: operator.userId, event: "trip_scheduled" },
      "trip scheduled",
    );
    return jsonOk({ trip }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

export async function cancelTripHandler(request: Request, tripId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const affected = await repo.cancelTrip(operator, tripId);
    logger.info(
      {
        tripId,
        operatorUserId: operator.userId,
        affectedBookings: affected.length,
        event: "trip_cancelled",
      },
      "trip cancelled",
    );
    await notifyTripCancelled(tripId, affected);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

export async function tripBoardHandler(request: Request, tripId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const board = await repo.getBoard(operator, tripId, locale);
    if (!board) return jsonError({ _tag: "NotFoundError", message: "Trip not found" });
    return jsonOk({ board });
  } catch (err) {
    return jsonError(err);
  }
}

export async function markBoardingHandler(request: Request, bookingId: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const { status } = await parseJson(request, boardingSchema);
    await repo.markBoarding(operator, bookingId, status);
    logger.info(
      { bookingId, operatorUserId: operator.userId, status, event: "boarding_marked" },
      "boarding marked",
    );
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

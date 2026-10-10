import * as z from "zod";
import {
  getRequestLocale,
  jsonError,
  jsonOk,
  parseJson,
  requireUserId,
} from "@/shared/lib/http/api";
import { operatorRepository } from "@/features/operators/adapters/supabase/operatorRepository";
import { requireOperator } from "@/features/operators/core/use-cases/requireOperator";
import { fleetRepository as repo } from "../adapters/supabase/fleetRepository";
import { createVehicle } from "../core/use-cases/createVehicle";

// Expo Router API handlers for the operator fleet (vehicles + seat layouts).
// Each resolves requireUserId → requireOperator, then scopes reads/writes to
// the caller's operating context.

const seatPositionSchema = z.object({
  number: z.number().int().nonnegative(),
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  kind: z.enum(["passenger", "driver", "blocked"]),
});

const seatLayoutSchema = z.object({
  rows: z.number().int().positive().max(20),
  cols: z.number().int().positive().max(10),
  seats: z.array(seatPositionSchema).min(1).max(200),
});

const createVehicleSchema = z.object({
  plate: z.string().trim().min(1).max(20),
  model: z.string().trim().min(1).max(60).optional(),
  seatLayout: seatLayoutSchema,
});

export async function listVehiclesHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const vehicles = await repo.listVehicles(operator);
    return jsonOk({ vehicles });
  } catch (err) {
    return jsonError(err);
  }
}

export async function createVehicleHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(operatorRepository, userId, locale);
    const body = await parseJson(request, createVehicleSchema);
    const vehicle = await createVehicle(repo, operator, {
      plate: body.plate,
      model: body.model ?? null,
      seatLayout: body.seatLayout,
    });
    return jsonOk({ vehicle }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

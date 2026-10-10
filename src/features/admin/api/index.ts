import * as z from "zod";
import {
  getRequestLocale,
  jsonError,
  jsonOk,
  parseJson,
  requireUserId,
} from "@/shared/lib/http/api";
import { adminRepository as repo } from "../adapters/supabase/adminRepository";
import { requireSuperAdmin } from "../core/use-cases/requireSuperAdmin";

// Expo Router API handlers for the super-admin surface. Each is a thin wiring
// layer: resolve the caller + locale, enforce the super-admin guard, validate
// input, invoke the repository, map errors. The matching `+api.ts` files under
// src/app/api/admin/ re-export these per HTTP verb. The guard throws
// ForbiddenError (→ 403) for any non-super-admin caller. See docs/SRS.md §3.1.

const ROLE_VALUES = ["passenger", "company_admin", "driver", "super_admin"] as const;

const createCitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameFr: z.string().trim().min(1).max(120).optional(),
  nameEn: z.string().trim().min(1).max(120).optional(),
  governorate: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

const updateCitySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  nameFr: z.string().trim().min(1).max(120).nullable().optional(),
  nameEn: z.string().trim().min(1).max(120).nullable().optional(),
  governorate: z.string().trim().min(1).max(120).nullable().optional(),
  isActive: z.boolean().optional(),
});

const createRouteSchema = z.object({
  originCityId: z.uuid(),
  destinationCityId: z.uuid(),
  estDurationMin: z.number().int().positive().optional(),
  estDistanceKm: z.number().positive().optional(),
});

const verifyOperatorSchema = z.object({ kind: z.enum(["company", "driver"]) });

const grantRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(ROLE_VALUES),
  companyId: z.uuid().optional(),
});

/** Resolve the caller and assert super-admin; returns the user id. */
async function authorize(request: Request): Promise<string> {
  const userId = await requireUserId(request);
  await requireSuperAdmin(repo, userId);
  return userId;
}

// ── cities ─────────────────────────────────────────────────────────────────

export async function listCitiesHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const cities = await repo.listCities(getRequestLocale(request));
    return jsonOk({ cities });
  } catch (err) {
    return jsonError(err);
  }
}

export async function createCityHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const body = await parseJson(request, createCitySchema);
    const city = await repo.createCity(body);
    return jsonOk({ city }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

export async function updateCityHandler(request: Request, cityId: string): Promise<Response> {
  try {
    await authorize(request);
    const body = await parseJson(request, updateCitySchema);
    const city = await repo.updateCity(cityId, body);
    return jsonOk({ city });
  } catch (err) {
    return jsonError(err);
  }
}

// ── routes ─────────────────────────────────────────────────────────────────

export async function listRoutesHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const routes = await repo.listRoutes(getRequestLocale(request));
    return jsonOk({ routes });
  } catch (err) {
    return jsonError(err);
  }
}

export async function createRouteHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const body = await parseJson(request, createRouteSchema);
    const route = await repo.createRoute(body);
    return jsonOk({ route }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

// ── operators ──────────────────────────────────────────────────────────────

export async function listPendingOperatorsHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const operators = await repo.listPendingOperators(getRequestLocale(request));
    return jsonOk({ operators });
  } catch (err) {
    return jsonError(err);
  }
}

export async function verifyOperatorHandler(
  request: Request,
  operatorId: string,
): Promise<Response> {
  try {
    await authorize(request);
    const { kind } = await parseJson(request, verifyOperatorSchema);
    if (kind === "company") {
      await repo.verifyCompany(operatorId);
    } else {
      await repo.verifyDriver(operatorId);
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

// ── users + roles ──────────────────────────────────────────────────────────

export async function listUsersHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const users = await repo.listUsers();
    return jsonOk({ users });
  } catch (err) {
    return jsonError(err);
  }
}

export async function grantRoleHandler(request: Request): Promise<Response> {
  try {
    await authorize(request);
    const body = await parseJson(request, grantRoleSchema);
    const grant: { userId: string; role: string; companyId?: string } = {
      userId: body.userId,
      role: body.role,
    };
    if (body.companyId !== undefined) {
      grant.companyId = body.companyId;
    }
    await repo.grantRole(grant);
    return jsonOk({ ok: true }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

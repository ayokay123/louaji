import * as z from "zod";
import {
  getRequestLocale,
  jsonError,
  jsonOk,
  parseJson,
  requireUserId,
} from "@/shared/lib/http/api";
import { tunisianPhoneSchema } from "@/shared/lib/validation/phone";
import { operatorRepository as repo } from "../adapters/supabase/operatorRepository";
import { requireOperator } from "../core/use-cases/requireOperator";
import { onboardOperator } from "../core/use-cases/onboardOperator";

// Expo Router API handlers for the operator profile/onboarding/dashboard. Each
// is a thin wiring layer: resolve caller + locale, validate, invoke a use-case,
// map errors. Importing this module also wires the operator error statuses via
// the side-effecting registration in core/errors.

const onboardSchema = z
  .object({
    kind: z.enum(["company", "driver"]),
    companyName: z.string().trim().min(2).max(120).optional(),
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: tunisianPhoneSchema.optional(),
  })
  .refine((v) => (v.kind === "company" ? !!v.companyName : !!v.fullName), {
    message: "companyName is required for companies, fullName for drivers",
  });

export async function onboardHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const body = await parseJson(request, onboardSchema);
    const result = await onboardOperator(repo, userId, {
      kind: body.kind,
      companyName: body.companyName ?? null,
      fullName: body.fullName ?? null,
      phone: body.phone ?? null,
    });
    return jsonOk({ operator: result }, 201);
  } catch (err) {
    return jsonError(err);
  }
}

export async function meHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const operator = await repo.resolveOperator(userId, getRequestLocale(request));
    return jsonOk({ operator });
  } catch (err) {
    return jsonError(err);
  }
}

export async function dashboardHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const locale = getRequestLocale(request);
    const operator = await requireOperator(repo, userId, locale);
    const dashboard = await repo.getDashboard(operator, locale);
    return jsonOk({ dashboard });
  } catch (err) {
    return jsonError(err);
  }
}

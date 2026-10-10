import * as z from "zod";
import { jsonError, jsonOk, parseJson, requireUserId } from "@/shared/lib/http/api";
import { tunisianPhoneSchema } from "@/shared/lib/validation/phone";
import { authRepository as repo } from "../adapters/supabase/authRepository";
import { ProfileNotFound } from "../core/errors";

// Expo Router API handlers for the auth/profile flow. Each is a thin wiring
// layer: resolve the caller, validate input, invoke the repository, map errors.
// The phone-OTP credential is handled client-side (supabase.auth); these routes
// only sync/read the public.users mirror + role_grants via the service role.
// The matching `+api.ts` files under src/app/api/auth/ re-export these per verb.

const profilePutSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: tunisianPhoneSchema,
});

export async function profileGetHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const profile = await repo.getProfile(userId);
    if (!profile) throw new ProfileNotFound();
    return jsonOk({ profile });
  } catch (err) {
    return jsonError(err);
  }
}

export async function profilePutHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const body = await parseJson(request, profilePutSchema);
    const input: { phone: string; fullName?: string; email?: string } = { phone: body.phone };
    if (body.fullName !== undefined) input.fullName = body.fullName;
    if (body.email !== undefined) input.email = body.email;
    const profile = await repo.upsertProfile(userId, input);
    return jsonOk({ profile });
  } catch (err) {
    return jsonError(err);
  }
}

export async function rolesHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const roles = await repo.getRoles(userId);
    return jsonOk({ roles });
  } catch (err) {
    return jsonError(err);
  }
}

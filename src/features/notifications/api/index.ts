import { jsonError, jsonOk, requireUserId } from "@/shared/lib/http/api";
import { notificationRepository as repo } from "../adapters/supabase/notificationRepository";

// Expo Router API handlers for in-app notifications. Each is a thin wiring
// layer: resolve the caller, invoke the repository, map errors. The matching
// `+api.ts` files under src/app/api/ re-export these per HTTP verb. Mirrors
// src/features/booking/api/index.ts.

export async function listHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    const notifications = await repo.listForUser(userId);
    return jsonOk({ notifications });
  } catch (err) {
    return jsonError(err);
  }
}

export async function markReadHandler(request: Request, id: string): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    await repo.markRead(id, userId);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

export async function markAllReadHandler(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId(request);
    await repo.markAllRead(userId);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

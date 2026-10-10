import i18n from "@/shared/lib/i18n";
import { supabase } from "@/shared/lib/supabase/client";

// Browser-side fetch wrapper for our own /api routes. Attaches the current
// Supabase access token (so requireUserId on the server can resolve the caller)
// and the active locale (so server-side name resolution matches the UI). All
// app data access goes through here → hooks → API routes; the UI never calls
// the database or supabase-js data methods directly. See docs/ARCHITECTURE.md §2.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly tag: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const init: RequestInit = { method, headers: { "content-type": "application/json" } };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return request<T>(path, init);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const auth = await authHeader();
  const sep = path.includes("?") ? "&" : "?";
  const url = `${path}${sep}locale=${i18n.language}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), "x-locale": i18n.language, ...auth },
  });
  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = payload as { error?: string; tag?: string } | null;
    throw new ApiError(res.status, err?.tag, err?.error ?? `Request failed (${res.status})`);
  }
  return payload as T;
}

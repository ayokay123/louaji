import { createClient } from "@supabase/supabase-js";
import * as z from "zod";
import { env } from "@/shared/config/env";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "@/shared/lib/i18n";
import { logger } from "@/shared/lib/log/server";
import { mapErrorToHttp } from "./error-mapper";

/** Resolve the request locale from `?locale=` or the `x-locale` header. */
export function getRequestLocale(request: Request): AppLocale {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("locale") ?? request.headers.get("x-locale") ?? "";
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate)
    ? (candidate as AppLocale)
    : DEFAULT_LOCALE;
}

// Thin helpers shared by every Expo Router API route (`src/features/*/api/*+api.ts`).
// Routes stay declarative: parse the body, resolve the caller, invoke a use-case,
// and let `jsonError` translate any thrown domain error into the right status.
// No business logic lives here — that belongs in `core/use-cases`.

/** JSON success response. */
export function jsonOk(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** Map a thrown error (domain or otherwise) to a JSON error response. Unmapped
 * (500) errors are logged server-side with their detail; the client only gets a
 * generic message so internals never leak. */
export function jsonError(err: unknown): Response {
  const { status, body } = mapErrorToHttp(err);
  if (status >= 500) {
    logger.error({ err }, "unhandled API error");
  }
  return Response.json(body, { status });
}

/** Validation failure raised by `parseJson` — mapped to HTTP 400. */
export class ValidationError extends Error {
  readonly _tag = "ValidationError";
  constructor(public readonly issues: z.core.$ZodIssue[]) {
    super("Invalid request body");
  }
}

/** Parse + validate a request JSON body against a Zod schema, or throw ValidationError. */
export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError([]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

/** Caller is unauthenticated — mapped to HTTP 401. */
export class UnauthorizedError extends Error {
  readonly _tag = "UnauthorizedError";
  constructor(message = "Authentication required") {
    super(message);
  }
}

/**
 * Resolve the authenticated user id from the request's `Authorization: Bearer <jwt>`
 * header by validating the Supabase session. Throws UnauthorizedError if absent
 * or invalid. RLS is the real boundary; this is the convenience identity read.
 */
export async function requireUserId(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    throw new UnauthorizedError();
  }
  const anon = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) {
    throw new UnauthorizedError("Invalid or expired session");
  }
  return data.user.id;
}

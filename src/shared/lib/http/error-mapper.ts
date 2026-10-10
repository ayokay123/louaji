// Maps domain error classes (carrying a `_tag` discriminant) to HTTP status codes.
// Extend as new domain errors are introduced in `src/features/*/core/errors/`.

const STATUS_BY_TAG: Record<string, number> = {
  // Shared boundary errors (see src/shared/lib/http/api.ts).
  ValidationError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  // Booking concurrency (see src/features/booking/core/errors).
  SeatUnavailable: 409,
  HoldExpired: 409,
  HoldNotFound: 404,
  TripNotBookable: 409,
};

export function registerDomainErrorStatus(tag: string, status: number): void {
  STATUS_BY_TAG[tag] = status;
}

type MaybeDomainError = { _tag: string; message?: unknown };

function isDomainError(err: unknown): err is MaybeDomainError {
  return (
    typeof err === "object" &&
    err !== null &&
    "_tag" in err &&
    typeof (err as { _tag: unknown })._tag === "string"
  );
}

export function mapErrorToHttp(err: unknown): {
  status: number;
  body: { error: string; tag?: string };
} {
  if (isDomainError(err)) {
    const tag = err._tag;
    const status = STATUS_BY_TAG[tag] ?? 500;
    const message = typeof err.message === "string" ? err.message : tag;
    return { status, body: { error: message, tag } };
  }
  return { status: 500, body: { error: "Internal Server Error" } };
}

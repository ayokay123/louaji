// Domain errors for the super-admin surface. Each carries a `_tag` the HTTP
// error mapper turns into a status code (see src/shared/lib/http/error-mapper.ts).
// `ForbiddenError` already maps to 403 there; we reuse that tag for the
// super-admin guard so no error-mapper edit is required.

/** The caller is authenticated but lacks the super_admin role grant. */
export class ForbiddenError extends Error {
  readonly _tag = "ForbiddenError";
  constructor(message = "Super-admin privileges are required for this action.") {
    super(message);
  }
}

/** A referenced entity (city, route, operator, user) does not exist. */
export class AdminNotFound extends Error {
  readonly _tag = "NotFoundError";
  constructor(message = "The requested resource was not found.") {
    super(message);
  }
}

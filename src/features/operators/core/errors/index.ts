import { registerDomainErrorStatus } from "@/shared/lib/http/error-mapper";

// Domain errors for the operator side. Each carries a `_tag` the HTTP error
// mapper turns into a status code; we register the statuses here so importing
// this module (transitively, via the operator adapters) wires them up. See
// src/shared/lib/http/error-mapper.ts and src/features/booking/core/errors.

/** The caller holds no operator role grant — not a company admin or driver. */
export class NotAnOperator extends Error {
  readonly _tag = "NotAnOperator";
  constructor() {
    super("You are not registered as an operator.");
  }
}

/** The operator exists but is not yet verified by the platform admin. */
export class OperatorNotVerified extends Error {
  readonly _tag = "OperatorNotVerified";
  constructor() {
    super("Your operator account is pending verification.");
  }
}

/** The caller already has an operator role grant — onboarding is idempotent-by-error. */
export class AlreadyAnOperator extends Error {
  readonly _tag = "AlreadyAnOperator";
  constructor() {
    super("You are already registered as an operator.");
  }
}

/** A referenced resource (vehicle, driver, trip) is not owned by the caller. */
export class OperatorResourceNotFound extends Error {
  readonly _tag = "OperatorResourceNotFound";
  constructor(message = "Resource not found.") {
    super(message);
  }
}

/** The submitted seat layout is structurally invalid (no passenger seats, etc.). */
export class InvalidSeatLayout extends Error {
  readonly _tag = "InvalidSeatLayout";
  constructor(message = "The seat layout is invalid.") {
    super(message);
  }
}

registerDomainErrorStatus("NotAnOperator", 403);
registerDomainErrorStatus("OperatorNotVerified", 403);
registerDomainErrorStatus("AlreadyAnOperator", 409);
registerDomainErrorStatus("OperatorResourceNotFound", 404);
registerDomainErrorStatus("InvalidSeatLayout", 400);

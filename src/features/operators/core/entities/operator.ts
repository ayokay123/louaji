// The resolved operating context for a signed-in user who holds an operator
// role grant — either a company admin (bound to a company) or an independent
// driver. Produced by the `requireOperator` server guard from role_grants and
// the company/driver tables. The use-cases scope every write to this context.

export type OperatorKind = "company" | "driver";

export interface OperatorContext {
  /** The caller's user id — also the trips.operator_user_id for their trips. */
  userId: string;
  kind: OperatorKind;
  /** Set when kind === "company". */
  companyId: string | null;
  /** Set when kind === "driver" (the driver row owned by this user). */
  driverId: string | null;
  /** Display name (company name or driver full name), locale-resolved. */
  name: string;
  /** Verified by a super-admin? Gates publishing trips that are bookable. */
  isVerified: boolean;
}

// The onboarding payload the caller submits to register as an operator. A
// company name creates a company + company_admin grant; otherwise an
// independent driver profile + driver grant is created.
export interface OnboardOperatorInput {
  kind: OperatorKind;
  companyName: string | null;
  fullName: string | null;
  phone: string | null;
}

export interface OnboardOperatorResult {
  kind: OperatorKind;
  companyId: string | null;
  driverId: string | null;
}

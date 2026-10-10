import type { AppLocale } from "@/shared/lib/i18n";
import { OperatorNotVerified } from "@/features/operators/core/errors";
import type { OperatorContext } from "@/features/operators/core/entities/operator";
import type { OperatorTrip, ScheduleTripInput } from "../entities/trip";
import type { TripRepository } from "../ports/TripRepository";

// Publish a trip. We BLOCK publishing for unverified operators (surfaced to the
// UI as operator.notVerified) — chosen over silently creating a hidden trip so
// the operator gets clear feedback. The adapter copies totalSeats from the
// vehicle and verifies vehicle/driver ownership.
export async function scheduleTrip(
  repo: TripRepository,
  operator: OperatorContext,
  input: ScheduleTripInput,
  locale: AppLocale,
): Promise<OperatorTrip> {
  if (!operator.isVerified) throw new OperatorNotVerified();
  return repo.scheduleTrip(operator, input, locale);
}

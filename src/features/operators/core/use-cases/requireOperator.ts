import type { AppLocale } from "@/shared/lib/i18n";
import { NotAnOperator } from "../errors";
import type { OperatorContext } from "../entities/operator";
import type { OperatorRepository } from "../ports/OperatorRepository";

// Server guard: resolve the caller's operator context from role_grants +
// company/driver, or throw NotAnOperator (403). Every operator API handler runs
// this after requireUserId so writes are scoped to the caller's operating
// account. Verification is NOT enforced here — it gates publishing trips only
// (see scheduleTrip), so an unverified operator can still set up their fleet.
export async function requireOperator(
  repo: OperatorRepository,
  userId: string,
  locale: AppLocale,
): Promise<OperatorContext> {
  const operator = await repo.resolveOperator(userId, locale);
  if (!operator) throw new NotAnOperator();
  return operator;
}

import { AlreadyAnOperator } from "../errors";
import type { OnboardOperatorInput, OnboardOperatorResult } from "../entities/operator";
import type { OperatorRepository } from "../ports/OperatorRepository";

// Register the caller as an operator. If they already hold an operator grant we
// short-circuit with AlreadyAnOperator rather than creating a duplicate. The
// adapter also translates the unique-constraint race into the same error.
export async function onboardOperator(
  repo: OperatorRepository,
  userId: string,
  input: OnboardOperatorInput,
): Promise<OnboardOperatorResult> {
  const existing = await repo.resolveOperator(userId, "ar");
  if (existing) throw new AlreadyAnOperator();
  return repo.onboard(userId, input);
}

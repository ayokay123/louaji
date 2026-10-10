import { InvalidSeatLayout } from "@/features/operators/core/errors";
import type { OperatorContext } from "@/features/operators/core/entities/operator";
import { passengerSeatCount, validateSeatLayout } from "../entities/vehicle";
import type { CreateVehicleInput, Vehicle } from "../entities/vehicle";
import type { FleetRepository } from "../ports/FleetRepository";

// Add a vehicle to the operator's fleet. The submitted seat layout is validated
// here (pure check) and the canonical passenger seat count is derived from it —
// never trusted from the client. The adapter scopes the insert to the operator.
export async function createVehicle(
  repo: FleetRepository,
  operator: OperatorContext,
  input: CreateVehicleInput,
): Promise<Vehicle> {
  const layoutError = validateSeatLayout(input.seatLayout);
  if (layoutError) throw new InvalidSeatLayout(layoutError);
  const seatCount = passengerSeatCount(input.seatLayout);
  return repo.createVehicle(operator, input, seatCount);
}

import type { OperatorContext } from "@/features/operators/core/entities/operator";
import type { CreateVehicleInput, Vehicle } from "../entities/vehicle";

// The port the fleet use-cases depend on. Implemented by the Supabase/Drizzle
// adapter. Every operation is scoped to the operator's context (company or
// independent driver) so an operator only ever sees and writes their own fleet.

export interface FleetRepository {
  listVehicles(operator: OperatorContext): Promise<Vehicle[]>;
  getVehicle(operator: OperatorContext, vehicleId: string): Promise<Vehicle | null>;
  createVehicle(
    operator: OperatorContext,
    input: CreateVehicleInput,
    seatCount: number,
  ): Promise<Vehicle>;
}

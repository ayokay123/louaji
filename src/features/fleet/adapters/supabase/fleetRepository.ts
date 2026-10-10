import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { OperatorContext } from "@/features/operators/core/entities/operator";
import type { CreateVehicleInput, SeatLayout, Vehicle } from "../../core/entities/vehicle";
import type { FleetRepository } from "../../core/ports/FleetRepository";

// Supabase/Drizzle adapter for the operator's fleet. Vehicles are owned by
// exactly one of company_id / driver_id (DB check constraint); we scope every
// query and insert to the caller's operator context. Raw SQL rows are typed via
// an explicit `interface Row` (noPropertyAccessFromIndexSignature).

interface Row {
  id?: unknown;
  plate?: unknown;
  model?: unknown;
  seat_count?: unknown;
  seat_layout?: unknown;
  is_active?: unknown;
}

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function ownerFilter(operator: OperatorContext): ReturnType<typeof sql> {
  return operator.kind === "company"
    ? sql`v.company_id = ${operator.companyId}`
    : sql`v.driver_id = ${operator.driverId}`;
}

function mapVehicle(row: Row): Vehicle {
  return {
    id: String(row.id),
    plate: String(row.plate),
    model: row.model ? String(row.model) : null,
    seatCount: Number(row.seat_count),
    seatLayout: row.seat_layout as SeatLayout,
    isActive: row.is_active === true,
  };
}

export const fleetRepository: FleetRepository = {
  async listVehicles(operator: OperatorContext): Promise<Vehicle[]> {
    const rows = await query(sql`
      SELECT v.id, v.plate, v.model, v.seat_count, v.seat_layout, v.is_active
      FROM vehicles v
      WHERE ${ownerFilter(operator)}
      ORDER BY v.created_at DESC
    `);
    return rows.map(mapVehicle);
  },

  async getVehicle(operator: OperatorContext, vehicleId: string): Promise<Vehicle | null> {
    const rows = await query(sql`
      SELECT v.id, v.plate, v.model, v.seat_count, v.seat_layout, v.is_active
      FROM vehicles v
      WHERE v.id = ${vehicleId} AND ${ownerFilter(operator)}
      LIMIT 1
    `);
    const row = rows[0];
    return row ? mapVehicle(row) : null;
  },

  async createVehicle(
    operator: OperatorContext,
    input: CreateVehicleInput,
    seatCount: number,
  ): Promise<Vehicle> {
    const companyId = operator.kind === "company" ? operator.companyId : null;
    const driverId = operator.kind === "driver" ? operator.driverId : null;
    const layoutJson = JSON.stringify(input.seatLayout);
    const rows = await query(sql`
      INSERT INTO vehicles (company_id, driver_id, plate, model, seat_count, seat_layout)
      VALUES (
        ${companyId}, ${driverId}, ${input.plate}, ${input.model},
        ${seatCount}, ${layoutJson}::jsonb
      )
      RETURNING id, plate, model, seat_count, seat_layout, is_active
    `);
    const row = rows[0];
    if (!row) throw new Error("Vehicle insert returned no row");
    return mapVehicle(row);
  },
};

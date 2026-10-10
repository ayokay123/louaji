import type { SeatLayout, SeatPosition } from "@/db/schemas/vehicles";

export type { SeatLayout, SeatPosition };

// Read model for a vehicle in the operator's fleet. `seatCount` is the count of
// passenger seats (derived from the layout), used as the trip's totalSeats.
export interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
  seatCount: number;
  seatLayout: SeatLayout;
  isActive: boolean;
}

// Payload the operator submits to add a vehicle. The seat layout is the source
// of truth; seatCount is recomputed server-side from the passenger seats.
export interface CreateVehicleInput {
  plate: string;
  model: string | null;
  seatLayout: SeatLayout;
}

/** Count of bookable (passenger) seats in a layout — the canonical seatCount. */
export function passengerSeatCount(layout: SeatLayout): number {
  return layout.seats.filter((s) => s.kind === "passenger").length;
}

/**
 * Validate a submitted seat layout: dimensions positive, every seat in bounds,
 * passenger seat numbers unique and contiguous-ish (>=1), at least one
 * passenger seat. Returns an error message or null when valid. Pure — no I/O.
 */
export function validateSeatLayout(layout: SeatLayout): string | null {
  if (!Number.isInteger(layout.rows) || layout.rows < 1) return "rows must be a positive integer";
  if (!Number.isInteger(layout.cols) || layout.cols < 1) return "cols must be a positive integer";
  if (!Array.isArray(layout.seats) || layout.seats.length === 0) return "seats must be non-empty";

  const passengerNumbers = new Set<number>();
  for (const seat of layout.seats) {
    if (seat.row < 0 || seat.row >= layout.rows) return "a seat row is out of bounds";
    if (seat.col < 0 || seat.col >= layout.cols) return "a seat col is out of bounds";
    if (seat.kind === "passenger") {
      if (!Number.isInteger(seat.number) || seat.number < 1) {
        return "passenger seats need a positive number";
      }
      if (passengerNumbers.has(seat.number)) return "duplicate passenger seat number";
      passengerNumbers.add(seat.number);
    }
  }
  if (passengerNumbers.size === 0) return "at least one passenger seat is required";
  return null;
}

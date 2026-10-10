import type { BookingRepository, HoldSeatsInput } from "../ports/BookingRepository";
import type { SeatHoldResult } from "../entities/booking";

// Take a temporary hold on the chosen seats at checkout start. The adapter does
// the constraint-backed insert inside a transaction and throws SeatUnavailable
// if any seat is already booked or actively held. See docs/ARCHITECTURE.md §6.
export async function holdSeats(
  repo: BookingRepository,
  input: HoldSeatsInput,
): Promise<SeatHoldResult> {
  const seatNumbers = dedupe(input.seatNumbers);
  if (seatNumbers.length === 0) {
    throw new Error("At least one seat must be selected");
  }
  return repo.holdSeats({ ...input, seatNumbers });
}

function dedupe(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

import type { SeatLayout, SeatPosition } from "@/db/schemas/vehicles";

export type { SeatLayout, SeatPosition };

// What a passenger sees per seat on the trip seat map. Derived from the
// vehicle's static layout combined with the trip's live occupancy (bookings +
// active holds). See docs/SRS.md §2.4 and docs/ARCHITECTURE.md §6.
export type SeatState =
  | "available" // bookable
  | "reserved" // booked or held by someone else
  | "blocked" // permanently unavailable (broken / layout gap)
  | "driver"; // driver position — never bookable

export interface SeatView {
  number: number;
  row: number;
  col: number;
  state: SeatState;
}

export interface TripSeatMap {
  tripId: string;
  rows: number;
  cols: number;
  seats: SeatView[];
  /** Count of seats in `available` state. */
  availableCount: number;
}

/**
 * Derive each seat's display state from the static layout plus the sets of
 * seat numbers that are currently booked or held. Pure — no I/O. The caller
 * passes occupancy already filtered to active (non-expired) holds.
 */
export function deriveSeatStates(
  layout: SeatLayout,
  bookedSeatNumbers: ReadonlySet<number>,
  heldSeatNumbers: ReadonlySet<number>,
): SeatView[] {
  return layout.seats.map((pos: SeatPosition): SeatView => {
    if (pos.kind === "driver") return { ...toCoord(pos), state: "driver" };
    if (pos.kind === "blocked") return { ...toCoord(pos), state: "blocked" };
    const taken = bookedSeatNumbers.has(pos.number) || heldSeatNumbers.has(pos.number);
    return { ...toCoord(pos), state: taken ? "reserved" : "available" };
  });
}

function toCoord(pos: SeatPosition): { number: number; row: number; col: number } {
  return { number: pos.number, row: pos.row, col: pos.col };
}

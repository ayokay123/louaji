import type { SeatLayout, SeatPosition } from "../entities/vehicle";

// Pure helpers for the seat-layout designer. The designer keeps a 2D grid of
// cell kinds (empty | passenger | driver | blocked) and converts it to a
// SeatLayout on submit. Passenger seats are auto-numbered row-major so the
// numbers the operator sees match the booked seat numbers.

export type CellKind = "empty" | "passenger" | "driver" | "blocked";

/** The order the designer cycles through when a cell is tapped. */
export const CELL_CYCLE: readonly CellKind[] = ["empty", "passenger", "driver", "blocked"];

export function nextCellKind(current: CellKind): CellKind {
  const idx = CELL_CYCLE.indexOf(current);
  return CELL_CYCLE[(idx + 1) % CELL_CYCLE.length] ?? "empty";
}

/** Build an empty rows×cols grid (all "empty"). */
export function emptyGrid(rows: number, cols: number): CellKind[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, (): CellKind => "empty"));
}

/**
 * Convert the designer grid into a SeatLayout. "empty" cells are dropped;
 * passenger cells are numbered 1..N row-major; driver/blocked cells keep number
 * 0 (never booked). Pure — no I/O.
 */
export function gridToLayout(grid: CellKind[][]): SeatLayout {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const seats: SeatPosition[] = [];
  let passengerNumber = 1;
  for (let row = 0; row < rows; row++) {
    const line = grid[row] ?? [];
    for (let col = 0; col < cols; col++) {
      const kind = line[col] ?? "empty";
      if (kind === "empty") continue;
      if (kind === "passenger") {
        seats.push({ number: passengerNumber++, row, col, kind: "passenger" });
      } else {
        seats.push({ number: 0, row, col, kind });
      }
    }
  }
  return { rows, cols, seats };
}

/** Count of passenger cells in a grid (the resulting vehicle seatCount). */
export function gridSeatCount(grid: CellKind[][]): number {
  return grid.reduce((sum, line) => sum + line.filter((c) => c === "passenger").length, 0);
}

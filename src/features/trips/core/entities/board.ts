import type { SeatLayout, SeatPosition } from "@/db/schemas/vehicles";

export type { SeatLayout, SeatPosition };

// The operator seat board: each passenger seat with its booking (passenger name
// + phone) and boarding status. Unlike the passenger seat map, the operator
// sees PII for their own trip's bookings (RLS allows operator read).

export type BoardSeatState = "available" | "booked" | "blocked" | "driver";

export interface BoardSeat {
  number: number;
  row: number;
  col: number;
  state: BoardSeatState;
  bookingId: string | null;
  bookingStatus: "confirmed" | "boarded" | "no_show" | "cancelled" | null;
  passengerName: string | null;
  passengerPhone: string | null;
}

export interface TripBoard {
  tripId: string;
  originCity: string;
  destinationCity: string;
  serviceDate: string;
  departureTime: string;
  status: "scheduled" | "boarding" | "departed" | "completed" | "cancelled";
  rows: number;
  cols: number;
  seats: BoardSeat[];
  totalSeats: number;
  bookedSeats: number;
}

export type BoardingMark = "boarded" | "no_show";

/**
 * Combine a vehicle layout with the trip's bookings (seat number → booking) to
 * produce the board seats. Pure — no I/O. Booking rows carry the passenger PII
 * already loaded by the adapter.
 */
export function buildBoardSeats(
  layout: SeatLayout,
  bookingBySeat: ReadonlyMap<number, BoardBooking>,
): BoardSeat[] {
  return layout.seats.map((pos: SeatPosition): BoardSeat => {
    if (pos.kind === "driver") return { ...base(pos), state: "driver" };
    if (pos.kind === "blocked") return { ...base(pos), state: "blocked" };
    const booking = bookingBySeat.get(pos.number);
    if (!booking) return { ...base(pos), state: "available" };
    return {
      number: pos.number,
      row: pos.row,
      col: pos.col,
      state: "booked",
      bookingId: booking.bookingId,
      bookingStatus: booking.status,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
    };
  });
}

export interface BoardBooking {
  bookingId: string;
  status: "confirmed" | "boarded" | "no_show" | "cancelled";
  passengerName: string;
  passengerPhone: string;
}

// A passenger whose booking was cancelled because the operator cancelled the
// trip — returned by cancelTrip so the handler can notify them.
export interface CancelledBookingRef {
  userId: string;
  phone: string;
  bookingId: string;
  bookingNumber: string;
}

function base(pos: SeatPosition): Omit<BoardSeat, "state"> {
  return {
    number: pos.number,
    row: pos.row,
    col: pos.col,
    bookingId: null,
    bookingStatus: null,
    passengerName: null,
    passengerPhone: null,
  };
}

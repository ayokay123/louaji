import type { BookingStatus } from "@/db/schemas/enums";

export type { BookingStatus };

export interface SeatHoldResult {
  tripId: string;
  seatNumbers: number[];
  expiresAt: string; // ISO timestamp
}

export interface BookingSummary {
  id: string;
  bookingNumber: string;
  tripId: string;
  operatorUserId: string;
  originCity: string;
  destinationCity: string;
  operatorName: string;
  serviceDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  status: BookingStatus;
  seatNumbers: number[];
  seatCount: number;
  totalMillimes: number;
  passengerName: string;
  passengerPhone: string;
  createdAt: string;
}

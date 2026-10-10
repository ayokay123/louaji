import { TZDate } from "@date-fns/tz";
import { addDays, format, parseISO } from "date-fns";

// All louage departures are local Tunisian time (Africa/Tunis, no DST).
// "Today", "upcoming vs past", and day-chip math must be computed in this
// zone — not the server's or browser's. See docs/CAUTIONS.md §3.

export const APP_TIMEZONE = "Africa/Tunis";

/** Current moment as a TZDate anchored to Africa/Tunis. */
export function nowInTunis(): TZDate {
  return TZDate.tz(APP_TIMEZONE);
}

/** Today's travel date in Africa/Tunis as a `YYYY-MM-DD` string (the `service_date` form). */
export function todayServiceDate(): string {
  return format(nowInTunis(), "yyyy-MM-dd");
}

/**
 * Shift a `YYYY-MM-DD` service date by `days` (negative goes back), returning
 * `YYYY-MM-DD`. Pure calendar-day math — a service_date is a calendar day, so
 * no timezone crossing is involved.
 */
export function addServiceDays(serviceDate: string, days: number): string {
  return format(addDays(parseISO(serviceDate), days), "yyyy-MM-dd");
}

/** Booking-number date segment: travel date as DDMMYY (e.g. 25 May 2024 → "250524"). */
export function bookingNumberDateSegment(serviceDate: Date | TZDate): string {
  return format(new TZDate(serviceDate, APP_TIMEZONE), "ddMMyy");
}

/** Format a `HH:mm:ss`/`HH:mm` time-of-day string for display as `HH:mm`. */
export function formatDepartureTime(time: string): string {
  return time.slice(0, 5);
}

// Domain errors for the booking / seat-hold flow. Each carries a `_tag` that the
// HTTP error mapper turns into a status code (see src/shared/lib/http/error-mapper.ts).
// Adapters translate Postgres unique-violation errors into these — use-cases and
// UI never see a raw PostgrestError / pg error. See docs/CAUTIONS.md §1.

/** A requested seat is already booked or held by someone else. */
export class SeatUnavailable extends Error {
  readonly _tag = "SeatUnavailable";
  constructor(public readonly seatNumbers: number[] = []) {
    super("One or more selected seats are no longer available");
  }
}

/** The hold expired (or was never held) before confirmation — re-pick required. */
export class HoldExpired extends Error {
  readonly _tag = "HoldExpired";
  constructor() {
    super("Your seat hold has expired. Please pick your seats again.");
  }
}

/** No active hold owned by the caller for the requested seats. */
export class HoldNotFound extends Error {
  readonly _tag = "HoldNotFound";
  constructor() {
    super("No active seat hold found for this booking.");
  }
}

/** The trip is not in a bookable state (departed/completed/cancelled). */
export class TripNotBookable extends Error {
  readonly _tag = "TripNotBookable";
  constructor() {
    super("This departure is no longer available for booking.");
  }
}

// How long a seat hold survives before it expires and the seats return to
// availability. Default 10 minutes per docs/SRS.md §2.4. Correctness does not
// depend on the sweep job — every availability read filters `expires_at > now()`.
export const HOLD_DURATION_MINUTES = 10;
export const HOLD_DURATION_MS = HOLD_DURATION_MINUTES * 60 * 1000;

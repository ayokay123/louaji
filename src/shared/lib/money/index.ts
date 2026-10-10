// Money in Louaji is the Tunisian dinar (TND), stored everywhere as integer
// **millimes** (1 dinar = 1000 millimes). Never use floats for money. This is
// the single place money is formatted for display. See docs/CAUTIONS.md §2.

export const MILLIMES_PER_DINAR = 1000;
export const CURRENCY_SYMBOL = "دت";

/** Convert a dinar amount (e.g. from an admin price input) to integer millimes. */
export function dinarsToMillimes(dinars: number): number {
  return Math.round(dinars * MILLIMES_PER_DINAR);
}

/** Line/order total — pure integer math, no float drift. */
export function totalMillimes(pricePerSeatMillimes: number, seatCount: number): number {
  return pricePerSeatMillimes * seatCount;
}

/**
 * Format integer millimes as a dinar string with three decimals, e.g.
 * `15000` → `"15.000 دت"`. Pass `{ symbol: false }` for the bare number.
 */
export function formatMillimes(millimes: number, opts?: { symbol?: boolean }): string {
  const value = (millimes / MILLIMES_PER_DINAR).toFixed(3);
  return opts?.symbol === false ? value : `${value} ${CURRENCY_SYMBOL}`;
}

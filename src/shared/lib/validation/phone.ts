import * as z from "zod";

// Tunisian phone numbers are the identity key (phone-first auth). Store and
// transmit in E.164 (`+216########`). Tunisian mobile numbers are 8 local
// digits; the country code is +216. See docs/CAUTIONS.md §5.

const TUNISIA_DIAL_CODE = "+216";
const LOCAL_DIGITS = 8;

/**
 * Normalize loose user input to E.164 (`+216########`) or return null if it is
 * not a valid Tunisian number. Accepts `+216 12 345 678`, `00216...`, `216...`,
 * or a bare 8-digit local number.
 */
export function normalizeTunisianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^00/, "");
  const local = digits.startsWith("+216")
    ? digits.slice(4)
    : digits.startsWith("216")
      ? digits.slice(3)
      : digits.replace(/^\+/, "");
  if (local.length !== LOCAL_DIGITS || !/^\d{8}$/.test(local)) {
    return null;
  }
  return `${TUNISIA_DIAL_CODE}${local}`;
}

/** Zod schema that accepts loose input and outputs a normalized E.164 string. */
export const tunisianPhoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeTunisianPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Invalid Tunisian phone number" });
      return z.NEVER;
    }
    return normalized;
  });

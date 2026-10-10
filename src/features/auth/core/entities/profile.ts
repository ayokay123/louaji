import type { AppRole } from "@/db/schemas/enums";

// The passenger/account identity, mirrored from public.users. Phone is the
// credential (Tunisian E.164, set by Supabase Auth phone-OTP); fullName is
// required to confirm a booking; email is optional. Roles are read separately
// from role_grants — a user is a passenger by default with no grant row.
// See docs/SRS.md §2.1 and docs/ARCHITECTURE.md §5.

export interface Profile {
  id: string;
  fullName: string | null;
  phone: string;
  email: string | null;
}

export type Role = AppRole;

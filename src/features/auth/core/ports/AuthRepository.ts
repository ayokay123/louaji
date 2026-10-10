import type { AppRole } from "@/db/schemas/enums";
import type { Profile } from "../entities/profile";

// The port the auth use-cases / API handlers depend on. The Supabase/Drizzle
// adapter implements it with the service-role `db` client; nothing here knows
// about Drizzle or pg. Mirrors the booking feature's port shape
// (docs/ARCHITECTURE.md §2).

export interface UpsertProfileInput {
  fullName?: string | undefined;
  phone: string;
  email?: string | undefined;
}

export interface AuthRepository {
  /** Insert or update the caller's public.users row (id = auth uid). */
  upsertProfile(userId: string, input: UpsertProfileInput): Promise<Profile>;
  getProfile(userId: string): Promise<Profile | null>;
  /** Roles granted via role_grants; a passenger with no grant returns []. */
  getRoles(userId: string): Promise<AppRole[]>;
}

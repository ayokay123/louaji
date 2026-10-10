import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/shared/config/env";

// Server-side Supabase client — uses the service-role key and bypasses RLS.
// NEVER import this from any file that ends up in the client bundle. It is
// only safe inside Expo Router API routes (`+api.ts`) and Edge Functions.

export function createServerClient(): SupabaseClient {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Server-only env var — set it in .env " +
        "(never prefixed with EXPO_PUBLIC_).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

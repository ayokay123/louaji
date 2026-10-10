import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/shared/config/env";

export const supabase: SupabaseClient = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

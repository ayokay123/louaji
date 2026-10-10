import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";

// Browser-side session state derived from Supabase Auth. The auth feature
// (src/features/auth) owns the phone-OTP sign-in/up flow that creates the
// session; everything else just reads it through this hook to gate actions
// (e.g. booking confirm requires a signed-in passenger). See docs/SRS.md §2.1.

export interface SessionState {
  session: Session | null;
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    userId: session?.user.id ?? null,
    isAuthenticated: session !== null,
    loading,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

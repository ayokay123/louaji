import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppRole } from "@/db/schemas/enums";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import { supabase } from "@/shared/lib/supabase/client";
import type { Profile } from "../core/entities/profile";

// React Query hooks for the auth/profile flow. This feature is the one place
// allowed to call supabase.auth directly: phone-OTP is the credential, and the
// Supabase client SDK owns the OTP request/verify round-trip. After a verified
// session, useVerifyOtp syncs the public.users mirror via PUT /api/auth/profile.
// Everything else (profile read, roles) goes through our own API routes →
// apiGet/apiSend, matching the booking feature. See docs/ARCHITECTURE.md §2.

export const authKeys = {
  profile: () => ["auth", "profile"] as const,
  roles: () => ["auth", "roles"] as const,
};

export interface ProfileSyncInput {
  fullName?: string;
  email?: string;
  phone: string;
}

function buildProfileBody(input: ProfileSyncInput): Record<string, string> {
  const body: Record<string, string> = { phone: input.phone };
  if (input.fullName !== undefined) body["fullName"] = input.fullName;
  if (input.email !== undefined) body["email"] = input.email;
  return body;
}

/** Step 1 of phone-OTP: ask Supabase Auth to SMS a one-time code. */
export function useRequestOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { phone };
    },
  });
}

export interface VerifyOtpInput {
  phone: string;
  token: string;
  fullName?: string;
}

/** Step 2: verify the SMS code, then mirror the row into public.users. */
export function useVerifyOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: input.phone,
        token: input.token,
        type: "sms",
      });
      if (error) throw error;
      const sync: ProfileSyncInput = { phone: input.phone };
      if (input.fullName !== undefined) sync.fullName = input.fullName;
      const res = await apiSend<{ profile: Profile }>(
        "/api/auth/profile",
        "PUT",
        buildProfileBody(sync),
      );
      return { session: data.session, profile: res.profile };
    },
    onSuccess: (result) => {
      qc.setQueryData(authKeys.profile(), result.profile);
      void qc.invalidateQueries({ queryKey: authKeys.roles() });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => (await apiGet<{ profile: Profile }>("/api/auth/profile")).profile,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: authKeys.roles(),
    queryFn: async () => (await apiGet<{ roles: AppRole[] }>("/api/auth/roles")).roles,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileSyncInput) =>
      apiSend<{ profile: Profile }>("/api/auth/profile", "PUT", buildProfileBody(input)),
    onSuccess: (res) => {
      qc.setQueryData(authKeys.profile(), res.profile);
    },
  });
}

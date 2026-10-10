// expire-holds — scheduled sweep of stale seat holds.
//
// Deletes every seat_hold whose `expires_at` is in the past. This is a Deno
// Edge Function (Supabase Edge runtime) and is intentionally STANDALONE: it does
// NOT import app code, only the Supabase JS client from jsr.
//
// IMPORTANT — correctness does NOT depend on this function. Every availability
// read in the app already filters `expires_at > now()` (see the booking
// adapter), so an expired hold never blocks a seat even if this never runs. This
// sweep is purely housekeeping to keep the table small. Schedule it with cron
// (see supabase/functions/README.md).
//
// Deploy: `supabase functions deploy expire-holds`
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (injected automatically
// on deploy).

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    return Response.json(
      { ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("seat_holds")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("trip_id");

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, deleted: data?.length ?? 0 });
});

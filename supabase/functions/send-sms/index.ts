// send-sms — transactional SMS channel via the Twilio REST API.
//
// This is the transactional SMS channel for booking-confirmation and
// operator-initiated trip-cancellation messages (docs/SRS.md §6.2). It is a Deno
// Edge Function (Supabase Edge runtime) and is intentionally STANDALONE: it does
// NOT import any app code.
//
// MUST be deployed with `supabase functions deploy send-sms` and have its
// secrets set:
//   supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=...
// In local dev it is a NO-OP without Twilio credentials: it returns
// { ok: true, skipped: true } so callers don't fail when SMS isn't configured.
//
// POST body: { "to": "+216...", "body": "..." }

interface SendSmsBody {
  to?: unknown;
  body?: unknown;
}

function jsonResponse(payload: unknown, status: number): Response {
  return Response.json(payload, { status });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let parsed: SendSmsBody;
  try {
    parsed = (await request.json()) as SendSmsBody;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const to = typeof parsed.to === "string" ? parsed.to.trim() : "";
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!to || !body) {
    return jsonResponse({ ok: false, error: "Both `to` and `body` are required" }, 400);
  }

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");

  // Local-dev / unconfigured: no-op so booking flows don't break without Twilio.
  if (!accountSid || !authToken || !from) {
    return jsonResponse({ ok: true, skipped: true, reason: "Twilio not configured" }, 200);
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);
  const form = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const payload = (await res.json().catch(() => null)) as {
      sid?: string;
      message?: string;
    } | null;

    if (!res.ok) {
      return jsonResponse(
        { ok: false, error: payload?.message ?? `Twilio request failed (${res.status})` },
        502,
      );
    }

    return jsonResponse({ ok: true, sid: payload?.sid ?? null }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error sending SMS";
    return jsonResponse({ ok: false, error: message }, 502);
  }
});

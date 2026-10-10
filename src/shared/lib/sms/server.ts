import { env } from "@/shared/config/env";
import { logger } from "@/shared/lib/log/server";

// Server-only transactional SMS sender (Twilio REST API). Used for the messages
// a passenger must not miss — booking confirmation and operator-initiated trip
// cancellation (docs/SRS.md §6.2). NEVER import from client code: it reads the
// Twilio secret. Without Twilio credentials configured it is a safe no-op (logs
// and returns), so the booking flow works locally without an SMS vendor.
//
// Phone OTP (sign-in) goes through Supabase Auth's own provider, not this.

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export interface SmsResult {
  sent: boolean;
  skipped?: boolean;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM;

  if (!sid || !token || !from) {
    logger.info({ to, channel: "sms" }, "SMS skipped — Twilio not configured");
    return { sent: false, skipped: true };
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      logger.warn({ status: res.status, channel: "sms" }, "SMS send failed");
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    logger.warn({ err, channel: "sms" }, "SMS send threw");
    return { sent: false };
  }
}

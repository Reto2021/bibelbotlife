// Resend webhook handler: receives delivery/open/click/bounce/complaint events
// and stores them in `email_tracking_events`. Verifies Svix signatures.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// Constant-time string compare
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifySvix(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): Promise<boolean> {
  // Resend uses Svix; secret is "whsec_<base64>"
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }

  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  // Signature header looks like: "v1,xxxxx v1,yyyyy"
  const candidates = svixSignature
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("v1,"))
    .map((s) => s.slice(3));

  return candidates.some((c) => timingSafeEqual(c, expected));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();

  // --- Signature verification (Svix) ---
  if (WEBHOOK_SECRET) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(
        JSON.stringify({ error: "Missing Svix headers" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Reject events older than 5 minutes
    const tsNum = Number(svixTimestamp);
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) {
      return new Response(JSON.stringify({ error: "Timestamp out of range" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = await verifySvix(body, svixId, svixTimestamp, svixSignature, WEBHOOK_SECRET);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    console.warn("RESEND_WEBHOOK_SECRET not set — accepting webhook without verification");
  }

  // --- Parse + store event ---
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawType = String(payload.type ?? "");
  // Resend event types come like "email.opened", "email.clicked", "email.delivered" ...
  const eventType = rawType.replace(/^email\./, "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const resendEmailId = (data.email_id as string) ?? (data.id as string) ?? null;
  const recipient = Array.isArray(data.to)
    ? (data.to as string[])[0]
    : (data.to as string) ?? null;
  const occurredAt = (payload.created_at as string) ?? (data.created_at as string) ?? new Date().toISOString();
  const headers = (data.headers as Array<{ name: string; value: string }>) ?? [];
  const idemHeader = headers.find(
    (h) => h?.name?.toLowerCase() === "x-idempotency-key" || h?.name?.toLowerCase() === "x-message-id",
  );
  const messageId = (idemHeader?.value as string) ?? (data.tags as any)?.message_id ?? null;

  // --- Filter: nur Events von BibelBot-Absender speichern ---
  // Resend-Webhook ist account-weit; andere Apps teilen sich denselben Endpoint.
  const fromField = String(data.from ?? "");
  const isBibelBot = /@([a-z0-9-]+\.)?biblebot\.life/i.test(fromField);
  if (!isBibelBot) {
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "not_bibelbot_sender", from: fromField }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }



  const { error } = await supabase.from("email_tracking_events").insert({
    message_id: messageId,
    resend_email_id: resendEmailId,
    event_type: eventType,
    recipient_email: recipient,
    occurred_at: occurredAt,
    metadata: {
      raw_type: rawType,
      click: data.click ?? null,
      bounce: data.bounce ?? null,
      complaint: data.complaint ?? null,
      subject: data.subject ?? null,
      from: data.from ?? null,
      tags: data.tags ?? null,
    },
  });

  if (error) {
    // Duplicate (unique index) is OK — webhook retried
    if ((error as { code?: string }).code === "23505") {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Insert failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Web Push helpers ────────────────────────────────────
function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(b64 + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
): Promise<boolean> {
  try {
    // Use simple fetch-based push (no encryption for compatibility)
    // For production, use web-push library via npm
    const resp = await fetch(subscription.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", TTL: "86400" },
      body: payload,
    });
    return resp.ok;
  } catch (e) {
    console.error("Push error:", e);
    return false;
  }
}

// ── Telegram helper ────────────────────────────────────
async function sendTelegram(chatId: number, text: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    return resp.ok;
  } catch (e) {
    console.error("Telegram error:", e);
    return false;
  }
}

// ── SMS helper (textlinksms.com) ────────────────────────
async function sendSMS(phone: string, text: string, apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch("https://textlinksms.com/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone_number: phone, text }),
    });
    return resp.ok;
  } catch (e) {
    console.error("SMS error:", e);
    return false;
  }
}

// ── Format message ────────────────────────────────────
function formatMessage(impulse: Record<string, string>, firstName?: string): string {
  const greeting = firstName ? `Guten Morgen, ${firstName}! 🙏` : "Guten Morgen! 🙏";
  return `${greeting}

*${impulse.topic}*

_${impulse.verse}_
– ${impulse.reference}

${impulse.context}

👉 Mehr auf BibelBot.ch`;
}

function formatSMS(impulse: Record<string, string>, firstName?: string): string {
  const greeting = firstName ? `Guten Morgen, ${firstName}!` : "Guten Morgen!";
  return `${greeting} ${impulse.topic}: ${impulse.teaser} - ${impulse.reference} | BibelBot.ch`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramToken = Deno.env.get("TELEGRAM_API_KEY") || "";
    const smsApiKey = Deno.env.get("TEXTLINKSMS_API_KEY") || "";
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Generate today's impulse by calling the daily-impulse function
    const impulseResp = await fetch(`${supabaseUrl}/functions/v1/daily-impulse`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!impulseResp.ok) throw new Error("Failed to fetch impulse");
    const impulse = await impulseResp.json();

    // 2. Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("daily_subscribers")
      .select("*")
      .eq("is_active", true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    // 3. Send to each subscriber
    for (const sub of subscribers) {
      let success = false;

      if (sub.channel === "telegram" && sub.telegram_chat_id && telegramToken) {
        const msg = formatMessage(impulse, sub.first_name);
        success = await sendTelegram(sub.telegram_chat_id, msg, telegramToken);
      } else if (sub.channel === "sms" && sub.phone_number && smsApiKey) {
        const msg = formatSMS(impulse, sub.first_name);
        success = await sendSMS(sub.phone_number, msg, smsApiKey);
      } else if (sub.channel === "push" && sub.push_subscription && vapidPublic) {
        const msg = JSON.stringify({
          title: `🙏 ${impulse.topic}`,
          body: impulse.teaser,
          url: "https://bibelbotlive.lovable.app",
        });
        success = await sendWebPush(sub.push_subscription, msg, vapidPublic, vapidPrivate);
      }

      if (success) sentCount++;
    }

    // 4. Log broadcast
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("daily_broadcast_log").upsert(
      {
        impulse_date: today,
        impulse_data: impulse,
        subscribers_count: sentCount,
      },
      { onConflict: "impulse_date" }
    );

    return new Response(
      JSON.stringify({ message: "Broadcast complete", sent: sentCount, total: subscribers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Broadcast error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

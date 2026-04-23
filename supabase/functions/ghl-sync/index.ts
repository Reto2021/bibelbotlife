import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const GHL_WEBHOOK_URL = Deno.env.get("GHL_WEBHOOK_URL");
  if (!GHL_WEBHOOK_URL) {
    console.error("GHL_WEBHOOK_URL not configured");
    return new Response(JSON.stringify({ error: "GHL not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate that the secret is a full URL, not just a Pit ID
  if (!/^https?:\/\//i.test(GHL_WEBHOOK_URL)) {
    console.error(
      `GHL_WEBHOOK_URL is not a valid URL (got: "${GHL_WEBHOOK_URL.slice(0, 40)}..."). ` +
      `Expected full webhook URL like https://services.leadconnectorhq.com/hooks/.../webhook-trigger/pit-...`
    );
    return new Response(
      JSON.stringify({
        error: "GHL_WEBHOOK_URL must be a full https:// URL, not just a Pit ID",
        hint: "In GoHighLevel, copy the complete Webhook Trigger URL (starts with https://services.leadconnectorhq.com/hooks/...)",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { type, data } = await req.json();

    if (!type || !data) {
      return new Response(JSON.stringify({ error: "Missing type or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ghlPayload: Record<string, unknown> = {};

    switch (type) {
      case "user_registered":
        ghlPayload = {
          event: "user_registered",
          email: data.email,
          firstName: data.firstName || "",
          source: "BibleBot.Life",
          tags: ["registered_user"],
        };
        break;

      case "daily_subscriber":
        ghlPayload = {
          event: "daily_subscriber",
          channel: data.channel,
          firstName: data.firstName || "",
          phone: data.phone || "",
          language: data.language || "de",
          source: "BibleBot.Life",
          tags: ["daily_impulse_subscriber"],
        };
        break;

      case "donation":
        ghlPayload = {
          event: "donation",
          email: data.email || "",
          amount: data.amount,
          currency: data.currency || "CHF",
          source: "BibleBot.Life",
          tags: ["donor"],
        };
        break;

      case "church_subscription":
        ghlPayload = {
          event: "church_subscription",
          email: data.email || "",
          churchName: data.churchName || "",
          planTier: data.planTier || "",
          amount: data.amount,
          currency: data.currency || "CHF",
          interval: data.interval || "one_time",
          source: "BibleBot.Life",
          tags: ["church_partner", `plan_${data.planTier || "unknown"}`],
        };
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown sync type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ghlPayload),
    });

    const responseText = await response.text();
    console.log(`GHL sync [${type}]: ${response.status} - ${responseText}`);

    return new Response(
      JSON.stringify({ success: response.ok, status: response.status }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GHL sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

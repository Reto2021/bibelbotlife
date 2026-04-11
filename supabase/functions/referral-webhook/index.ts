import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const TIER_VALUES: Record<string, number> = {
  free: 0,
  community: 790,
  gemeinde: 1490,
  kirche: 2990,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { referral_code, inquiry_id, church_name, preferred_tier } = await req.json();

    if (!referral_code || typeof referral_code !== "string") {
      return new Response(JSON.stringify({ error: "missing referral_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Look up partner
    const { data: partner, error: pErr } = await sb
      .from("referral_partners")
      .select("*")
      .eq("code", referral_code)
      .eq("is_active", true)
      .maybeSingle();

    if (pErr || !partner) {
      return new Response(JSON.stringify({ ok: false, reason: "partner_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dealValue = TIER_VALUES[preferred_tier || "free"] || 0;
    const commission = Math.round(dealValue * (partner.commission_rate ?? 0.1) * 100) / 100;

    // Insert conversion
    const { error: cErr } = await sb.from("referral_conversions").insert({
      partner_id: partner.id,
      inquiry_id: inquiry_id || null,
      deal_value: dealValue,
      commission_amount: commission,
      ghl_webhook_status: "pending",
    });
    if (cErr) console.error("conversion insert error", cErr);

    // Update partner totals
    await sb.from("referral_partners").update({
      total_conversions: (partner.total_conversions || 0) + 1,
      total_commission: (partner.total_commission || 0) + commission,
    }).eq("id", partner.id);

    // Send to GHL if configured
    const ghlUrl = Deno.env.get("GHL_WEBHOOK_URL");
    let ghlStatus = "no_url";
    let ghlResponse: unknown = null;

    if (ghlUrl) {
      try {
        const ghlPayload = {
          event: "new_conversion",
          referral_code,
          contact_id: partner.ghl_contact_id,
          partner_name: partner.name,
          partner_email: partner.email,
          church_name: church_name || "Unknown",
          preferred_tier: preferred_tier || "free",
          deal_value: dealValue,
          commission: commission,
          timestamp: new Date().toISOString(),
        };

        const res = await fetch(ghlUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ghlPayload),
        });

        ghlStatus = res.ok ? "sent" : "failed";
        ghlResponse = { status: res.status, statusText: res.statusText };
      } catch (e) {
        ghlStatus = "error";
        ghlResponse = { error: String(e) };
      }

      // Update conversion with GHL status
      if (inquiry_id) {
        await sb.from("referral_conversions")
          .update({ ghl_webhook_status: ghlStatus, ghl_webhook_response: ghlResponse })
          .eq("inquiry_id", inquiry_id);
      }
    }

    return new Response(JSON.stringify({ ok: true, ghl_status: ghlStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("referral-webhook error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const host = (url.searchParams.get("host") || "").slice(0, 255).toLowerCase().trim();
    const event = (url.searchParams.get("event") || "widget_open").slice(0, 64);
    const referrer = req.headers.get("referer") || "";
    const ua = (req.headers.get("user-agent") || "").slice(0, 500);

    if (!host) {
      return new Response("ok", { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    await supabase.from("analytics_events").insert({
      session_id: `embed_${host}_${Date.now()}`,
      event_type: "widget",
      event_name: event,
      page_path: "/embed",
      event_data: { host },
      referrer,
      user_agent: ua,
    });

    // 1x1 transparent gif
    const gif = Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);
    return new Response(gif, {
      headers: { ...corsHeaders, "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("embed-track error", e);
    return new Response("ok", { headers: corsHeaders });
  }
});

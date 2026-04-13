import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify service role or admin key
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${serviceKey}`) {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const ADMIN_KEY = Deno.env.get("ANALYTICS_ADMIN_KEY") || "bibelbot2025";
    if (key !== ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const days = 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const periodLabel = `${new Date(Date.now() - days * 86400000).toLocaleDateString("de-CH")} – ${new Date().toLocaleDateString("de-CH")}`;

  // Get active churches with contact_email
  const { data: churches } = await supabase
    .from("church_partners")
    .select("id, name, slug, contact_email, plan_tier, custom_bot_name, pastor_name")
    .eq("is_active", true)
    .not("contact_email", "is", null);

  if (!churches?.length) {
    return new Response(JSON.stringify({ message: "No churches to report" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get all analytics events for the period
  const { data: allEvents } = await supabase
    .from("analytics_events")
    .select("session_id, event_type, event_name, page_path, church_slug, utm_source, created_at, screen_width")
    .gte("created_at", since)
    .limit(10000);

  const events = allEvents || [];
  const reports: { church: string; email: string; status: string }[] = [];

  for (const church of churches) {
    if (!church.contact_email || !church.slug) continue;

    const churchEvents = events.filter((e: any) => e.church_slug === church.slug);
    const pageviews = churchEvents.filter((e: any) => e.event_type === "pageview");
    const customEvts = churchEvents.filter((e: any) => e.event_type === "event");
    const sessions = new Set(churchEvents.map((e: any) => e.session_id));

    // UTM sources
    const utmCounts: Record<string, number> = {};
    churchEvents.forEach((e: any) => {
      if (e.utm_source) utmCounts[e.utm_source] = (utmCounts[e.utm_source] || 0) + 1;
    });
    const topSources = Object.entries(utmCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top pages
    const pageCounts: Record<string, number> = {};
    pageviews.forEach((e: any) => {
      pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));

    // Devices
    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
    const seenSessions = new Set();
    churchEvents.forEach((e: any) => {
      if (!seenSessions.has(e.session_id)) {
        seenSessions.add(e.session_id);
        const w = e.screen_width || 1024;
        if (w < 768) deviceCounts.mobile++;
        else if (w < 1024) deviceCounts.tablet++;
        else deviceCounts.desktop++;
      }
    });

    // Web chat stats (chat_hero_submit events for this church)
    const webChatEvents = customEvts.filter((e: any) => e.event_name === "chat_hero_submit");
    const webChatSessions = new Set(webChatEvents.map((e: any) => e.session_id));

    const botName = church.custom_bot_name || "BibleBot";

    // Send via transactional email template
    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          templateName: "weekly-report",
          recipientEmail: church.contact_email,
          idempotencyKey: `weekly-report-${church.slug}-${new Date().toISOString().split("T")[0]}`,
          templateData: {
            churchName: church.name,
            botName,
            periodLabel,
            pageviews: pageviews.length,
            sessions: sessions.size,
            interactions: customEvts.length,
            topSources,
            topPages,
            mobile: deviceCounts.mobile,
            tablet: deviceCounts.tablet,
            desktop: deviceCounts.desktop,
            webChatUsers: webChatSessions.size,
            webChatMessages: webChatEvents.length,
          },
        }),
      });

      reports.push({
        church: church.name,
        email: church.contact_email,
        status: emailRes.ok ? "sent" : `error:${emailRes.status}`,
      });
    } catch (err: any) {
      reports.push({
        church: church.name,
        email: church.contact_email,
        status: `error:${err.message}`,
      });
    }
  }

  return new Response(JSON.stringify({
    message: `Reports processed for ${reports.length} churches`,
    reports,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

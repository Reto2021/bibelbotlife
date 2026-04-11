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
      .slice(0, 5);

    // Top pages
    const pageCounts: Record<string, number> = {};
    pageviews.forEach((e: any) => {
      pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Devices
    const deviceCounts: Record<string, number> = { Mobile: 0, Tablet: 0, Desktop: 0 };
    const seenSessions = new Set();
    churchEvents.forEach((e: any) => {
      if (!seenSessions.has(e.session_id)) {
        seenSessions.add(e.session_id);
        const w = e.screen_width || 1024;
        if (w < 768) deviceCounts["Mobile"]++;
        else if (w < 1024) deviceCounts["Tablet"]++;
        else deviceCounts["Desktop"]++;
      }
    });

    // Build HTML email
    const botName = church.custom_bot_name || "BibleBot";
    const sourceRows = topSources.length > 0
      ? topSources.map(([s, c]) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${s}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${c}</td></tr>`).join("")
      : `<tr><td colspan="2" style="padding:8px;color:#888">Keine Quellen erfasst</td></tr>`;

    const pageRows = topPages.length > 0
      ? topPages.map(([p, c]) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${p}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${c}</td></tr>`).join("")
      : `<tr><td colspan="2" style="padding:8px;color:#888">Keine Seitenaufrufe</td></tr>`;

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <div style="text-align:center;margin-bottom:24px">
    <h1 style="font-size:22px;color:#C8883A;margin:0">📊 Wöchentlicher ${botName}-Report</h1>
    <p style="color:#888;font-size:13px;margin:4px 0">${periodLabel}</p>
    <p style="color:#666;font-size:14px;margin:4px 0">${church.name}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr>
      <td style="padding:16px;background:#f8f4ef;border-radius:8px;text-align:center;width:33%">
        <div style="font-size:28px;font-weight:bold;color:#C8883A">${pageviews.length}</div>
        <div style="font-size:12px;color:#888">Seitenaufrufe</div>
      </td>
      <td style="width:8px"></td>
      <td style="padding:16px;background:#f8f4ef;border-radius:8px;text-align:center;width:33%">
        <div style="font-size:28px;font-weight:bold;color:#C8883A">${sessions.size}</div>
        <div style="font-size:12px;color:#888">Besucher</div>
      </td>
      <td style="width:8px"></td>
      <td style="padding:16px;background:#f8f4ef;border-radius:8px;text-align:center;width:33%">
        <div style="font-size:28px;font-weight:bold;color:#C8883A">${customEvts.length}</div>
        <div style="font-size:12px;color:#888">Interaktionen</div>
      </td>
    </tr>
  </table>

  <h3 style="font-size:15px;border-bottom:2px solid #C8883A;padding-bottom:6px">🔗 Traffic-Quellen</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
    <tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Quelle</th><th style="padding:6px 8px;text-align:right">Aufrufe</th></tr>
    ${sourceRows}
  </table>

  <h3 style="font-size:15px;border-bottom:2px solid #C8883A;padding-bottom:6px">📄 Top Seiten</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
    <tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Seite</th><th style="padding:6px 8px;text-align:right">Aufrufe</th></tr>
    ${pageRows}
  </table>

  <h3 style="font-size:15px;border-bottom:2px solid #C8883A;padding-bottom:6px">📱 Geräte</h3>
  <p style="font-size:13px;color:#666">
    Mobile: ${deviceCounts["Mobile"]} · Tablet: ${deviceCounts["Tablet"]} · Desktop: ${deviceCounts["Desktop"]}
  </p>

  <div style="text-align:center;margin-top:32px;padding:16px;background:#f8f4ef;border-radius:8px">
    <p style="font-size:13px;color:#666;margin:0">Dieser Report wurde automatisch von <strong>${botName}</strong> erstellt.</p>
    <p style="font-size:12px;color:#999;margin:4px 0">Powered by BibleBot.Life</p>
  </div>
</body></html>`;

    // Send via transactional email function
    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          templateName: "church-weekly-report",
          recipientEmail: church.contact_email,
          idempotencyKey: `weekly-report-${church.slug}-${new Date().toISOString().split("T")[0]}`,
          templateData: {},
          // Override with raw HTML since we build it here
          rawHtml: html,
          rawSubject: `📊 ${botName} Wochenbericht – ${periodLabel}`,
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

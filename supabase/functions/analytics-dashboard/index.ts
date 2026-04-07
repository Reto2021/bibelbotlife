import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Simple password protection
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const ADMIN_KEY = Deno.env.get("ANALYTICS_ADMIN_KEY") || "bibelbot2025";

  if (key !== ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const days = parseInt(url.searchParams.get("days") || "7");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Fetch all events for the period
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Aggregate stats
  const pageviews = events.filter((e: any) => e.event_type === "pageview");
  const customEvents = events.filter((e: any) => e.event_type === "event");
  const sessions = new Set(events.map((e: any) => e.session_id));

  // Top pages
  const pageCounts: Record<string, number> = {};
  pageviews.forEach((e: any) => {
    pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top events
  const eventCounts: Record<string, number> = {};
  customEvents.forEach((e: any) => {
    eventCounts[e.event_name || "unknown"] = (eventCounts[e.event_name || "unknown"] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Device breakdown
  const devices: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  const sessionDevices = new Map<string, string>();
  events.forEach((e: any) => {
    if (!sessionDevices.has(e.session_id)) {
      const w = e.screen_width || 1024;
      const type = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      sessionDevices.set(e.session_id, type);
      devices[type]++;
    }
  });

  // Daily pageviews
  const dailyCounts: Record<string, number> = {};
  pageviews.forEach((e: any) => {
    const day = e.created_at.split("T")[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  // User flows (top 5 session paths)
  const sessionPaths: Record<string, string[]> = {};
  pageviews.forEach((e: any) => {
    if (!sessionPaths[e.session_id]) sessionPaths[e.session_id] = [];
    sessionPaths[e.session_id].push(e.page_path);
  });
  const flowCounts: Record<string, number> = {};
  Object.values(sessionPaths).forEach((paths) => {
    const flow = paths.join(" → ");
    flowCounts[flow] = (flowCounts[flow] || 0) + 1;
  });
  const topFlows = Object.entries(flowCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([flow, count]) => ({ flow, count }));

  const result = {
    period: { days, since },
    summary: {
      totalPageviews: pageviews.length,
      totalEvents: customEvents.length,
      uniqueSessions: sessions.size,
    },
    topPages,
    topEvents,
    devices,
    dailyPageviews: dailyCounts,
    topFlows,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

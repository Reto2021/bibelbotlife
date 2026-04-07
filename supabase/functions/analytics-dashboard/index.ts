import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

  // Fetch events + subscribers + telegram messages in parallel
  const [eventsRes, subscribersRes, telegramRes] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase
      .from("daily_subscribers")
      .select("*"),
    supabase
      .from("telegram_messages")
      .select("chat_id, role, created_at")
      .order("created_at", { ascending: true })
      .limit(10000),
  ]);

  if (eventsRes.error) {
    return new Response(JSON.stringify({ error: eventsRes.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const events = eventsRes.data || [];
  const subscribers = subscribersRes.data || [];
  const telegramMsgs = telegramRes.data || [];

  // ── Aggregate basic stats ──
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

  // User flows
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

  // ── Journey (21-Tage-Coaching) stats ──
  const journeyEvents = customEvents.filter((e: any) =>
    ["journey_start", "journey_progress", "journey_complete"].includes(e.event_name)
  );
  const journeyStarts = journeyEvents.filter((e: any) => e.event_name === "journey_start").length;
  const journeyCompletes = journeyEvents.filter((e: any) => e.event_name === "journey_complete").length;

  // Progress by day
  const progressByDay: Record<number, number> = {};
  journeyEvents
    .filter((e: any) => e.event_name === "journey_progress")
    .forEach((e: any) => {
      const day = e.event_data?.day;
      if (day) progressByDay[day] = (progressByDay[day] || 0) + 1;
    });
  const journeyProgressChart = Array.from({ length: 21 }, (_, i) => ({
    day: i + 1,
    interactions: progressByDay[i + 1] || 0,
  }));

  // ── Subscriber stats ──
  const subsByChannel: Record<string, number> = {};
  const activeSubsByChannel: Record<string, number> = {};
  subscribers.forEach((s: any) => {
    subsByChannel[s.channel] = (subsByChannel[s.channel] || 0) + 1;
    if (s.is_active) activeSubsByChannel[s.channel] = (activeSubsByChannel[s.channel] || 0) + 1;
  });

  // ── Chat stats (Telegram) ──
  const uniqueChatters = new Set(telegramMsgs.filter((m: any) => m.role === "user").map((m: any) => m.chat_id));
  const userMessages = telegramMsgs.filter((m: any) => m.role === "user").length;
  const botMessages = telegramMsgs.filter((m: any) => m.role === "assistant").length;

  // Messages per user
  const msgsPerUser: Record<string, number> = {};
  telegramMsgs.filter((m: any) => m.role === "user").forEach((m: any) => {
    msgsPerUser[m.chat_id] = (msgsPerUser[m.chat_id] || 0) + 1;
  });
  const avgMsgsPerUser = uniqueChatters.size > 0 ? Math.round(userMessages / uniqueChatters.size * 10) / 10 : 0;

  // Daily chat activity
  const dailyChats: Record<string, number> = {};
  telegramMsgs.forEach((m: any) => {
    const day = m.created_at.split("T")[0];
    dailyChats[day] = (dailyChats[day] || 0) + 1;
  });

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
    journey: {
      starts: journeyStarts,
      completes: journeyCompletes,
      progressChart: journeyProgressChart,
    },
    subscribers: {
      total: subscribers.length,
      active: subscribers.filter((s: any) => s.is_active).length,
      byChannel: subsByChannel,
      activeByChannel: activeSubsByChannel,
    },
    chat: {
      uniqueUsers: uniqueChatters.size,
      totalUserMessages: userMessages,
      totalBotMessages: botMessages,
      avgMessagesPerUser: avgMsgsPerUser,
      dailyActivity: dailyChats,
    },
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

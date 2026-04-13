import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


const zurichParts = (iso: string) => {
  const formatter = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  );
  const weekdayMap: Record<string, number> = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: parseInt(parts.hour, 10),
    weekday: weekdayMap[parts.weekday] ?? new Date(iso).getDay(),
  };
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

  // Paginated fetch to overcome Supabase 1000-row default limit
  const PAGE_SIZE = 1000;
  const fetchAllEvents = async () => {
    const allEvents: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allEvents.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return allEvents;
  };

  // Fetch events + subscribers + telegram messages in parallel
  const [allEvents, subscribersRes, telegramRes, churchesRes, contactRequestsRes] = await Promise.all([
    fetchAllEvents(),
    supabase.from("daily_subscribers").select("*"),
    supabase.from("telegram_messages")
      .select("chat_id, role, created_at")
      .order("created_at", { ascending: true })
      .limit(10000),
    supabase.from("church_partners")
      .select("id, name, slug, is_active, plan_tier"),
    supabase.from("church_contact_requests")
      .select("church_id, created_at")
      .gte("created_at", since),
  ]);

  const events = allEvents;
  const subscribers = subscribersRes.data || [];
  const telegramMsgs = telegramRes.data || [];
  const contactRequests = contactRequestsRes.data || [];
  const churches = churchesRes.data || [];

  // Separate heartbeats from real events for counting
  const nonHeartbeatEvents = events.filter((e: any) => e.event_name !== "heartbeat");

  // ── Aggregate basic stats ──
  const pageviews = nonHeartbeatEvents.filter((e: any) => e.event_type === "pageview");
  const customEvents = nonHeartbeatEvents.filter((e: any) => e.event_type === "event");
  const sessions = new Set(nonHeartbeatEvents.map((e: any) => e.session_id));

  // Top pages
  const pageCounts: Record<string, number> = {};
  pageviews.forEach((e: any) => {
    pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top events (exclude heartbeat)
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
  nonHeartbeatEvents.forEach((e: any) => {
    if (!sessionDevices.has(e.session_id) && e.screen_width) {
      const w = e.screen_width;
      const type = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      sessionDevices.set(e.session_id, type);
      devices[type]++;
    }
  });

  // Daily pageviews
  const dailyCounts: Record<string, number> = {};
  pageviews.forEach((e: any) => {
    const day = zurichParts(e.created_at).date;
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

  // ── Journey stats ──
  const journeyEvents = customEvents.filter((e: any) =>
    ["journey_start", "journey_progress", "journey_complete"].includes(e.event_name)
  );
  const journeyStarts = journeyEvents.filter((e: any) => e.event_name === "journey_start").length;
  const journeyCompletes = journeyEvents.filter((e: any) => e.event_name === "journey_complete").length;
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
  const avgMsgsPerUser = uniqueChatters.size > 0 ? Math.round(userMessages / uniqueChatters.size * 10) / 10 : 0;

  const dailyChats: Record<string, number> = {};
  telegramMsgs.forEach((m: any) => {
    const day = zurichParts(m.created_at).date;
    dailyChats[day] = (dailyChats[day] || 0) + 1;
  });

  // ── Web Chat stats (from analytics_events: chat_hero_submit) ──
  const webChatEvents = customEvents.filter((e: any) => e.event_name === "chat_hero_submit");
  const webChatSessions = new Set(webChatEvents.map((e: any) => e.session_id));
  const webChatDailyCounts: Record<string, number> = {};
  webChatEvents.forEach((e: any) => {
    const day = zurichParts(e.created_at).date;
    webChatDailyCounts[day] = (webChatDailyCounts[day] || 0) + 1;
  });
  // Messages per session for web chat
  const webChatMsgPerSession: Record<string, number> = {};
  webChatEvents.forEach((e: any) => {
    webChatMsgPerSession[e.session_id] = (webChatMsgPerSession[e.session_id] || 0) + 1;
  });
  const webChatAvgPerUser = webChatSessions.size > 0
    ? Math.round(webChatEvents.length / webChatSessions.size * 10) / 10
    : 0;

  // ── Referrer stats ──
  const referrerCounts: Record<string, number> = {};
  const referrerDaily: Record<string, Record<string, number>> = {};
  pageviews.forEach((e: any) => {
    let ref = e.referrer || "";
    if (!ref || ref === "" || ref === "null") { ref = "(direkt)"; }
    else {
      try { ref = new URL(ref).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
    }
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    const day = zurichParts(e.created_at).date;
    if (!referrerDaily[day]) referrerDaily[day] = {};
    referrerDaily[day][ref] = (referrerDaily[day][ref] || 0) + 1;
  });
  const topReferrers = Object.entries(referrerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));
  const topRefSources = topReferrers.slice(0, 5).map((r) => r.source);
  const referrerTrend = Object.entries(referrerDaily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sources]) => {
      const entry: Record<string, string | number> = { date };
      topRefSources.forEach((s) => { entry[s] = sources[s] || 0; });
      return entry;
    });

  // ── Tile click stats ──
  const tileClicks = customEvents.filter((e: any) => e.event_name === "tile_click");
  const tileClickCounts: Record<string, number> = {};
  const dailyTileClicks: Record<string, number> = {};
  tileClicks.forEach((e: any) => {
    const tile = e.event_data?.tile || "unknown";
    tileClickCounts[tile] = (tileClickCounts[tile] || 0) + 1;
    const day = zurichParts(e.created_at).date;
    dailyTileClicks[day] = (dailyTileClicks[day] || 0) + 1;
  });
  const topTiles = Object.entries(tileClickCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tile, count]) => ({ tile, count }));

  // ── LifeWheel stats ──
  const lifewheelEvents = customEvents.filter((e: any) => e.event_name === "lifewheel_complete");
  const lifewheelWeakestCounts: Record<string, number> = {};
  let lifewheelTotalAvg = 0;
  lifewheelEvents.forEach((e: any) => {
    const weakest = e.event_data?.weakest || "unknown";
    lifewheelWeakestCounts[weakest] = (lifewheelWeakestCounts[weakest] || 0) + 1;
    lifewheelTotalAvg += (e.event_data?.average || 0);
  });
  const lifewheelAvg = lifewheelEvents.length > 0
    ? Math.round((lifewheelTotalAvg / lifewheelEvents.length) * 10) / 10
    : 0;
  const lifewheelWeakest = Object.entries(lifewheelWeakestCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([area, count]) => ({ area, count }));

  // ── 7 Whys stats ──
  const sevenWhysStarts = customEvents.filter((e: any) => e.event_name === "seven_whys_start").length;

  // ═══════════════════════════════════════════
  // ── Per-church analytics breakdown ──
  // ═══════════════════════════════════════════
  const churchSlugs = new Set(nonHeartbeatEvents.map((e: any) => e.church_slug).filter(Boolean));
  const churchSlugMap = new Map(churches.map((c: any) => [c.slug, c]));

  const perChurch: Record<string, any> = {};
  for (const slug of churchSlugs) {
    const ce = nonHeartbeatEvents.filter((e: any) => e.church_slug === slug);
    const cpv = ce.filter((e: any) => e.event_type === "pageview");
    const cevt = ce.filter((e: any) => e.event_type === "event");
    const cSessions = new Set(ce.map((e: any) => e.session_id));
    const church = churchSlugMap.get(slug);

    // Daily pageviews for this church
    const cDaily: Record<string, number> = {};
    cpv.forEach((e: any) => {
      const day = zurichParts(e.created_at).date;
      cDaily[day] = (cDaily[day] || 0) + 1;
    });

    // Top events for this church
    const cEventCounts: Record<string, number> = {};
    cevt.forEach((e: any) => {
      cEventCounts[e.event_name || "unknown"] = (cEventCounts[e.event_name || "unknown"] || 0) + 1;
    });

    // Per-church session duration using ALL events including heartbeats
    const churchAllEvents = events.filter((e: any) => e.church_slug === slug);
    const cSessionTs: Record<string, number[]> = {};
    churchAllEvents.forEach((e: any) => {
      if (!cSessionTs[e.session_id]) cSessionTs[e.session_id] = [];
      cSessionTs[e.session_id].push(new Date(e.created_at).getTime());
    });
    let cTotalDur = 0;
    let cCountedSessions = 0;
    for (const ts of Object.values(cSessionTs)) {
      if (ts.length > 1) {
        const dur = Math.max(...ts) - Math.min(...ts);
        if (dur < 7200000) { cTotalDur += dur; cCountedSessions++; }
      } else {
        // Single-event sessions: assume minimum 30s (one heartbeat)
        cTotalDur += 30000;
        cCountedSessions++;
      }
    }
    const cAvgDurSec = cCountedSessions > 0 ? Math.round(cTotalDur / cCountedSessions / 1000) : 0;

    // UTM breakdown for this church
    const cUtmSources: Record<string, number> = {};
    const cUtmMediums: Record<string, number> = {};
    ce.forEach((e: any) => {
      if (e.utm_source) cUtmSources[e.utm_source] = (cUtmSources[e.utm_source] || 0) + 1;
      if (e.utm_medium) cUtmMediums[e.utm_medium] = (cUtmMediums[e.utm_medium] || 0) + 1;
    });

    // Funnel: widget visits → chat starts → contact requests
    const widgetVisits = ce.filter((e: any) => e.utm_source === "widget").length;
    const chatStarts = cevt.filter((e: any) => e.event_name === "chat_hero_submit").length;
    const churchId = church?.id;
    const contactReqs = churchId
      ? contactRequests.filter((cr: any) => cr.church_id === churchId).length
      : 0;

    // Weekly trend for this church (ISO week aggregation)
    const cWeekly: Record<string, { pageviews: number; sessions: Set<string>; events: number }> = {};
    ce.forEach((e: any) => {
      const d = new Date(e.created_at);
      // ISO week: Monday-based
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
      const weekNum = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
      const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      if (!cWeekly[weekKey]) cWeekly[weekKey] = { pageviews: 0, sessions: new Set(), events: 0 };
      if (e.event_type === "pageview") cWeekly[weekKey].pageviews++;
      if (e.event_type === "event") cWeekly[weekKey].events++;
      cWeekly[weekKey].sessions.add(e.session_id);
    });
    const weeklyTrend = Object.entries(cWeekly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, d]) => ({ week, pageviews: d.pageviews, sessions: d.sessions.size, events: d.events }));

    perChurch[slug] = {
      churchName: church?.name || slug,
      planTier: church?.plan_tier || "free",
      isActive: church?.is_active ?? true,
      pageviews: cpv.length,
      events: cevt.length,
      sessions: cSessions.size,
      avgSessionDurationSec: cAvgDurSec,
      dailyPageviews: cDaily,
      weeklyTrend,
      topEvents: Object.entries(cEventCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      utmSources: Object.entries(cUtmSources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([source, count]) => ({ source, count })),
      utmMediums: Object.entries(cUtmMediums)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([medium, count]) => ({ medium, count })),
      funnel: {
        widgetVisits,
        chatStarts,
        contactRequests: contactReqs,
      },
    };
  }

  // ═══════════════════════════════════════
  // ── UTM source breakdown ──
  // ═══════════════════════════════════════
  const utmSourceCounts: Record<string, number> = {};
  const utmMediumCounts: Record<string, number> = {};
  nonHeartbeatEvents.forEach((e: any) => {
    if (e.utm_source) utmSourceCounts[e.utm_source] = (utmSourceCounts[e.utm_source] || 0) + 1;
    if (e.utm_medium) utmMediumCounts[e.utm_medium] = (utmMediumCounts[e.utm_medium] || 0) + 1;
  });
  const topUtmSources = Object.entries(utmSourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));
  const topUtmMediums = Object.entries(utmMediumCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([medium, count]) => ({ medium, count }));

  // ═══════════════════════════════════════
  // ── Hourly distribution ──
  // ═══════════════════════════════════════
  const hourly = new Array(24).fill(0);
  nonHeartbeatEvents.forEach((e: any) => {
    const h = zurichParts(e.created_at).hour;
    hourly[h]++;
  });
  const hourlyDistribution = hourly.map((count, hour) => ({ hour, count }));

  // ═══════════════════════════════════════
  // ── Weekday distribution (Europe/Zurich) ──
  // ═══════════════════════════════════════
  const weekdayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const weekdays = new Array(7).fill(0);
  nonHeartbeatEvents.forEach((e: any) => {
    const d = zurichParts(e.created_at).weekday;
    weekdays[d]++;
  });
  const weekdayDistribution = weekdays.map((count, i) => ({ day: weekdayNames[i], count }));

  // ═══════════════════════════════════════
  // ── Average session duration (using heartbeats for accuracy) ──
  // ═══════════════════════════════════════
  const sessionTimestamps: Record<string, number[]> = {};
  // Use ALL events including heartbeats for duration calculation
  events.forEach((e: any) => {
    if (!sessionTimestamps[e.session_id]) sessionTimestamps[e.session_id] = [];
    sessionTimestamps[e.session_id].push(new Date(e.created_at).getTime());
  });
  let totalDuration = 0;
  let countedSessions = 0;
  for (const ts of Object.values(sessionTimestamps)) {
    if (ts.length > 1) {
      const dur = Math.max(...ts) - Math.min(...ts);
      if (dur < 7200000) { // skip sessions > 2h (likely abandoned)
        totalDuration += dur;
        countedSessions++;
      }
    } else {
      // Single-event sessions count as ~30s (one heartbeat interval)
      totalDuration += 30000;
      countedSessions++;
    }
  }
  const avgSessionDurationSec = countedSessions > 0 ? Math.round(totalDuration / countedSessions / 1000) : 0;

  // ═══════════════════════════════════════
  // ── Bounce rate: sessions with only 1 pageview and no custom events ──
  // ═══════════════════════════════════════
  const sessionPageviewCount: Record<string, number> = {};
  const sessionEventCount: Record<string, number> = {};
  pageviews.forEach((e: any) => {
    sessionPageviewCount[e.session_id] = (sessionPageviewCount[e.session_id] || 0) + 1;
  });
  customEvents.forEach((e: any) => {
    sessionEventCount[e.session_id] = (sessionEventCount[e.session_id] || 0) + 1;
  });
  let bounced = 0;
  const allSessionIds = new Set([...Object.keys(sessionPageviewCount), ...Object.keys(sessionEventCount)]);
  for (const sid of allSessionIds) {
    if ((sessionPageviewCount[sid] || 0) <= 1 && (sessionEventCount[sid] || 0) === 0) {
      bounced++;
    }
  }
  const bounceRate = allSessionIds.size > 0 ? Math.round((bounced / allSessionIds.size) * 100) : 0;

  const result = {
    period: { days, since },
    summary: {
      totalPageviews: pageviews.length,
      totalEvents: customEvents.length,
      uniqueSessions: sessions.size,
      avgSessionDurationSec,
      bounceRate,
    },
    topPages,
    topEvents,
    devices,
    dailyPageviews: dailyCounts,
    topFlows,
    topReferrers,
    referrerTrend,
    referrerTrendKeys: topRefSources,
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
    webChat: {
      uniqueUsers: webChatSessions.size,
      totalMessages: webChatEvents.length,
      avgMessagesPerUser: webChatAvgPerUser,
      dailyActivity: webChatDailyCounts,
    },
    tiles: {
      totalClicks: tileClicks.length,
      topTiles,
      dailyClicks: dailyTileClicks,
    },
    lifewheel: {
      completions: lifewheelEvents.length,
      avgScore: lifewheelAvg,
      weakestAreas: lifewheelWeakest,
    },
    sevenWhys: {
      starts: sevenWhysStarts,
    },
    perChurch,
    utmSources: topUtmSources,
    utmMediums: topUtmMediums,
    hourlyDistribution,
    weekdayDistribution,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

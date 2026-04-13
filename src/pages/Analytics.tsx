import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, Eye, MousePointer, Users, Smartphone, Monitor, Tablet,
  MessageCircle, Flame, Trophy, Bell, TrendingUp, Download, Globe,
  Target, CircleDot, Search, Clock, CalendarDays, Building2, Link2,
  Info, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AnalyticsData = {
  period: { days: number; since: string };
  summary: {
    totalPageviews: number;
    totalEvents: number;
    uniqueSessions: number;
    avgSessionDurationSec?: number;
    bounceRate?: number;
  };
  topPages: { path: string; count: number }[];
  topEvents: { name: string; count: number }[];
  topReferrers?: { source: string; count: number }[];
  referrerTrend?: Record<string, string | number>[];
  referrerTrendKeys?: string[];
  devices: { mobile: number; tablet: number; desktop: number };
  dailyPageviews: Record<string, number>;
  topFlows: { flow: string; count: number }[];
  journey: {
    starts: number;
    completes: number;
    progressChart: { day: number; interactions: number }[];
  };
  subscribers: {
    total: number;
    active: number;
    byChannel: Record<string, number>;
    activeByChannel: Record<string, number>;
  };
  chat: {
    uniqueUsers: number;
    totalUserMessages: number;
    totalBotMessages: number;
    avgMessagesPerUser: number;
    dailyActivity: Record<string, number>;
  };
  webChat?: {
    uniqueUsers: number;
    totalMessages: number;
    avgMessagesPerUser: number;
    dailyActivity: Record<string, number>;
  };
  tiles?: {
    totalClicks: number;
    topTiles: { tile: string; count: number }[];
    dailyClicks?: Record<string, number>;
  };
  lifewheel?: {
    completions: number;
    avgScore: number;
    weakestAreas: { area: string; count: number }[];
  };
  sevenWhys?: { starts: number };
  perChurch?: Record<string, {
    churchName: string;
    planTier: string;
    isActive: boolean;
    pageviews: number;
    events: number;
    sessions: number;
    avgSessionDurationSec?: number;
    dailyPageviews: Record<string, number>;
    topEvents: { name: string; count: number }[];
    utmSources?: { source: string; count: number }[];
    utmMediums?: { medium: string; count: number }[];
  }>;
  utmSources?: { source: string; count: number }[];
  utmMediums?: { medium: string; count: number }[];
  hourlyDistribution?: { hour: number; count: number }[];
  weekdayDistribution?: { day: string; count: number }[];
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/** KPI card with optional info tooltip */
const StatCard = ({ icon: Icon, label, value, sub, tooltip, color = "text-primary" }: {
  icon: any; label: string; value: string | number; sub?: string; tooltip?: string; color?: string;
}) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-primary/10 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const formatDuration = (sec: number) => {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
};

const Analytics = () => {
  const [key, setKey] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = async (d?: number) => {
    const useDays = d ?? days;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-dashboard?key=${encodeURIComponent(key)}&days=${useDays}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) {
        if (response.status === 401) { setError("Falscher Schlüssel"); return; }
        throw new Error("Fehler beim Laden");
      }
      setData(await response.json());
      setAuthenticated(true);
    } catch (e: any) {
      setError(e.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin-Schlüssel"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
            <Button onClick={() => fetchData()} disabled={loading} className="w-full">
              {loading ? "Laden..." : "Anzeigen"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportCSV = () => {
    if (!data) return;
    const rows: string[][] = [["Kategorie", "Metrik", "Wert"]];
    rows.push(["Übersicht", "Seitenaufrufe", String(data.summary.totalPageviews)]);
    rows.push(["Übersicht", "Sessions", String(data.summary.uniqueSessions)]);
    rows.push(["Übersicht", "Events", String(data.summary.totalEvents)]);
    rows.push(["Übersicht", "Ø Verweildauer", formatDuration(data.summary.avgSessionDurationSec || 0)]);
    rows.push(["Chat", "Nutzer", String(data.chat?.uniqueUsers || 0)]);
    rows.push(["Chat", "User-Nachrichten", String(data.chat?.totalUserMessages || 0)]);
    rows.push(["Chat", "Bot-Antworten", String(data.chat?.totalBotMessages || 0)]);
    data.topPages?.forEach((p) => rows.push(["Top Seiten", p.path, String(p.count)]));
    data.topEvents?.forEach((e) => rows.push(["Top Events", e.name, String(e.count)]));
    data.utmSources?.forEach((s) => rows.push(["UTM Source", s.source, String(s.count)]));
    // Per church
    if (data.perChurch) {
      Object.entries(data.perChurch).forEach(([slug, c]) => {
        rows.push(["Gemeinde", `${c.churchName} (${slug})`, `PV:${c.pageviews} Sess:${c.sessions} Evt:${c.events}`]);
      });
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibelbot-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dailyData = Object.entries(data?.dailyPageviews || {}).map(([date, count]) => ({
    date: date.slice(5),
    Aufrufe: count,
  }));

  const deviceData = [
    { name: "Mobile", value: data?.devices.mobile || 0 },
    { name: "Tablet", value: data?.devices.tablet || 0 },
    { name: "Desktop", value: data?.devices.desktop || 0 },
  ].filter(d => d.value > 0);

  const chatDailyData = Object.entries(data?.chat?.dailyActivity || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), Nachrichten: count }));

  const webChatDailyData = Object.entries(data?.webChat?.dailyActivity || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), Nachrichten: count }));

  const subscriberData = Object.entries(data?.subscribers?.byChannel || {}).map(([channel, total]) => ({
    channel: channel.charAt(0).toUpperCase() + channel.slice(1),
    total,
    aktiv: data?.subscribers?.activeByChannel?.[channel] || 0,
  }));

  // Per-church sorted by pageviews
  const churchList = data?.perChurch
    ? Object.entries(data.perChurch)
        .sort(([, a], [, b]) => b.pageviews - a.pageviews)
    : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {[7, 14, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => { setDays(d); fetchData(d); }}
              >
                {d}T
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            icon={Eye}
            label="Seitenaufrufe"
            value={data?.summary.totalPageviews || 0}
            tooltip="Gesamtzahl aller geladenen Seiten im Zeitraum. Mehrfachaufrufe durch denselben Besucher zählen einzeln."
          />
          <StatCard
            icon={Users}
            label="Sessions"
            value={data?.summary.uniqueSessions || 0}
            tooltip="Anzahl eindeutiger Browser-Sitzungen. Ein Nutzer der die Seite schliesst und wieder öffnet zählt als neue Session."
          />
          <StatCard
            icon={Clock}
            label="Ø Verweildauer"
            value={formatDuration(data?.summary.avgSessionDurationSec || 0)}
            tooltip="Durchschnittliche Zeit, die ein Besucher auf der Seite verbringt. Wird per Heartbeat alle 30s gemessen — auch wenn nur eine Seite besucht wird."
          />
          <StatCard
            icon={ArrowDownRight}
            label="Absprungrate"
            value={`${data?.summary.bounceRate ?? 0}%`}
            tooltip="Anteil der Besucher, die nur eine einzige Seite ansehen und keine Interaktion ausführen (z.B. Chat, Kachel-Klick)."
          />
          <StatCard
            icon={MousePointer}
            label="Interaktionen"
            value={data?.summary.totalEvents || 0}
            tooltip="Gesamtzahl aller bewussten Nutzer-Aktionen: Kachel-Klicks, Chat-Nachrichten, Quiz-Starts, Lebensrad-Abschlüsse etc."
          />
          <StatCard
            icon={MessageCircle}
            label="Chat-Nutzer (Telegram)"
            value={data?.chat?.uniqueUsers || 0}
            sub={`∅ ${data?.chat?.avgMessagesPerUser || 0} Nachr./Person`}
            tooltip="Eindeutige Telegram-Nutzer, die dem Bot geschrieben haben. 'Nachr./Person' = durchschnittliche Anzahl gesendeter Nachrichten pro Nutzer."
          />
          <StatCard
            icon={Globe}
            label="Chat-Nutzer (Web)"
            value={data?.webChat?.uniqueUsers || 0}
            sub={`∅ ${data?.webChat?.avgMessagesPerUser || 0} Nachr./Person`}
            tooltip="Eindeutige Web-Besucher, die den Chat auf der Webseite genutzt haben (pro Browser-Session gezählt)."
          />
        </div>

        {/* Daily pageviews chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tägliche Seitenaufrufe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="Aufrufe" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ════ NEW: Hourly + Weekday Distribution ════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Tageszeiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.hourlyDistribution || []}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} className="fill-muted-foreground" interval={2}
                      tickFormatter={(h) => `${h}h`} />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [v, "Events"]}
                      labelFormatter={(h) => `${h}:00 – ${h}:59`} />
                    <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Wochentage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.weekdayDistribution || []}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [v, "Events"]} />
                    <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ════ NEW: UTM Sources & Mediums ════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Traffic-Quellen (UTM Source)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.utmSources?.map((s) => {
                  const max = data.utmSources?.[0]?.count || 1;
                  return (
                    <div key={s.source} className="space-y-0.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground text-xs truncate">{s.source}</span>
                        <span className="text-muted-foreground text-xs ml-2">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(s.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data?.utmSources?.length && <p className="text-sm text-muted-foreground">Keine UTM-Quellen erfasst</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                UTM Medium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.utmMediums?.map((m) => {
                  const max = data.utmMediums?.[0]?.count || 1;
                  return (
                    <div key={m.medium} className="space-y-0.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground text-xs truncate">{m.medium}</span>
                        <span className="text-muted-foreground text-xs ml-2">{m.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-chart-2 rounded-full" style={{ width: `${(m.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data?.utmMediums?.length && <p className="text-sm text-muted-foreground">Keine UTM-Medien erfasst</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ════ NEW: Per-Church Breakdown ════ */}
        {churchList.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Nutzung pro Gemeinde
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gemeinde</TableHead>
                    <TableHead className="text-right">Seitenaufrufe</TableHead>
                    <TableHead className="text-right">Besucher</TableHead>
                    <TableHead className="text-right">Ø Verweildauer</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="hidden md:table-cell">Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churchList.map(([slug, c]) => (
                    <TableRow key={slug}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {!c.isActive && <span className="h-2 w-2 rounded-full bg-destructive" />}
                          {c.churchName}
                          <span className="text-xs text-muted-foreground">({slug})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.pageviews}</TableCell>
                      <TableCell className="text-right font-mono">{c.sessions}</TableCell>
                      <TableCell className="text-right font-mono">{formatDuration(c.avgSessionDurationSec || 0)}</TableCell>
                      <TableCell className="text-right font-mono">{c.events}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{c.planTier}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Telegram Chat activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Telegram-Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.chat?.uniqueUsers || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Nutzer</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.chat?.totalUserMessages || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Nachrichten</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.chat?.totalBotMessages || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Antworten</p>
                </div>
              </div>
              {chatDailyData.length > 0 && (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chatDailyData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="Nachrichten" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {chatDailyData.length === 0 && <p className="text-sm text-muted-foreground">Keine Telegram-Daten</p>}
            </CardContent>
          </Card>

          {/* Web Chat activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Web-Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.webChat?.uniqueUsers || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Nutzer</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.webChat?.totalMessages || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Nachrichten</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{data?.webChat?.avgMessagesPerUser || 0}</p>
                  <p className="text-[10px] text-muted-foreground">∅/Nutzer</p>
                </div>
              </div>
              {webChatDailyData.length > 0 && (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={webChatDailyData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="Nachrichten" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {webChatDailyData.length === 0 && <p className="text-sm text-muted-foreground">Keine Web-Chat-Daten</p>}
            </CardContent>
          </Card>

          {/* Devices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Geräte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <div className="h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 21-Tage Journey */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              21-Tage-Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">{data?.journey?.starts || 0}</p>
                <p className="text-[10px] text-muted-foreground">Gestartet</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">{data?.journey?.completes || 0}</p>
                <p className="text-[10px] text-muted-foreground">Abgeschlossen</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">
                  {data?.journey?.starts ? `${Math.round((data.journey.completes / data.journey.starts) * 100)}%` : "–"}
                </p>
                <p className="text-[10px] text-muted-foreground">Abschlussrate</p>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.journey?.progressChart || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [value, "Interaktionen"]}
                  />
                  <Bar dataKey="interactions" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Kachel-Klicks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Kachel-Klicks pro Tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const tileDaily = Object.entries(data?.tiles?.dailyClicks || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => ({ date: date.slice(5), Klicks: count }));
              return tileDaily.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tileDaily}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="Klicks" fill="hsl(var(--chart-4) / 0.2)" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten</p>
              );
            })()}
          </CardContent>
        </Card>

        {/* Kacheln & Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Kachel-Klicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground mb-3">{data?.tiles?.totalClicks || 0}</p>
              <div className="space-y-1.5">
                {data?.tiles?.topTiles?.slice(0, 8).map((t) => {
                  const max = data?.tiles?.topTiles?.[0]?.count || 1;
                  return (
                    <div key={t.tile} className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-foreground">{t.tile}</span>
                        <span className="text-xs text-muted-foreground">{t.count}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data?.tiles?.topTiles?.length && <p className="text-xs text-muted-foreground">Keine Klicks</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-primary" />
                Lebensrad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-foreground">{data?.lifewheel?.completions || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Abschlüsse</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-foreground">{data?.lifewheel?.avgScore || "–"}</p>
                  <p className="text-[10px] text-muted-foreground">Ø Score</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">Schwächste Bereiche:</p>
              <div className="space-y-1.5">
                {data?.lifewheel?.weakestAreas?.slice(0, 5).map((w) => (
                  <div key={w.area} className="flex justify-between items-center text-xs">
                    <span className="text-foreground">{w.area}</span>
                    <span className="text-muted-foreground">{w.count}×</span>
                  </div>
                ))}
                {!data?.lifewheel?.weakestAreas?.length && <p className="text-xs text-muted-foreground">Keine Daten</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                7 Warums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-3xl font-bold text-foreground">{data?.sevenWhys?.starts || 0}</p>
                <p className="text-xs text-muted-foreground">Gestartet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Abonnenten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">{data?.subscribers?.total || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">{data?.subscribers?.active || 0}</p>
                <p className="text-[10px] text-muted-foreground">Aktiv</p>
              </div>
            </div>
            {subscriberData.length > 0 ? (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscriberData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                    <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={70} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Total" />
                    <Bar dataKey="aktiv" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} name="Aktiv" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Abonnenten</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Seiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topPages.map((p) => {
                  const max = data.topPages[0]?.count || 1;
                  return (
                    <div key={p.path} className="space-y-0.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground font-mono text-xs truncate">{p.path}</span>
                        <span className="text-muted-foreground text-xs ml-2">{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(p.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data?.topPages.length && <p className="text-sm text-muted-foreground">Keine Daten</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topEvents.map((e) => {
                  const max = data.topEvents[0]?.count || 1;
                  return (
                    <div key={e.name} className="space-y-0.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground text-xs">{e.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{e.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-chart-2 rounded-full" style={{ width: `${(e.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data?.topEvents.length && <p className="text-sm text-muted-foreground">Keine Events</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Referrer-Quellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.topReferrers?.map((r) => {
                const max = data.topReferrers?.[0]?.count || 1;
                return (
                  <div key={r.source} className="space-y-0.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground text-xs truncate">{r.source}</span>
                      <span className="text-muted-foreground text-xs ml-2">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-chart-3 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {!data?.topReferrers?.length && <p className="text-sm text-muted-foreground">Keine Referrer-Daten</p>}
            </div>
          </CardContent>
        </Card>

        {/* Referrer Trend */}
        {(data?.referrerTrend?.length ?? 0) > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Referrer-Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.referrerTrend?.map((d) => ({ ...d, date: String(d.date).slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    {data?.referrerTrendKeys?.map((key, i) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stackId="1"
                        fill={COLORS[i % COLORS.length]}
                        stroke={COLORS[i % COLORS.length]}
                        fillOpacity={0.4}
                        strokeWidth={1.5}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {data?.referrerTrendKeys?.map((key, i) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {key}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Flows */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.topFlows.map((f, i) => (
                <div key={i} className="flex justify-between items-center text-sm gap-4">
                  <span className="text-foreground font-mono text-xs truncate flex-1">{f.flow}</span>
                  <span className="text-muted-foreground whitespace-nowrap text-xs">{f.count}×</span>
                </div>
              ))}
              {!data?.topFlows.length && <p className="text-sm text-muted-foreground">Keine Flows</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

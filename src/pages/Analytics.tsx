import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3, Eye, MousePointer, Users, Smartphone, Monitor, Tablet,
  MessageCircle, Flame, Trophy, Bell, TrendingUp, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";

type AnalyticsData = {
  period: { days: number; since: string };
  summary: { totalPageviews: number; totalEvents: number; uniqueSessions: number };
  topPages: { path: string; count: number }[];
  topEvents: { name: string; count: number }[];
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
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const StatCard = ({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-primary/10 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

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

  // Prepare chart data
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

  const subscriberData = Object.entries(data?.subscribers?.byChannel || {}).map(([channel, total]) => ({
    channel: channel.charAt(0).toUpperCase() + channel.slice(1),
    total,
    aktiv: data?.subscribers?.activeByChannel?.[channel] || 0,
  }));

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
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Eye} label="Seitenaufrufe" value={data?.summary.totalPageviews || 0} />
          <StatCard icon={Users} label="Sessions" value={data?.summary.uniqueSessions || 0} />
          <StatCard icon={MousePointer} label="Events" value={data?.summary.totalEvents || 0} />
          <StatCard icon={MessageCircle} label="Chat-Nutzer" value={data?.chat?.uniqueUsers || 0} sub={`∅ ${data?.chat?.avgMessagesPerUser || 0} Nachr./Person`} />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chat activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Chat-Aktivität
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{data?.chat?.totalUserMessages || 0}</p>
                  <p className="text-[10px] text-muted-foreground">User-Nachrichten</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{data?.chat?.totalBotMessages || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Bot-Antworten</p>
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
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" label={{ value: "Tag", position: "insideBottom", offset: -2, fontSize: 10 }} />
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

        {/* Subscribers */}
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
          {/* Top Pages */}
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

          {/* Top Events */}
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

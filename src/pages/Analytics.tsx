import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, MousePointer, Users, Smartphone, Monitor, Tablet, ArrowRight } from "lucide-react";

type AnalyticsData = {
  period: { days: number; since: string };
  summary: { totalPageviews: number; totalEvents: number; uniqueSessions: number };
  topPages: { path: string; count: number }[];
  topEvents: { name: string; count: number }[];
  devices: { mobile: number; tablet: number; desktop: number };
  dailyPageviews: Record<string, number>;
  topFlows: { flow: string; count: number }[];
};

const Analytics = () => {
  const [key, setKey] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-dashboard?key=${encodeURIComponent(key)}&days=${days}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Falscher Schlüssel");
          return;
        }
        throw new Error("Fehler beim Laden");
      }

      const json = await response.json();
      setData(json);
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
            <Button onClick={fetchData} disabled={loading} className="w-full">
              {loading ? "Laden..." : "Anzeigen"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxDaily = Math.max(...Object.values(data?.dailyPageviews || { x: 1 }), 1);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => { setDays(d); setTimeout(fetchData, 0); }}
              >
                {d}T
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data?.summary.totalPageviews}</p>
                  <p className="text-sm text-muted-foreground">Seitenaufrufe</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{data?.summary.uniqueSessions}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MousePointer className="h-8 w-8 text-accent-foreground" />
                <div>
                  <p className="text-2xl font-bold">{data?.summary.totalEvents}</p>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tägliche Seitenaufrufe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {Object.entries(data?.dailyPageviews || {}).map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{count}</span>
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${(count / maxDaily) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-muted-foreground">{day.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Seiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topPages.map((p) => (
                  <div key={p.path} className="flex justify-between items-center text-sm">
                    <span className="text-foreground font-mono">{p.path}</span>
                    <span className="text-muted-foreground">{p.count}</span>
                  </div>
                ))}
                {!data?.topPages.length && <p className="text-sm text-muted-foreground">Keine Daten</p>}
              </div>
            </CardContent>
          </Card>

          {/* Top Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topEvents.map((e) => (
                  <div key={e.name} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{e.name}</span>
                    <span className="text-muted-foreground">{e.count}</span>
                  </div>
                ))}
                {!data?.topEvents.length && <p className="text-sm text-muted-foreground">Keine Events</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geräte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              {[
                { icon: Smartphone, label: "Mobile", count: data?.devices.mobile || 0 },
                { icon: Tablet, label: "Tablet", count: data?.devices.tablet || 0 },
                { icon: Monitor, label: "Desktop", count: data?.devices.desktop || 0 },
              ].map(({ icon: Icon, label, count }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}:</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Flows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.topFlows.map((f, i) => (
                <div key={i} className="flex justify-between items-center text-sm gap-4">
                  <span className="text-foreground font-mono text-xs truncate flex-1">{f.flow}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{f.count}×</span>
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

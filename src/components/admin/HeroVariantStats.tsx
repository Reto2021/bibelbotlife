import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

type Row = { variant: string; views: number; clicks: number; ctr: number };

export function HeroVariantStats() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
        const { data, error } = await (supabase as any)
          .from("analytics_events")
          .select("event_name, event_data")
          .in("event_name", ["hero_variant_view", "hero_variant_cta_click"])
          .gte("created_at", since)
          .limit(20000);
        if (error) throw error;

        const agg: Record<string, { views: number; clicks: number }> = {};
        for (const r of (data ?? []) as any[]) {
          const v = (r.event_data?.variant as string) || "unknown";
          if (!agg[v]) agg[v] = { views: 0, clicks: 0 };
          if (r.event_name === "hero_variant_view") agg[v].views++;
          else agg[v].clicks++;
        }
        const out: Row[] = Object.entries(agg)
          .map(([variant, v]) => ({
            variant,
            views: v.views,
            clicks: v.clicks,
            ctr: v.views ? (v.clicks / v.views) * 100 : 0,
          }))
          .sort((a, b) => b.ctr - a.ctr);
        setRows(out);
      } catch (e: any) {
        setError(e.message ?? "Fehler");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const best = rows[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Hero A/B-Test (30 Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Lade…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !rows.length && (
          <p className="text-sm text-muted-foreground">Noch keine Daten.</p>
        )}
        {!!rows.length && (
          <>
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.variant}
                  className={`flex items-center justify-between gap-3 rounded-md border p-2 text-sm ${
                    r.variant === best?.variant ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <span className="font-mono text-xs">{r.variant}</span>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{r.views} Views</span>
                    <span>{r.clicks} Clicks</span>
                    <span className="font-semibold text-foreground">
                      {r.ctr.toFixed(1)}% CTR
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {best && best.views > 30 && (
              <p className="text-xs text-muted-foreground mt-3">
                Gewinner-Kandidat: <span className="font-medium text-foreground">{best.variant}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

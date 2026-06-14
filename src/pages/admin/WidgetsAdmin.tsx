import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Globe } from "lucide-react";

type Row = { host: string; opens: number; lastSeen: string };

export default function WidgetsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [totalOpens, setTotalOpens] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_data, created_at")
        .eq("event_type", "widget")
        .eq("event_name", "widget_open")
        .gte("created_at", since)
        .limit(10000);

      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }

      const map = new Map<string, Row>();
      for (const ev of data) {
        const host = ((ev.event_data as any)?.host || "unbekannt") as string;
        const cur = map.get(host) || { host, opens: 0, lastSeen: ev.created_at };
        cur.opens++;
        if (ev.created_at > cur.lastSeen) cur.lastSeen = ev.created_at;
        map.set(host, cur);
      }
      const sorted = Array.from(map.values()).sort((a, b) => b.opens - a.opens);
      setRows(sorted);
      setTotalOpens(data.length);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Zurück</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" /> Widget — Top Hosts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wo wurde das Embed-Widget geöffnet?
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Tage</SelectItem>
            <SelectItem value="30">30 Tage</SelectItem>
            <SelectItem value="90">90 Tage</SelectItem>
            <SelectItem value="365">1 Jahr</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Widget Opens</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalOpens}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Hosts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{rows.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Hosts</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Lade…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch keine Widget-Events. Sobald Partner das Embed einsetzen, erscheinen sie hier.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead className="text-right">Opens</TableHead>
                  <TableHead>Zuletzt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.host}>
                    <TableCell className="font-mono text-sm">{r.host}</TableCell>
                    <TableCell className="text-right font-semibold">{r.opens}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.lastSeen).toLocaleString("de-CH")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

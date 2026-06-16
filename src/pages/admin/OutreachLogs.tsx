import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type OutreachEmailRow = {
  id: string;
  lead_id: string | null;
  sequence_step: number | null;
  subject: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  resend_id: string | null;
  created_at: string;
  error_message: string | null;
  outreach_leads?: { email: string | null; church_name: string | null } | null;
};

const STATUSES = [
  "all",
  "pending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed_system",
  "failed",
  "suppressed",
] as const;

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (["sent", "delivered", "opened", "clicked"].includes(s)) return "default";
  if (["bounced", "failed", "failed_system"].includes(s)) return "destructive";
  if (s === "suppressed") return "outline";
  return "secondary";
};

export default function OutreachLogs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["outreach-logs", statusFilter, limit],
    queryFn: async () => {
      let q = supabase
        .from("outreach_emails")
        .select(
          "id, lead_id, sequence_step, subject, status, sent_at, opened_at, clicked_at, resend_id, created_at, error_message, outreach_leads(email, church_name)"
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as OutreachEmailRow[];
    },
    refetchInterval: 15000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data ?? [];
    const s = search.toLowerCase();
    return (data ?? []).filter(
      (r) =>
        r.outreach_leads?.email?.toLowerCase().includes(s) ||
        r.outreach_leads?.church_name?.toLowerCase().includes(s) ||
        r.subject?.toLowerCase().includes(s) ||
        r.error_message?.toLowerCase().includes(s) ||
        r.resend_id?.toLowerCase().includes(s)
    );
  }, [data, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data ?? []).forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [data]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/outreach/status">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Outreach Debug-Logs</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Status-Zähler */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(counts).map(([s, n]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`p-3 rounded-lg border text-left transition hover:bg-muted ${
              statusFilter === s ? "border-primary bg-muted" : ""
            }`}
          >
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-xl font-bold">{n}</div>
          </button>
        ))}
      </div>

      {/* Filter */}
      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Email, Kirche, Subject, Fehler, Resend-ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[50, 100, 250, 500].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} Zeilen
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Log-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? "Lade…" : `${filtered.length} Einträge`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Zeit</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Empfänger</th>
                <th className="py-2 pr-3">Step</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Resend ID</th>
                <th className="py-2 pr-3">Fehler / Notiz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b align-top hover:bg-muted/40">
                  <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.sent_at || r.created_at), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="font-medium">
                      {r.outreach_leads?.email ?? "—"}
                    </div>
                    {r.outreach_leads?.church_name && (
                      <div className="text-xs text-muted-foreground">
                        {r.outreach_leads.church_name}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">{r.sequence_step ?? "—"}</td>
                  <td className="py-2 pr-3 max-w-[280px] truncate">
                    {r.subject ?? "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {r.resend_id ? r.resend_id.slice(0, 12) + "…" : "—"}
                  </td>
                  <td className="py-2 pr-3 max-w-[320px]">
                    {r.error_message ? (
                      <span className="text-destructive text-xs whitespace-pre-wrap">
                        {r.error_message}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.opened_at && "geöffnet · "}
                        {r.clicked_at && "geklickt"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Keine Einträge gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Send, AlertTriangle, CheckCircle2, Clock, XCircle, Mail,
  Activity, ArrowLeft, RefreshCw, Calendar, Server, Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const REFRESH_MS = 30_000;

type StatusCount = { status: string; count: number };

function useOutreachStatus() {
  return useQuery({
    queryKey: ["outreach-status-dashboard"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

      const [emailsAll, emails24h, emails7d, campaigns, schedules, leads, recent] = await Promise.all([
        supabase.from("outreach_emails").select("status"),
        supabase.from("outreach_emails").select("status").gte("created_at", since24h),
        supabase.from("outreach_emails").select("status,sent_at").gte("created_at", since7d),
        supabase.from("outreach_campaigns").select("id,name,status,sender_email,max_emails_per_day,send_start_hour,send_end_hour"),
        supabase.from("pipeline_schedules").select("*"),
        supabase.from("outreach_leads").select("status"),
        supabase
          .from("outreach_emails")
          .select("id,lead_id,sequence_step,status,sent_at,error_message,created_at,resend_id")
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

      const tally = (rows: { status: string }[] | null): Record<string, number> => {
        const out: Record<string, number> = {};
        for (const r of rows ?? []) out[r.status] = (out[r.status] ?? 0) + 1;
        return out;
      };

      return {
        emailsTotal: tally(emailsAll.data),
        emails24h: tally(emails24h.data),
        emails7d: emails7d.data ?? [],
        campaigns: campaigns.data ?? [],
        schedules: schedules.data ?? [],
        leads: tally(leads.data),
        recent: recent.data ?? [],
        fetchedAt: new Date(),
      };
    },
  });
}

const statusMeta: Record<string, { label: string; cls: string; icon: any }> = {
  sent: { label: "Gesendet", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200", icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200", icon: Clock },
  bounced: { label: "Bounced (echt)", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200", icon: Inbox },
  failed_system: { label: "Systemfehler", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", icon: Server },
  failed: { label: "Fehler", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", icon: XCircle },
  opened: { label: "Geöffnet", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200", icon: Mail },
  clicked: { label: "Geklickt", cls: "bg-primary/20 text-primary", icon: Activity },
  complained: { label: "Beschwerde", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", icon: AlertTriangle },
  unsubscribed: { label: "Abgemeldet", cls: "bg-muted text-muted-foreground", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const m = statusMeta[status] ?? { label: status, cls: "bg-muted text-muted-foreground", icon: Activity };
  const Icon = m.icon;
  return (
    <Badge variant="secondary" className={m.cls}>
      <Icon className="h-3 w-3 mr-1" />
      {m.label}
    </Badge>
  );
}

export default function OutreachStatusDashboard() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useOutreachStatus();

  const alerts: { level: "error" | "warn" | "info"; title: string; msg: string }[] = [];

  if (data) {
    const systemFails24h = data.emails24h["failed_system"] ?? 0;
    const bounces24h = data.emails24h["bounced"] ?? 0;
    const sent24h = data.emails24h["sent"] ?? 0;
    const pending24h = data.emails24h["pending"] ?? 0;

    if (systemFails24h > 0) {
      alerts.push({
        level: "error",
        title: `${systemFails24h} Systemfehler in den letzten 24h`,
        msg: "Resend-Connector oder Edge-Function-Probleme. Outreach pausiert sich automatisch beim ersten Systemfehler.",
      });
    }
    const bounceRate = sent24h + bounces24h > 0 ? bounces24h / (sent24h + bounces24h) : 0;
    if (bounceRate > 0.05 && bounces24h >= 3) {
      alerts.push({
        level: "warn",
        title: `Bounce-Rate ${(bounceRate * 100).toFixed(1)}% (24h)`,
        msg: "Über 5% — Listenqualität prüfen, sonst Domain-Reputation in Gefahr.",
      });
    }
    if (pending24h > 50) {
      alerts.push({
        level: "warn",
        title: `${pending24h} Mails hängen in Pending`,
        msg: "Cron läuft eventuell nicht oder Rate-Limit erreicht.",
      });
    }
    const activeCampaigns = data.campaigns.filter((c: any) => c.status === "active").length;
    const activeSchedules = data.schedules.filter((s: any) => s.is_active).length;
    if (activeCampaigns === 0) {
      alerts.push({ level: "info", title: "Keine aktive Kampagne", msg: "Alle Kampagnen pausiert." });
    }
    if (activeSchedules === 0) {
      alerts.push({ level: "info", title: "Pipeline-Cron inaktiv", msg: "Keine geplanten Discover/Pipeline-Läufe aktiv." });
    }
    if (alerts.length === 0) {
      alerts.push({ level: "info", title: "Alles im grünen Bereich", msg: "Keine kritischen Warnungen." });
    }
  }

  const stats = [
    { label: "Gesendet (24h)", value: data?.emails24h["sent"] ?? 0, icon: Send, color: "text-green-600" },
    { label: "Pending (24h)", value: data?.emails24h["pending"] ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Bounces (24h)", value: data?.emails24h["bounced"] ?? 0, icon: Inbox, color: "text-orange-600" },
    { label: "Systemfehler (24h)", value: data?.emails24h["failed_system"] ?? 0, icon: Server, color: "text-red-600" },
    { label: "Geöffnet (24h)", value: data?.emails24h["opened"] ?? 0, icon: Mail, color: "text-blue-600" },
    { label: "Geklickt (24h)", value: data?.emails24h["clicked"] ?? 0, icon: Activity, color: "text-primary" },
  ];

  const totalAll = Object.values(data?.emailsTotal ?? {}).reduce((a, b) => a + b, 0);
  const sentAll = data?.emailsTotal["sent"] ?? 0;
  const bouncedAll = data?.emailsTotal["bounced"] ?? 0;
  const failedSysAll = data?.emailsTotal["failed_system"] ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link to="/admin/outreach"><ArrowLeft className="h-4 w-4 mr-2" />Zurück zu Outreach</Link>
            </Button>
            <h1 className="text-3xl font-bold">Outreach-Status</h1>
            <p className="text-sm text-muted-foreground">
              Echtzeit-Übersicht · Auto-Refresh alle 30s
              {dataUpdatedAt && ` · zuletzt ${formatDistanceToNow(new Date(dataUpdatedAt), { locale: de, addSuffix: true })}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Alert
              key={i}
              variant={a.level === "error" ? "destructive" : "default"}
              className={
                a.level === "warn"
                  ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                  : a.level === "info" && alerts.length === 1
                  ? "border-green-500/50 bg-green-50 dark:bg-green-950/20"
                  : ""
              }
            >
              {a.level === "error" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : a.level === "warn" ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <AlertTitle>{a.title}</AlertTitle>
              <AlertDescription>{a.msg}</AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "…" : s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lifetime + Campaigns */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gesamt (lifetime)</CardTitle>
              <CardDescription>{totalAll.toLocaleString("de-CH")} E-Mail-Datensätze insgesamt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Gesendet</span><span className="font-mono">{sentAll}</span></div>
              <div className="flex justify-between"><span>Echte Bounces</span><span className="font-mono">{bouncedAll}</span></div>
              <div className="flex justify-between"><span>Systemfehler</span><span className="font-mono">{failedSysAll}</span></div>
              <div className="flex justify-between text-muted-foreground border-t pt-2">
                <span>Bounce-Rate (lifetime)</span>
                <span className="font-mono">
                  {sentAll + bouncedAll > 0 ? ((bouncedAll / (sentAll + bouncedAll)) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Zeitplan & Kampagnen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Kampagnen</p>
                {data?.campaigns.length === 0 && <p className="text-sm text-muted-foreground">Keine</p>}
                {data?.campaigns.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {c.send_start_hour}–{c.send_end_hour}h · max {c.max_emails_per_day}/Tag
                      </span>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pipeline-Schedules</p>
                {data?.schedules.length === 0 && <p className="text-sm text-muted-foreground">Keine</p>}
                {data?.schedules.map((s: any) => (
                  <div key={s.id} className="text-sm py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{s.cron_expression}</span>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "aktiv" : "pausiert"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.search_query} · {s.country} · max {s.max_results}
                      {s.last_run_at && ` · letzter Lauf ${formatDistanceToNow(new Date(s.last_run_at), { locale: de, addSuffix: true })}`}
                      {s.last_run_status && ` (${s.last_run_status})`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.leads ?? {}).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-sm">
                  {status}: <span className="ml-1 font-mono">{count}</span>
                </Badge>
              ))}
              {(!data || Object.keys(data.leads).length === 0) && (
                <span className="text-sm text-muted-foreground">Keine Leads</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte 25 E-Mail-Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resend-ID</TableHead>
                  <TableHead>Fehler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recent ?? []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(e.sent_at ?? e.created_at), { locale: de, addSuffix: true })}
                    </TableCell>
                    <TableCell>{e.sequence_step}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                      {e.resend_id ?? "–"}
                    </TableCell>
                    <TableCell className="text-xs text-destructive truncate max-w-[300px]">
                      {e.error_message ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data || data.recent.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Keine Events
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type TrackingEvent = {
  id: string;
  message_id: string | null;
  resend_email_id: string | null;
  event_type: string;
  recipient_email: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

type SendLog = {
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  created_at: string;
};

const EVENT_COLORS: Record<string, string> = {
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  opened: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  clicked: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  bounced: "bg-red-500/15 text-red-700 dark:text-red-300",
  complained: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  unsubscribed: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

export default function EmailReporting() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [sends, setSends] = useState<SendLog[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [eventsRes, sendsRes] = await Promise.all([
        supabase
          .from("email_tracking_events")
          .select("*")
          .gte("occurred_at", since)
          .order("occurred_at", { ascending: false })
          .limit(500),
        supabase
          .from("email_send_log")
          .select("message_id, template_name, recipient_email, status, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data as TrackingEvent[]);
      if (sendsRes.data) setSends(sendsRes.data as SendLog[]);
      setLoading(false);
    })();
  }, []);

  // Dedupe sent emails by message_id (latest status)
  const sentByMsg = new Map<string, SendLog>();
  for (const s of sends) {
    if (!s.message_id) continue;
    if (!sentByMsg.has(s.message_id)) sentByMsg.set(s.message_id, s);
  }
  const sentCount = Array.from(sentByMsg.values()).filter((s) => s.status === "sent").length;

  // Aggregate events by type, dedupe per (resend_email_id|message_id, type)
  const uniqByType = new Map<string, Set<string>>();
  for (const e of events) {
    const key = e.resend_email_id ?? e.message_id ?? e.id;
    if (!uniqByType.has(e.event_type)) uniqByType.set(e.event_type, new Set());
    uniqByType.get(e.event_type)!.add(key);
  }
  const count = (t: string) => uniqByType.get(t)?.size ?? 0;
  const delivered = count("delivered");
  const opened = count("opened");
  const clicked = count("clicked");
  const bounced = count("bounced");
  const complained = count("complained");

  const denom = delivered || sentCount || 1;
  const openRate = ((opened / denom) * 100).toFixed(1);
  const clickRate = ((clicked / denom) * 100).toFixed(1);
  const bounceRate = ((bounced / denom) * 100).toFixed(1);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Helmet>
        <title>E-Mail-Reporting — Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <h1 className="mb-2 text-3xl font-bold">E-Mail-Reporting</h1>
      <p className="mb-6 text-muted-foreground">
        Versand-, Öffnungs- und Klick-Statistik der letzten 30 Tage (via Resend-Webhook).
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <Stat label="Versendet" value={sentCount} />
            <Stat label="Zugestellt" value={delivered} />
            <Stat label="Geöffnet" value={opened} sub={`${openRate}%`} accent="blue" />
            <Stat label="Geklickt" value={clicked} sub={`${clickRate}%`} accent="violet" />
            <Stat label="Bounces" value={bounced} sub={`${bounceRate}%`} accent="red" />
            <Stat label="Beschwerden" value={complained} accent="orange" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Letzte Tracking-Ereignisse</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Noch keine Ereignisse erfasst. Sobald der Resend-Webhook eingerichtet ist,
                  erscheinen hier Opens, Klicks, Bounces &amp; Co.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zeit</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Empfänger</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.slice(0, 100).map((e) => {
                        const click = (e.metadata as any)?.click;
                        const subject = (e.metadata as any)?.subject;
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {new Date(e.occurred_at).toLocaleString("de-CH")}
                            </TableCell>
                            <TableCell>
                              <Badge className={EVENT_COLORS[e.event_type] ?? "bg-muted"}>
                                {e.event_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate text-sm">
                              {e.recipient_email ?? "—"}
                            </TableCell>
                            <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                              {click?.link ? (
                                <a
                                  href={click.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                >
                                  {click.link}
                                </a>
                              ) : (
                                subject ?? ""
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "blue" | "violet" | "red" | "orange";
}) {
  const accentClass =
    accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "violet"
      ? "text-violet-600 dark:text-violet-400"
      : accent === "red"
      ? "text-red-600 dark:text-red-400"
      : accent === "orange"
      ? "text-orange-600 dark:text-orange-400"
      : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${accentClass}`}>{value.toLocaleString("de-CH")}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

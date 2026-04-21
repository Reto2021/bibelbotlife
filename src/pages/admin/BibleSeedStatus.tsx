import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const REFRESH_MS = 30_000;

type StatusResponse = {
  generated_at: string;
  filter: string | null;
  totals: {
    ok: number;
    failed: number;
    pending: number;
    due_retries: number;
    scheduled: number;
    stored_verses: number;
    stored_chapters: number;
    tracked_chapters: number;
  };
  last_attempt: null | {
    translation: string;
    book_number: number;
    chapter: number;
    status: string;
    attempts: number;
    fetched_at: string;
    next_retry_at: string | null;
    last_error_code: string | null;
    source_url: string | null;
  };
  last_stored: null | {
    translation: string;
    book: string;
    book_number: number;
    chapter: number;
    verse: number;
    stored_at: string;
  };
  translations: Array<{
    translation: string;
    ok: number;
    failed: number;
    pending: number;
    due_retries: number;
    scheduled: number;
    last_attempt_at: string | null;
    last_error_code: string | null;
    last_error_message: string | null;
    stored_verses: number;
    stored_chapters: number;
  }>;
};

const fmtTime = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-CH", { dateStyle: "short", timeStyle: "medium" });
};

export default function BibleSeedStatus() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [translationFilter, setTranslationFilter] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [secondsSince, setSecondsSince] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = translationFilter.trim() ? `?translation=${encodeURIComponent(translationFilter.trim())}` : "";
      const { data: result, error: fnErr } = await supabase.functions.invoke(
        `bible-extra-seed-status${params}`,
        { method: "GET" }
      );
      if (fnErr) throw fnErr;
      setData(result as StatusResponse);
      setLastFetched(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [translationFilter]);

  // Initial load + on filter change
  useEffect(() => { load(); }, [load]);

  // Auto-Refresh alle 30 Sekunden
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { load(); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  // "Vor X Sekunden"-Anzeige tickt jede Sekunde
  useEffect(() => {
    if (!lastFetched) return;
    setSecondsSince(0);
    const id = setInterval(() => {
      setSecondsSince(Math.floor((Date.now() - lastFetched.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastFetched]);

  const totals = data?.totals;
  const progress = useMemo(() => {
    if (!totals || totals.tracked_chapters === 0) return 0;
    return Math.round((totals.ok / totals.tracked_chapters) * 100);
  }, [totals]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Bibel-Seed Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Live-Fortschritt des Übersetzungs-Seedings.
            {lastFetched && (
              <span className="ml-2 text-xs">
                Aktualisiert vor {secondsSince}s · {fmtTime(lastFetched.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto" className="text-sm cursor-pointer">
              Auto-Refresh (30s)
            </Label>
          </div>
          <Button onClick={load} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Jetzt aktualisieren
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter">Übersetzungs-Filter (optional)</Label>
            <Input
              id="filter"
              placeholder="z. B. EU, LUT, SCH"
              value={translationFilter}
              onChange={(e) => setTranslationFilter(e.target.value.toUpperCase())}
            />
          </div>
          <Button variant="secondary" onClick={() => setTranslationFilter("")} disabled={!translationFilter}>
            Filter zurücksetzen
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {totals && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Erfolgreich
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totals.ok}</div>
                <div className="text-xs text-muted-foreground">{progress}% von {totals.tracked_chapters}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Wartend / Geplant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totals.pending + totals.scheduled}</div>
                <div className="text-xs text-muted-foreground">{totals.due_retries} fällig zum Retry</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Fehlgeschlagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totals.failed}</div>
                <div className="text-xs text-muted-foreground">nach Max-Versuchen</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gespeichert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totals.stored_chapters}</div>
                <div className="text-xs text-muted-foreground">{totals.stored_verses.toLocaleString("de-CH")} Verse</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zuletzt gesucht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data?.last_attempt ? (
                  <>
                    <div><span className="text-muted-foreground">Übersetzung:</span> <Badge variant="outline">{data.last_attempt.translation}</Badge></div>
                    <div><span className="text-muted-foreground">Buch/Kapitel:</span> {data.last_attempt.book_number} / {data.last_attempt.chapter}</div>
                    <div><span className="text-muted-foreground">Status:</span> <Badge variant={data.last_attempt.status === "ok" ? "default" : "destructive"}>{data.last_attempt.status}</Badge></div>
                    <div><span className="text-muted-foreground">Versuche:</span> {data.last_attempt.attempts}</div>
                    <div><span className="text-muted-foreground">Zeitpunkt:</span> {fmtTime(data.last_attempt.fetched_at)}</div>
                    {data.last_attempt.next_retry_at && (
                      <div><span className="text-muted-foreground">Nächster Retry:</span> {fmtTime(data.last_attempt.next_retry_at)}</div>
                    )}
                    {data.last_attempt.last_error_code && (
                      <div><span className="text-muted-foreground">Fehler-Code:</span> <code>{data.last_attempt.last_error_code}</code></div>
                    )}
                  </>
                ) : <div className="text-muted-foreground">Keine Daten.</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zuletzt gespeichertes Kapitel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data?.last_stored ? (
                  <>
                    <div><span className="text-muted-foreground">Übersetzung:</span> <Badge variant="outline">{data.last_stored.translation}</Badge></div>
                    <div><span className="text-muted-foreground">Buch:</span> {data.last_stored.book} ({data.last_stored.book_number})</div>
                    <div><span className="text-muted-foreground">Kapitel/Vers:</span> {data.last_stored.chapter}:{data.last_stored.verse}</div>
                    <div><span className="text-muted-foreground">Gespeichert:</span> {fmtTime(data.last_stored.stored_at)}</div>
                  </>
                ) : <div className="text-muted-foreground">Keine Daten.</div>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pro Übersetzung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">OK</TableHead>
                      <TableHead className="text-right">Wartend</TableHead>
                      <TableHead className="text-right">Retry fällig</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Kapitel gespeichert</TableHead>
                      <TableHead className="text-right">Verse</TableHead>
                      <TableHead>Letzter Versuch</TableHead>
                      <TableHead>Letzter Fehler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.translations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                          Noch keine Daten.
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.translations.map((t) => (
                      <TableRow key={t.translation}>
                        <TableCell className="font-medium">{t.translation}</TableCell>
                        <TableCell className="text-right">{t.ok}</TableCell>
                        <TableCell className="text-right">{t.pending + t.scheduled}</TableCell>
                        <TableCell className="text-right">
                          {t.due_retries > 0 ? <Badge variant="secondary">{t.due_retries}</Badge> : 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.failed > 0 ? <Badge variant="destructive">{t.failed}</Badge> : 0}
                        </TableCell>
                        <TableCell className="text-right">{t.stored_chapters}</TableCell>
                        <TableCell className="text-right">{t.stored_verses.toLocaleString("de-CH")}</TableCell>
                        <TableCell className="text-xs">{fmtTime(t.last_attempt_at)}</TableCell>
                        <TableCell className="text-xs">
                          {t.last_error_code ? <code>{t.last_error_code}</code> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

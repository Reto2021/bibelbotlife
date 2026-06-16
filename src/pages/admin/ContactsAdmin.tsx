import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, Mail, Search, Users } from "lucide-react";
import { toast } from "sonner";

interface ContactRow {
  email: string;
  display_name: string | null;
  sources: string[];
  languages: string[] | null;
  countries: string[] | null;
  last_activity: string | null;
  is_suppressed: boolean;
  has_consent: boolean;
  user_id: string | null;
  church_id: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  app_user: "App-Nutzer",
  church: "Gemeinde",
  daily: "Daily",
};

export default function ContactsAdmin() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [suppressedFilter, setSuppressedFilter] = useState<string>("active");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase.rpc as any)("admin_list_contacts");
      if (error) {
        toast.error("Konnte Kontakte nicht laden: " + error.message);
        setLoading(false);
        return;
      }
      setRows((data ?? []) as ContactRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (suppressedFilter === "active" && r.is_suppressed) return false;
      if (suppressedFilter === "suppressed" && !r.is_suppressed) return false;
      if (sourceFilter !== "all" && !r.sources.includes(sourceFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.email} ${r.display_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, sourceFilter, suppressedFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const appUsers = rows.filter((r) => r.sources.includes("app_user")).length;
    const churches = rows.filter((r) => r.sources.includes("church")).length;
    const multi = rows.filter((r) => r.sources.length > 1).length;
    const suppressed = rows.filter((r) => r.is_suppressed).length;
    return { total, appUsers, churches, multi, suppressed };
  }, [rows]);

  function exportCsv() {
    const header = ["email", "name", "sources", "languages", "countries", "last_activity", "is_suppressed"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const esc = (v: string | null | undefined) =>
        v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;
      lines.push([
        esc(r.email),
        esc(r.display_name),
        esc(r.sources.join("|")),
        esc((r.languages ?? []).join("|")),
        esc((r.countries ?? []).join("|")),
        esc(r.last_activity),
        r.is_suppressed ? "true" : "false",
      ].join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblebot-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} Kontakte exportiert`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Zurück</Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7" /> Kontakte
            </h1>
          </div>
          <Button onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> CSV exportieren ({filtered.length})
          </Button>
        </div>

        <p className="text-sm text-muted-foreground max-w-3xl">
          Zentrale Übersicht aller E-Mail-Kontakte aus allen Quellen (App-Nutzer und Gemeinde-Kontakte),
          dedupliziert nach E-Mail-Adresse. Suppressed-Kontakte (Bounce/Beschwerde/Unsubscribe) sind
          rechtlich blockiert und dürfen nicht angeschrieben werden.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total unique", value: stats.total },
            { label: "App-Nutzer", value: stats.appUsers },
            { label: "Gemeinden", value: stats.churches },
            { label: "Mehrfach-Quelle", value: stats.multi },
            { label: "Suppressed", value: stats.suppressed, danger: true },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-bold ${s.danger ? "text-destructive" : "text-foreground"}`}>
                  {s.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche E-Mail oder Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="app_user">Nur App-Nutzer</SelectItem>
                <SelectItem value="church">Nur Gemeinden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={suppressedFilter} onValueChange={setSuppressedFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Nur anschreibbar</SelectItem>
                <SelectItem value="suppressed">Nur Suppressed</SelectItem>
                <SelectItem value="all">Alle anzeigen</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Kontakte</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Lade...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Keine Kontakte gefunden.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Quellen</TableHead>
                      <TableHead>Sprache / Land</TableHead>
                      <TableHead>Letzte Aktivität</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 500).map((r) => (
                      <TableRow key={r.email}>
                        <TableCell className="font-mono text-xs">{r.email}</TableCell>
                        <TableCell>{r.display_name || "–"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {r.sources.map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">
                                {SOURCE_LABEL[s] ?? s}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[
                            (r.languages ?? []).join(", "),
                            (r.countries ?? []).join(", "),
                          ].filter(Boolean).join(" · ") || "–"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.last_activity ? new Date(r.last_activity).toLocaleDateString("de-CH") : "–"}
                        </TableCell>
                        <TableCell>
                          {r.is_suppressed ? (
                            <Badge variant="destructive" className="text-xs">Blockiert</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Aktiv</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length > 500 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Anzeige auf 500 Zeilen begrenzt – nutze CSV-Export für die vollständige Liste.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

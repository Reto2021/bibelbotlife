import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, FileText, Globe, RotateCcw } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const ALL_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

export default function SeoAdmin() {
  const [batch, setBatch] = useState(20);
  const [force, setForce] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["de", "en"]);
  const [topics, setTopics] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  const toggleLang = (l: string) =>
    setSelectedLangs((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );

  const callFn = async (
    name: "seed-verse-seo" | "seed-seo-topics",
    body: Record<string, unknown>
  ) => {
    setRunning(true);
    append(`▶ ${name} started — batch=${batch}, langs=${selectedLangs.length}, force=${force}`);
    try {
      const { data, error } = await supabase.functions.invoke(name, { body });
      if (error) throw error;
      const created = (data?.results || []).filter((r: any) => r.status === "created").length;
      const skipped = (data?.results || []).filter((r: any) => r.status === "skipped").length;
      const errored = (data?.results || []).filter((r: any) => r.status === "error").length;
      append(`✓ ${name}: ${created} created · ${skipped} skipped · ${errored} errors`);
      if (errored > 0) {
        const firstErr = data.results.find((r: any) => r.status === "error");
        append(`  ↳ first error: ${firstErr?.error}`);
      }
      toast.success(`${name}: ${created} new, ${skipped} skipped`);
    } catch (e: any) {
      append(`✗ ${name}: ${e?.message || String(e)}`);
      toast.error(e?.message || "Fehler");
    } finally {
      setRunning(false);
    }
  };

  const runVerseSeed = () =>
    callFn("seed-verse-seo", { batch, languages: selectedLangs, force });

  const runTopicSeed = () => {
    const t = topics
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    callFn("seed-seo-topics", {
      batch,
      languages: selectedLangs,
      force,
      ...(t.length ? { topics: t } : {}),
    });
  };

  const selectAllLangs = () => setSelectedLangs(ALL_LANGS);
  const selectCoreLangs = () => setSelectedLangs(["de", "en"]);
  const selectMajorLangs = () =>
    setSelectedLangs(["de", "en", "fr", "es", "it", "pt", "nl", "pl", "ru", "ko", "zh"]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="SEO Admin · BibleBot.Life" robots="noindex,nofollow" />
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              SEO Content Seeding
            </h1>
            <p className="text-muted-foreground">
              Generiere Vers-Landingpages und Themen-Hubs in allen Sprachen.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batch">Batch-Grösse (max pro Lauf)</Label>
                <Input
                  id="batch"
                  type="number"
                  min={1}
                  max={80}
                  value={batch}
                  onChange={(e) => setBatch(Math.max(1, Math.min(80, parseInt(e.target.value) || 20)))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Anzahl Generierungen pro Aufruf. AI-Limits beachten.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch id="force" checked={force} onCheckedChange={setForce} />
                <Label htmlFor="force" className="cursor-pointer">
                  Force overwrite (bestehende neu generieren)
                </Label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sprachen ({selectedLangs.length}/{ALL_LANGS.length})</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={selectCoreLangs}>DE+EN</Button>
                  <Button size="sm" variant="ghost" onClick={selectMajorLangs}>Top 11</Button>
                  <Button size="sm" variant="ghost" onClick={selectAllLangs}>Alle 38</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase transition-colors ${
                      selectedLangs.includes(l)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Vers-Landingpages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generiert SEO-Inhalte (Titel, Kontext, Reflexion) für die ~40 wichtigsten
                Bibelverse in den ausgewählten Sprachen. Idempotent.
              </p>
              <Button
                onClick={runVerseSeed}
                disabled={running || selectedLangs.length === 0}
                className="w-full"
              >
                <Globe className="mr-2 h-4 w-4" />
                Verse seeden
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Themen-Hubs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generiert Themen-Seiten (z.B. Liebe, Hoffnung, Vergebung) mit Intro,
                Body, FAQs und verwandten Versen.
              </p>
              <div>
                <Label htmlFor="topics" className="text-xs">
                  Optional: nur bestimmte Slugs (komma-getrennt)
                </Label>
                <Input
                  id="topics"
                  placeholder="z.B. love, hope, forgiveness"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                />
              </div>
              <Button
                onClick={runTopicSeed}
                disabled={running || selectedLangs.length === 0}
                className="w-full"
              >
                <Globe className="mr-2 h-4 w-4" />
                Themen seeden
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Log</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setLog([])}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 rounded-md border bg-muted/30 p-3">
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Aktivität.</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {log.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empfohlener Ablauf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Erst <strong>DE + EN</strong> mit Batch 40 für Verse → ergibt ~80 Seiten in wenigen Min.</p>
            <p>2. Dann <strong>DE + EN</strong> für Themen → ergibt ~60 Hub-Seiten.</p>
            <p>3. Wenn Resultate gut: Top 11 Sprachen, dann alle 38.</p>
            <p>4. Sitemap regeneriert sich automatisch (Cache 1h) — Google findet alles via biblebot.life/sitemap.xml.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

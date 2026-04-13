import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Book, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-search`;

type SearchResult = {
  id: string;
  book: string;
  book_number: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  rank?: number;
};

type SearchResponse = {
  results: SearchResult[];
  query: string;
  expanded_terms: string;
  total: number;
};

const TRANSLATION_LABELS: Record<string, string> = {
  luther1912: "Luther 1912",
  schlachter2000: "Schlachter 2000",
  elberfelder: "Elberfelder",
};

export default function BibleSearch() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState("all");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query: query.trim(), translation, limit: 30, language: i18n.language?.split("-")[0] || "de" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Suche fehlgeschlagen" }));
        throw new Error(err.error || "Suche fehlgeschlagen");
      }

      const data: SearchResponse = await resp.json();
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [query, translation, i18n.language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  };

  // Group results by translation
  const grouped = results?.results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.translation] = acc[r.translation] || []).push(r);
    return acc;
  }, {}) || {};

  return (
    <>
      <SEOHead
        title="Semantische Bibelsuche – BibleBot.Life"
        description="Durchsuche die Bibel nach Themen, Konzepten und Bedeutungen. KI-gestützte semantische Suche in Luther, Schlachter und Elberfelder."
      />

      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Book className="w-8 h-8 text-primary" />
              Semantische Bibelsuche
            </h1>
            <p className="text-muted-foreground mt-2">
              Suche nach Themen, Konzepten oder Fragen — die KI findet passende Bibelstellen.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="z.B. «Wo spricht Jesus über Vergebung?» oder «Hoffnung in schweren Zeiten»"
                className="pl-10"
                autoFocus
              />
            </div>
            <Select value={translation} onValueChange={setTranslation}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Übersetzungen</SelectItem>
                <SelectItem value="luther1912">Luther 1912</SelectItem>
                <SelectItem value="schlachter2000">Schlachter 2000</SelectItem>
                <SelectItem value="elberfelder">Elberfelder</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={doSearch} disabled={loading || query.trim().length < 2}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search info */}
          {results && !loading && (
            <div className="mb-4 text-sm text-muted-foreground">
              <span className="font-medium">{results.total} Ergebnisse</span>
              {results.query !== query && (
                <span className="ml-2">— {results.query}</span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          {/* Results */}
          {results && results.results.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Ergebnisse gefunden. Versuche eine andere Formulierung.</p>
            </div>
          )}

          {translation === "all" ? (
            // Grouped by translation
            Object.entries(grouped).map(([trans, verses]) => (
              <div key={trans} className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {TRANSLATION_LABELS[trans] || trans} ({verses.length})
                </h2>
                <div className="space-y-2">
                  {verses.map((v) => (
                    <VerseCard key={v.id} verse={v} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {results?.results.map((v) => (
                <VerseCard key={v.id} verse={v} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!results && !loading && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Gib ein Thema oder eine Frage ein</p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["Vergebung", "Hoffnung", "Liebe Gottes", "Schöpfung", "Gerechtigkeit"].map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => { setQuery(term); }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function VerseCard({ verse }: { verse: SearchResult }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-foreground leading-relaxed">{verse.text}</p>
          <p className="text-sm text-primary font-medium mt-2">
            {verse.book} {verse.chapter},{verse.verse}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {TRANSLATION_LABELS[verse.translation] || verse.translation}
        </Badge>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface VerseResult {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-search`;

/** Small verse search used inside the Kreuzwege upload dialog. */
export function VersePicker({
  onPick,
}: {
  onPick: (text: string, reference: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(SEARCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            query: term,
            limit: 8,
            language: i18n.language?.split("-")[0] || "de",
          }),
        });
        if (!resp.ok) throw new Error("search failed");
        const data = await resp.json();
        setResults((data.results ?? []).slice(0, 8));
      } catch {
        setError(t("crossways.upload.verseSearchError", "Suche gerade nicht möglich"));
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query, open, i18n.language, t]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <BookOpen className="h-4 w-4" />
          {t("crossways.upload.pickVerse", "Vers aus der Bibel wählen")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,90vw)] space-y-3 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("crossways.upload.versePlaceholder", "Thema oder Stichwort, z. B. Trost")}
            className="pl-8"
          />
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("crossways.upload.verseSearching", "Suche läuft …")}
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {results.map((r) => {
            const reference = `${r.book} ${r.chapter},${r.verse}`;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onPick(r.text, reference);
                  setOpen(false);
                }}
                className="w-full rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                <p className="text-xs font-medium text-primary">{reference}</p>
                <p className="line-clamp-3 text-sm text-muted-foreground">{r.text}</p>
              </button>
            );
          })}
          {!loading && !error && query.trim().length >= 3 && results.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("crossways.upload.verseNoResults", "Keine Verse gefunden")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

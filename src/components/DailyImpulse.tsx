import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, BookOpen, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openBibelBotChat } from "@/lib/chat-events";

const IMPULSE_CACHE_KEY = "bibelbot-daily-impulse";
const IMPULSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-impulse`;

type Impulse = {
  topic: string;
  verse: string;
  reference: string;
  teaser: string;
  context: string;
  date: string;
};

function getCachedImpulse(): Impulse | null {
  try {
    const stored = localStorage.getItem(IMPULSE_CACHE_KEY);
    if (!stored) return null;
    const impulse = JSON.parse(stored) as Impulse;
    const today = new Date().toISOString().slice(0, 10);
    if (impulse.date === today) return impulse;
  } catch {}
  return null;
}

function cacheImpulse(impulse: Impulse) {
  try {
    localStorage.setItem(IMPULSE_CACHE_KEY, JSON.stringify(impulse));
  } catch {}
}

export function DailyImpulse() {
  const [impulse, setImpulse] = useState<Impulse | null>(getCachedImpulse);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(!impulse);

  useEffect(() => {
    if (impulse) return;

    const fetchImpulse = async () => {
      try {
        const resp = await fetch(IMPULSE_URL, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        if (!resp.ok) throw new Error("fetch failed");
        const data: Impulse = await resp.json();
        setImpulse(data);
        cacheImpulse(data);
      } catch (e) {
        console.error("Failed to load daily impulse:", e);
        setImpulse({
          topic: "Hoffnung",
          verse: "«Denn ich weiss wohl, was ich für Gedanken über euch habe, spricht der Herr: Gedanken des Friedens und nicht des Leides.»",
          reference: "Jeremia 29,11 (Lutherbibel 2017)",
          teaser: "Gott hat einen Plan – auch wenn du ihn noch nicht siehst",
          context: "Manchmal fühlt sich das Leben planlos an. Dieser Vers erinnert daran, dass es eine grössere Perspektive gibt.",
          date: new Date().toISOString().slice(0, 10),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchImpulse();
  }, [impulse]);

  const handleDeepDive = () => {
    if (!impulse) return;
    openBibelBotChat(
      `Der Tagesimpuls ist "${impulse.topic}" mit ${impulse.reference}. Erkläre mir diese Stelle: Wer hat das geschrieben? In welcher Situation? Was kommt davor und danach? Und was bedeutet das für mein Leben heute?`
    );
  };

  const handleExploreVerse = () => {
    if (!impulse) return;
    openBibelBotChat(
      `Lies mir den ganzen Abschnitt rund um ${impulse.reference} vor und erkläre mir den Zusammenhang. Ich möchte die Geschichte dahinter verstehen.`
    );
  };

  if (isLoading) {
    return (
      <div className="bg-primary/10 dark:bg-primary/15 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Tagesimpuls wird geladen...</span>
        </div>
      </div>
    );
  }

  if (!impulse) return null;

  return (
    <div className="bg-primary/10 dark:bg-primary/15 border-b border-primary/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full container mx-auto px-4 py-3 flex items-center justify-between gap-3 hover:bg-primary/15 dark:hover:bg-primary/20 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Impuls des Tages</span>
              <span className="text-xs text-muted-foreground">· {impulse.topic}</span>
            </div>
            <p className="text-sm text-foreground dark:text-foreground font-semibold truncate">
              {impulse.teaser}
            </p>
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
            isExpanded ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      </button>

      {isExpanded && (
        <div className="container mx-auto px-4 pb-5 animate-fade-up">
          <div className="ml-11 space-y-4">
            <blockquote className="border-l-2 border-primary/30 pl-4">
              <p className="text-foreground/90 italic text-sm leading-relaxed">
                {impulse.verse}
              </p>
              <footer className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                {impulse.reference}
              </footer>
            </blockquote>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {impulse.context}
            </p>

            {/* Deep dive buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeepDive}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <MessageCircle className="h-3 w-3 mr-1.5" />
                Was bedeutet das für mich?
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExploreVerse}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <BookOpen className="h-3 w-3 mr-1.5" />
                Ganzen Abschnitt lesen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

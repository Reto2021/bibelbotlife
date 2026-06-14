import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerseCard } from "@/components/VerseCard";
import {
  Loader2,
  Download,
  Share2,
  Copy,
  MessageCircle,
  Send as SendIcon,
  RefreshCcw,
  ArrowLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Step = "mood" | "area" | "prompt" | "loading" | "result";

const MOODS = [
  { id: "dankbar", label: "Dankbar", emoji: "🌅" },
  { id: "aengstlich", label: "Ängstlich", emoji: "🌧" },
  { id: "traurig", label: "Traurig", emoji: "🍂" },
  { id: "suchend", label: "Suchend", emoji: "🧭" },
  { id: "hoffnungsvoll", label: "Hoffnungsvoll", emoji: "✨" },
  { id: "muede", label: "Müde", emoji: "🌙" },
];
const AREAS = [
  { id: "arbeit", label: "Arbeit & Alltag" },
  { id: "familie", label: "Familie & Beziehungen" },
  { id: "glaube", label: "Glaube" },
  { id: "sinn", label: "Sinn & Richtung" },
];

interface CardData {
  id: string;
  verse_ref: string;
  verse_text: string;
  explanation: string;
}

function track(name: string, data?: Record<string, unknown>) {
  try {
    supabase.from("analytics_events").insert({
      event_type: "event",
      event_name: name,
      session_id:
        sessionStorage.getItem("bb_session_id") ||
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem("bb_session_id", id);
          return id;
        })(),
      event_data: data || null,
      path: window.location.pathname,
    } as any);
  } catch {}
}

export default function MeinVers() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("verse_card_landing_view", { ref: searchParams.get("ref") || null });
  }, []);

  const shareUrl = card ? `${window.location.origin}/v/${card.id}` : "";
  const qrDataUrl = card
    ? `data:image/svg+xml;utf8,${encodeURIComponent(
        renderToStaticMarkup(<QRCodeSVG value={`${shareUrl}?ref=card`} size={200} level="M" />),
      )}`
    : undefined;

  async function generate(finalPrompt: string) {
    setStep("loading");
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("pick-verse-for-mood", {
        body: { mood, area, prompt: finalPrompt || undefined, language: "de" },
      });
      if (fnErr) throw fnErr;
      if (!data || data.error) throw new Error(data?.error || "no data");
      setCard(data as CardData);
      setStep("result");
      track("verse_card_created", { mood, area, has_prompt: !!finalPrompt, id: data.id });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Fehler beim Erzeugen");
      setStep("prompt");
      toast({
        title: "Hat nicht geklappt",
        description: "Bitte versuch es nochmal.",
        variant: "destructive",
      });
    }
  }

  async function downloadPng() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 1 });
      const link = document.createElement("a");
      link.download = `dein-vers-${card?.verse_ref?.replace(/\s+/g, "-") || "biblebot"}.png`;
      link.href = dataUrl;
      link.click();
      track("verse_card_shared", { channel: "download", id: card?.id });
      if (card) supabase.rpc("increment_verse_card_shares", { card_id: card.id });
    } catch (e) {
      console.error(e);
      toast({ title: "Download fehlgeschlagen", variant: "destructive" });
    }
  }

  function shareTo(channel: "whatsapp" | "telegram" | "native" | "link") {
    if (!card) return;
    const text = `«${card.verse_text}» — ${card.verse_ref}\n\n${shareUrl}`;
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else if (channel === "telegram") {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
          `«${card.verse_text}» — ${card.verse_ref}`,
        )}`,
        "_blank",
      );
    } else if (channel === "native" && (navigator as any).share) {
      (navigator as any).share({ title: "Dein Vers", text, url: shareUrl }).catch(() => {});
    } else if (channel === "link") {
      navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    track("verse_card_shared", { channel, id: card.id });
    supabase.rpc("increment_verse_card_shares", { card_id: card.id });
  }

  function reset() {
    setStep("mood");
    setMood("");
    setArea("");
    setPrompt("");
    setCard(null);
  }

  return (
    <>
      <Helmet>
        <title>Dein Vers – Persönlicher Bibelvers in 30 Sekunden | biblebot.life</title>
        <meta
          name="description"
          content="In 30 Sekunden zu einem persönlichen Bibelvers, der genau zu dem passt, was du gerade brauchst. Kostenlos, ohne Anmeldung."
        />
        <link rel="canonical" href="https://biblebot.life/mein-vers" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>

          {/* Stepper Header */}
          {step !== "result" && step !== "loading" && (
            <div className="mb-8">
              <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-3">
                Dein Vers.
              </h1>
              <p className="text-lg text-muted-foreground">
                In 30 Sekunden zu einem Vers, der zu dir passt.
              </p>
              <div className="flex gap-1.5 mt-6">
                {["mood", "area", "prompt"].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ["mood", "area", "prompt"].indexOf(step) >= ["mood", "area", "prompt"].indexOf(s)
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Mood */}
          {step === "mood" && (
            <div className="animate-fade-up">
              <h2 className="text-xl font-medium mb-4">Wie fühlst du dich gerade?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMood(m.id);
                      setStep("area");
                    }}
                    className="group flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-accent/30 transition-all duration-200"
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform">
                      {m.emoji}
                    </span>
                    <span className="font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Area */}
          {step === "area" && (
            <div className="animate-fade-up">
              <h2 className="text-xl font-medium mb-4">Worum geht es?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AREAS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setArea(a.id);
                      setStep("prompt");
                    }}
                    className="p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-accent/30 transition-all duration-200 text-left text-lg font-medium"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("mood")}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Zurück
              </button>
            </div>
          )}

          {/* Step 3: Prompt (optional) */}
          {step === "prompt" && (
            <div className="animate-fade-up">
              <h2 className="text-xl font-medium mb-2">
                Möchtest du noch etwas dazu sagen?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Optional. Ein Satz reicht — z.B. „Mein Vater ist krank" oder „Ich weiss nicht weiter".
              </p>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
                placeholder="Worum geht es gerade?"
                rows={4}
                className="resize-none text-base"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {prompt.length}/200
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep("area")}>
                  ← Zurück
                </Button>
                <Button onClick={() => generate(prompt)} className="flex-1" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mein Vers
                </Button>
              </div>
              {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            </div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div className="py-24 flex flex-col items-center gap-6 animate-fade-up">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Dein Vers wird gewählt…</p>
            </div>
          )}

          {/* Result */}
          {step === "result" && card && (
            <div className="animate-fade-up">
              <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight mb-6">
                Hier ist dein Vers.
              </h1>

              {/* Preview-Karte (kleiner, scaled) */}
              <div className="rounded-2xl overflow-hidden shadow-2xl mb-6 border border-border/50">
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "9 / 16",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      transform: "scale(calc(100% / 1080))",
                      transformOrigin: "top left",
                      width: 1080,
                      height: 1920,
                    }}
                  >
                    <VerseCard
                      ref={cardRef}
                      verseText={card.verse_text}
                      verseRef={card.verse_ref}
                      explanation={card.explanation}
                      qrUrl={qrDataUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                <Button onClick={() => shareTo("whatsapp")} variant="outline" className="h-12">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button onClick={() => shareTo("telegram")} variant="outline" className="h-12">
                  <SendIcon className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
                <Button onClick={downloadPng} variant="outline" className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => shareTo("link")} variant="outline" className="h-12">
                  {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {linkCopied ? "Kopiert" : "Link"}
                </Button>
              </div>

              {(navigator as any).share && (
                <Button onClick={() => shareTo("native")} className="w-full mb-3" size="lg">
                  <Share2 className="h-4 w-4 mr-2" />
                  Teilen
                </Button>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="ghost" onClick={reset} className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Neuer Vers
                </Button>
                <Link to={`/?q=${encodeURIComponent(card.verse_ref)}`} className="flex-1">
                  <Button variant="default" className="w-full">
                    Mit dem BibelBot weiterreden →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

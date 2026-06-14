import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/VerseCard";
import {
  Download,
  Share2,
  Copy,
  MessageCircle,
  Send as SendIcon,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

interface CardData {
  id: string;
  verse_ref: string;
  verse_text: string;
  explanation: string;
  image_url: string | null;
  mood: string | null;
}

export default function VerseCardPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("verse_cards" as any)
        .select("id, verse_ref, verse_text, explanation, image_url, mood")
        .eq("id", id)
        .maybeSingle();
      setCard(data as any);
      setLoading(false);
      if (data) {
        supabase.rpc("increment_verse_card_views", { card_id: id } as any);
        // If the server-side PNG isn't ready yet, kick off generation so the
        // OG image is available on the next visit / scrape.
        if (!(data as any).image_url) {
          supabase.functions
            .invoke("generate-verse-card", { body: { id } })
            .then(({ data: gen }) => {
              if (gen?.image_url) setCard((c) => (c ? { ...c, image_url: gen.image_url } : c));
            })
            .catch(() => {});
        }
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-muted-foreground">Diese Karte gibt es nicht (mehr).</p>
        <Link to="/mein-vers">
          <Button>Eigenen Vers erhalten</Button>
        </Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/v/${card.id}`;
  const qrDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
    renderToStaticMarkup(<QRCodeSVG value={`${shareUrl}?ref=card`} size={200} level="M" />),
  )}`;
  const ogText = `${card.verse_text} — ${card.verse_ref}`;

  async function downloadPng() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `dein-vers-${card!.verse_ref.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      supabase.rpc("increment_verse_card_shares", { card_id: card!.id } as any);
    } catch (e) {
      console.error(e);
    }
  }

  function shareTo(channel: "whatsapp" | "telegram" | "native" | "link") {
    const text = `«${card!.verse_text}» — ${card!.verse_ref}\n\n${shareUrl}`;
    if (channel === "whatsapp")
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (channel === "telegram")
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
          `«${card!.verse_text}» — ${card!.verse_ref}`,
        )}`,
        "_blank",
      );
    else if (channel === "native" && (navigator as any).share)
      (navigator as any).share({ title: "Dein Vers", text, url: shareUrl }).catch(() => {});
    else if (channel === "link") {
      navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    supabase.rpc("increment_verse_card_shares", { card_id: card!.id } as any);
  }

  return (
    <>
      <Helmet>
        <title>{card.verse_ref} — Dein Vers | biblebot.life</title>
        <meta name="description" content={ogText.slice(0, 160)} />
        <meta property="og:title" content={`${card.verse_ref} — biblebot.life`} />
        <meta property="og:description" content={ogText.slice(0, 200)} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        {card.image_url && <meta property="og:image" content={card.image_url} />}
        {card.image_url && <meta property="og:image:width" content="1200" />}
        {card.image_url && <meta property="og:image:height" content="630" />}
        {card.image_url && <meta name="twitter:image" content={card.image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={shareUrl} />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl mb-6 border border-border/50">
            <div style={{ width: "100%", aspectRatio: "9 / 16", overflow: "hidden", position: "relative" }}>
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
                  mood={(card.mood || undefined) as any}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <Button onClick={() => shareTo("whatsapp")} variant="outline" className="h-12">
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button onClick={() => shareTo("telegram")} variant="outline" className="h-12">
              <SendIcon className="h-4 w-4 mr-2" /> Telegram
            </Button>
            <Button onClick={downloadPng} variant="outline" className="h-12">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button onClick={() => shareTo("link")} variant="outline" className="h-12">
              {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {linkCopied ? "Kopiert" : "Link"}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-medium mb-2">Auch dein Vers wartet auf dich.</h2>
            <p className="text-sm text-muted-foreground mb-4">
              In 30 Sekunden zu einem Bibelvers, der genau zu dem passt, was du gerade brauchst.
            </p>
            <Link to="/mein-vers">
              <Button size="lg" className="w-full md:w-auto">
                Eigenen Vers erhalten →
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

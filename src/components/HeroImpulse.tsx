import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2, MessageCircle, Image, Download, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { openBibelBotChat } from "@/lib/chat-events";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/hooks/use-toast";

const IMPULSE_CACHE_KEY = "bibelbot-daily-impulse";
const IMPULSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-impulse`;
const SHARE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/impulse-share-image`;

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

const SHARE_IMAGE_CACHE_KEY = "bibelbot-share-image";

function getCachedShareImage(): string | null {
  try {
    const stored = localStorage.getItem(SHARE_IMAGE_CACHE_KEY);
    if (!stored) return null;
    const { url, date } = JSON.parse(stored);
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) return url;
  } catch {}
  return null;
}

function cacheShareImage(url: string, date: string) {
  try {
    localStorage.setItem(SHARE_IMAGE_CACHE_KEY, JSON.stringify({ url, date }));
  } catch {}
}

export function HeroImpulse() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [impulse, setImpulse] = useState<Impulse | null>(getCachedImpulse);
  const [isLoading, setIsLoading] = useState(!impulse);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(getCachedShareImage);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (impulse) return;
    const fetchImpulse = async () => {
      try {
        const resp = await fetch(IMPULSE_URL, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        if (!resp.ok) throw new Error("fetch failed");
        const data: Impulse = await resp.json();
        setImpulse(data);
        cacheImpulse(data);
      } catch {
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

  const generateShareImage = useCallback(async () => {
    if (!impulse || isGeneratingImage) return;
    const cached = getCachedShareImage();
    if (cached) {
      setShareImageUrl(cached);
      setShowImagePreview(true);
      return;
    }
    setIsGeneratingImage(true);
    try {
      const resp = await fetch(SHARE_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          verse: impulse.verse,
          reference: impulse.reference,
          teaser: impulse.teaser,
          topic: impulse.topic,
          date: impulse.date,
        }),
      });
      if (!resp.ok) throw new Error("Generation failed");
      const { imageUrl } = await resp.json();
      setShareImageUrl(imageUrl);
      cacheShareImage(imageUrl, impulse.date);
      setShowImagePreview(true);
    } catch {
      toast({ title: t("share.imageError"), description: t("share.imageErrorDesc"), variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [impulse, isGeneratingImage, toast, t]);

  const shareAsImage = useCallback(async () => {
    if (!shareImageUrl || !impulse) return;
    const shareText = `${impulse.verse}\n\n– ${impulse.reference}\n\n${impulse.teaser}\n\nbibelbot.ch`;
    try {
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `bibelbot-impuls-${impulse.date}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: t("share.impulseTitle"), text: shareText, files: [file] });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: t("share.imageSaved"), description: t("share.imageSavedDesc") });
    } catch {}
  }, [shareImageUrl, impulse, toast, t]);

  const downloadImage = useCallback(async () => {
    if (!shareImageUrl || !impulse) return;
    try {
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bibelbot-impuls-${impulse.date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(shareImageUrl, "_blank");
    }
  }, [shareImageUrl, impulse]);

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
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-card/40 backdrop-blur-sm rounded-xl px-6 py-5 border border-border/50 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t("impulse.loading")}</span>
        </div>
      </div>
    );
  }

  if (!impulse) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="max-w-xl mx-auto mt-10"
    >
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t("impulse.label")}
            </span>
            <span className="text-xs text-muted-foreground">· {impulse.topic}</span>
          </div>

          {/* Teaser as headline */}
          <p className="text-base font-semibold text-foreground leading-snug mb-3">
            {impulse.teaser}
          </p>

          {/* Verse */}
          <blockquote className="border-l-2 border-primary/30 pl-4 mb-3">
            <p className="text-foreground/80 italic text-sm leading-relaxed">{impulse.verse}</p>
            <footer className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              {impulse.reference}
            </footer>
          </blockquote>

          {/* Context */}
          <p className="text-sm text-muted-foreground leading-relaxed">{impulse.context}</p>
        </div>

        {/* Image Preview */}
        {showImagePreview && shareImageUrl && (
          <div className="px-6 pb-3 animate-fade-up">
            <div className="rounded-xl overflow-hidden border border-border shadow-md">
              <img
                src={shareImageUrl}
                alt={`${t("share.impulseTitle")} – ${impulse.topic}`}
                className="w-full max-h-64 object-cover"
                loading="lazy"
              />
              <div className="bg-card/80 backdrop-blur-sm p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t("share.imageReady")}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={downloadImage} className="text-xs border-primary/30 text-primary hover:bg-primary/10 h-7">
                    <Download className="h-3 w-3 mr-1" />
                    {t("share.download")}
                  </Button>
                  <Button size="sm" onClick={shareAsImage} className="text-xs h-7">
                    {t("share.shareImage")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-5 pt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleDeepDive} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
            <MessageCircle className="h-3 w-3 mr-1.5" />
            {t("impulse.deepDive")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleExploreVerse} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
            <BookOpen className="h-3 w-3 mr-1.5" />
            {t("impulse.explore")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateShareImage}
            disabled={isGeneratingImage}
            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                {t("share.generating")}
              </>
            ) : (
              <>
                <Image className="h-3 w-3 mr-1.5" />
                {t("share.createImage")}
              </>
            )}
          </Button>
          <ShareButton
            title={t("share.impulseTitle")}
            text={`${impulse.verse}\n\n– ${impulse.reference}\n\n${impulse.teaser}`}
            utmSource="impulse"
            variant="button"
          />
        </div>
      </div>
    </motion.div>
  );
}

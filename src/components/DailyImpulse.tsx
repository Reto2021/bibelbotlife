import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronRight, BookOpen, Loader2, MessageCircle, Image, Download, Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openBibelBotChat } from "@/lib/chat-events";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/hooks/use-toast";

const IMPULSE_CACHE_KEY = "bibelbot-daily-impulse";
const IMPULSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-impulse`;
const SHARE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/impulse-share-image`;
const SUBSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-daily`;
const TELEGRAM_LINK = "https://t.me/meinbibelbot";
const VAPID_PUBLIC_KEY = "BLMl5bBRzhlza0ozrHEblp3BfKtbyDsbOP-n120rl6teGPFdoyFb77P9WnOZpbFs2hKyfwILmw8WQebJrp_qc7c";
const SUBSCRIBED_KEY = "bibelbot-daily-subscribed";

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

// Cache share image URL per date
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

export function DailyImpulse() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [impulse, setImpulse] = useState<Impulse | null>(getCachedImpulse);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(!impulse);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(getCachedShareImage);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

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

  const generateShareImage = useCallback(async () => {
    if (!impulse || isGeneratingImage) return;

    // Check cache first
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
    } catch (e) {
      console.error("Failed to generate share image:", e);
      toast({
        title: t("share.imageError"),
        description: t("share.imageErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [impulse, isGeneratingImage, toast, t]);

  const shareAsImage = useCallback(async () => {
    if (!shareImageUrl || !impulse) return;

    const shareText = `${impulse.verse}\n\n– ${impulse.reference}\n\n${impulse.teaser}\n\nbibelbot.ch`;

    // Try sharing with image file (Web Share API Level 2)
    try {
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `bibelbot-impuls-${impulse.date}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: t("share.impulseTitle"),
          text: shareText,
          files: [file],
        });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.log("File share not supported, falling back");
    }

    // Fallback: open image for manual save + copy text
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: t("share.imageSaved"),
        description: t("share.imageSavedDesc"),
      });
    } catch {
      // Just show the preview
    }
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
      // Fallback: open in new tab
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
      <div className="bg-primary/10 dark:bg-primary/15 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 bg-primary/15 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-primary/10 rounded animate-pulse" />
          </div>
          <div className="h-4 w-4 bg-primary/10 rounded animate-pulse shrink-0" />
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
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("impulse.label")}</span>
              <span className="text-xs text-muted-foreground">· {impulse.topic}</span>
            </div>
            <p className="text-sm text-foreground dark:text-foreground font-semibold truncate">{impulse.teaser}</p>
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-90" : "group-hover:translate-x-0.5"}`}
        />
      </button>

      {isExpanded && (
        <div className="container mx-auto px-4 pb-5 animate-fade-up">
          <div className="ml-11 space-y-4">
            <blockquote className="border-l-2 border-primary/30 pl-4">
              <p className="text-foreground/90 italic text-sm leading-relaxed">{impulse.verse}</p>
              <footer className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                {impulse.reference}
              </footer>
            </blockquote>
            <p className="text-sm text-muted-foreground leading-relaxed">{impulse.context}</p>

            {/* Image Preview */}
            {showImagePreview && shareImageUrl && (
              <div className="rounded-xl overflow-hidden border border-border shadow-md animate-fade-up">
                <img
                  src={shareImageUrl}
                  alt={`${t("share.impulseTitle")} – ${impulse.topic}`}
                  className="w-full max-h-80 object-cover"
                  loading="lazy"
                />
                <div className="bg-card/80 backdrop-blur-sm p-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{t("share.imageReady")}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadImage}
                      className="text-xs border-primary/30 text-primary hover:bg-primary/10 h-7"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t("share.download")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={shareAsImage}
                      className="text-xs h-7"
                    >
                      {t("share.shareImage")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleDeepDive} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
                <MessageCircle className="h-3 w-3 mr-1.5" />
                {t("impulse.deepDive")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExploreVerse} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
                <BookOpen className="h-3 w-3 mr-1.5" />
                {t("impulse.explore")}
              </Button>

              {/* Visual Share Button */}
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

              {/* Text Share */}
              <ShareButton
                title={t("share.impulseTitle")}
                text={`${impulse.verse}\n\n– ${impulse.reference}\n\n${impulse.teaser}`}
                utmSource="impulse"
                variant="button"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyImpulse;

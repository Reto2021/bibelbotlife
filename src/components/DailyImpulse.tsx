import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronRight, BookOpen, Loader2, MessageCircle, Image, Download, Bell, Send, Smartphone, Volume2, VolumeX, XCircle, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { openBibleBotChat } from "@/lib/chat-events";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/hooks/use-toast";
import { generateShareImage } from "@/lib/share-image-canvas";

const IMPULSE_CACHE_KEY = "bibelbot-daily-impulse";
const IMPULSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-impulse`;
const SUBSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-daily`;
const TELEGRAM_LINK = "https://t.me/meinbibelbot";
const VAPID_PUBLIC_KEY = "BLMl5bBRzhlza0ozrHEblp3BfKtbyDsbOP-n120rl6teGPFdoyFb77P9WnOZpbFs2hKyfwILmw8WQebJrp_qc7c";
const SUBSCRIBED_KEY = "bibelbot-daily-subscribed";
const SUBSCRIBER_ID_KEY = "bibelbot-subscriber-id";
const SUBSCRIBER_CHANNEL_KEY = "bibelbot-subscriber-channel";

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

// Cache share image blob URL per date
const SHARE_IMAGE_CACHE_KEY = "bibelbot-share-image-blob";

// Parse Bible references like (Jona 2,1-11) or (1. Mose 3,15) in text and make them clickable
const BIBLE_REF_REGEX = /\((\d?\.\s?)?([A-ZÄÖÜa-zäöü]+(?:\s[A-ZÄÖÜa-zäöü]+)?)\s+(\d+[,:]\d+(?:[–-]\d+)?(?:[.;,]\s?\d+)?(?:\s*\([^)]*\))?)\)/g;

function renderContextWithLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(BIBLE_REF_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const fullMatch = match[0]; // e.g. "(Jona 2,1-11)"
    const innerRef = fullMatch.slice(1, -1); // strip parens
    const searchQuery = encodeURIComponent(innerRef);
    parts.push(
      <a
        key={match.index}
        href={`/bibel?q=${searchQuery}`}
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        title={innerRef}
      >
        {fullMatch}
      </a>
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
export function DailyImpulse() {

  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(true); // will sync with isMobile on first render
  const [collapsedInitialized, setCollapsedInitialized] = useState(false);
  const [impulse, setImpulse] = useState<Impulse | null>(getCachedImpulse);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(!impulse);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem(SUBSCRIBED_KEY) === "1");
  const [subscriberId, setSubscriberId] = useState<string | null>(() => localStorage.getItem(SUBSCRIBER_ID_KEY));
  const [subscriberChannel, setSubscriberChannel] = useState<string | null>(() => localStorage.getItem(SUBSCRIBER_CHANNEL_KEY));
  const [showChannels, setShowChannels] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const imagePreviewRef = useRef<HTMLDivElement>(null);
  const tts = useTTS();

  // Initialise collapse state based on mobile once detected
  useEffect(() => {
    if (!collapsedInitialized && isMobile !== undefined) {
      setCollapsed(isMobile);
      setCollapsedInitialized(true);
    }
  }, [isMobile, collapsedInitialized]);

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

  const handleGenerateShareImage = useCallback(async () => {
    if (!impulse || isGeneratingImage) return;

    // Reuse existing blob
    if (shareImageUrl) {
      setShowImagePreview(true);
      setTimeout(() => imagePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      return;
    }

    setIsGeneratingImage(true);
    try {
      const blob = await generateShareImage({
        verse: impulse.verse,
        reference: impulse.reference,
        topic: impulse.topic,
      });
      const url = URL.createObjectURL(blob);
      setShareBlob(blob);
      setShareImageUrl(url);
      setShowImagePreview(true);
      setTimeout(() => imagePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
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
  }, [impulse, isGeneratingImage, shareImageUrl, toast, t]);

  const shareAsImage = useCallback(async () => {
    if (!shareBlob || !impulse) return;

    const shareText = `${impulse.verse}\n\n– ${impulse.reference}\n\n${impulse.teaser}\n\nbiblebot.life`;

    try {
      const file = new File([shareBlob], `bibelbot-impuls-${impulse.date}.png`, { type: "image/png" });

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
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: t("share.imageSaved"),
        description: t("share.imageSavedDesc"),
      });
    } catch {}
  }, [shareBlob, impulse, toast, t]);

  const downloadImage = useCallback(() => {
    if (!shareImageUrl || !impulse) return;
    const a = document.createElement("a");
    a.href = shareImageUrl;
    a.download = `bibelbot-impuls-${impulse.date}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [shareImageUrl, impulse]);

  const handleDeepDive = () => {
    if (!impulse) return;
    openBibleBotChat(
      `Der Tagesimpuls ist "${impulse.topic}" mit ${impulse.reference}. Erkläre mir diese Stelle: Wer hat das geschrieben? In welcher Situation? Was kommt davor und danach? Und was bedeutet das für mein Leben heute?`
    );
  };

  const handleExploreVerse = () => {
    if (!impulse) return;
    openBibleBotChat(
      `Lies mir den ganzen Abschnitt rund um ${impulse.reference} vor und erkläre mir den Zusammenhang. Ich möchte die Geschichte dahinter verstehen.`
    );
  };

  const saveSubscription = (id: string, channel: string) => {
    localStorage.setItem(SUBSCRIBED_KEY, "1");
    localStorage.setItem(SUBSCRIBER_ID_KEY, id);
    localStorage.setItem(SUBSCRIBER_CHANNEL_KEY, channel);
    setIsSubscribed(true);
    setSubscriberId(id);
    setSubscriberChannel(channel);
    setShowChannels(false);
    setShowManage(false);
  };

  const clearSubscription = () => {
    localStorage.removeItem(SUBSCRIBED_KEY);
    localStorage.removeItem(SUBSCRIBER_ID_KEY);
    localStorage.removeItem(SUBSCRIBER_CHANNEL_KEY);
    setIsSubscribed(false);
    setSubscriberId(null);
    setSubscriberChannel(null);
    setShowManage(false);
  };

  const handleSubscribePush = useCallback(async () => {
    setIsSubscribing(true);
    try {
      const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
      const isPreview = window.location.hostname.includes("lovableproject.com") || window.location.hostname.includes("id-preview--");
      if (isInIframe || isPreview) {
        toast({ title: t("subscribe.toastPushPreview"), description: t("subscribe.toastPushPreviewDesc"), variant: "destructive" });
        return;
      }
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        toast({ title: t("subscribe.toastNotSupported"), description: t("subscribe.toastNotSupportedDesc"), variant: "destructive" });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: t("subscribe.toastPermDenied"), description: t("subscribe.toastPermDeniedDesc"), variant: "destructive" });
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const pushSubscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
      const resp = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "push", push_subscription: pushSubscription.toJSON(), language: i18n.language }),
      });
      if (!resp.ok) throw new Error("Subscribe failed");
      const data = await resp.json();
      saveSubscription(data.subscriber_id || "", "push");
      toast({ title: t("subscribe.toastSuccess"), description: t("subscribe.toastSuccessDesc") });
    } catch (e) {
      toast({ title: t("subscribe.toastError"), description: e instanceof Error ? e.message : t("subscribe.toastErrorDesc"), variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  }, [toast, t, i18n.language]);

  const handleSubscribeTelegram = useCallback(() => {
    window.open(TELEGRAM_LINK, "_blank");
    saveSubscription("", "telegram");
    toast({ title: t("subscribe.toastTelegram"), description: t("subscribe.toastTelegramDesc") });
  }, [toast, t]);

  const handleSubscribeSms = useCallback(async () => {
    if (smsPhone.length < 8) return;
    setIsSubscribing(true);
    try {
      const resp = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "sms", phone_number: smsPhone, language: i18n.language }),
      });
      if (!resp.ok) throw new Error("Subscribe failed");
      const data = await resp.json();
      saveSubscription(data.subscriber_id || "", "sms");
      setShowSmsInput(false);
      toast({ title: t("subscribe.toastSuccess"), description: t("subscribe.toastSuccessDesc") });
    } catch (e) {
      toast({ title: t("subscribe.toastError"), description: e instanceof Error ? e.message : t("subscribe.toastErrorDesc"), variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  }, [smsPhone, toast, t, i18n.language]);

  const handleUnsubscribe = useCallback(async () => {
    if (!subscriberId) {
      clearSubscription();
      toast({ title: t("subscribe.unsubscribedTitle", "Abgemeldet"), description: t("subscribe.unsubscribedDesc", "Du erhältst keine tägliche Inspiration mehr.") });
      return;
    }
    setIsUnsubscribing(true);
    try {
      const resp = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", subscriber_id: subscriberId }),
      });
      if (!resp.ok) throw new Error("Unsubscribe failed");
      clearSubscription();
      toast({ title: t("subscribe.unsubscribedTitle", "Abgemeldet"), description: t("subscribe.unsubscribedDesc", "Du erhältst keine tägliche Inspiration mehr.") });
    } catch (e) {
      toast({ title: t("subscribe.toastError"), description: e instanceof Error ? e.message : t("subscribe.toastErrorDesc"), variant: "destructive" });
    } finally {
      setIsUnsubscribing(false);
    }
  }, [subscriberId, toast, t]);

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
      {/* Outer collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="font-medium">Tagesimpuls</span>
          {collapsed && impulse && (
            <span className="text-xs opacity-70 truncate max-w-[200px]">
              · {impulse.reference}
            </span>
          )}
        </span>
        {collapsed
          ? <ChevronDown className="h-4 w-4" />
          : <ChevronUp className="h-4 w-4" />
        }
      </button>

      {!collapsed && (<>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity group cursor-pointer"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("impulse.label")}</span>
              <span className="text-xs text-muted-foreground">· {impulse.topic}</span>
            </div>
            <p className="text-sm text-foreground dark:text-foreground font-semibold line-clamp-2 sm:line-clamp-1">{impulse.teaser}</p>
          </div>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-90" : "group-hover:translate-x-0.5"}`}
          />
        </button>

        {/* Single CTA button in banner */}
        {!isSubscribed && (
          <div className="hidden sm:flex shrink-0">
            <Button
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs h-7 bg-primary hover:bg-primary/90"
            >
              <Bell className="h-3 w-3 mr-1" />
              {t("subscribe.subscribeButton")}
            </Button>
          </div>
        )}
        {isSubscribed && (
          <button
            onClick={() => { setIsExpanded(true); setShowManage(true); }}
            className="hidden sm:flex text-xs text-primary/70 items-center gap-1 shrink-0 hover:text-primary transition-colors cursor-pointer"
          >
            ✓ {t("impulse.alreadySubscribed")}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="container mx-auto px-4 pb-5 animate-fade-up">
          <div className="ml-11 space-y-4">
            <blockquote className="border-l-[3px] border-primary/50 pl-4 bg-accent/30 rounded-r-lg py-2">
              <p className="font-serif text-foreground/90 italic text-[15px] leading-relaxed">{impulse.verse}</p>
              <footer className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium not-italic">
                <BookOpen className="h-3 w-3" />
                {impulse.reference}
              </footer>
            </blockquote>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {renderContextWithLinks(impulse.context)}
            </p>

            {/* Image Preview */}
            {showImagePreview && shareImageUrl && (
              <div ref={imagePreviewRef} className="rounded-xl overflow-hidden border border-border shadow-md animate-fade-up bg-card">
                <div className="flex justify-center bg-muted/20 p-3 sm:p-4">
                  <img
                    src={shareImageUrl}
                    alt={`${t("share.impulseTitle")} – ${impulse.topic}`}
                    className="w-full max-w-[520px] h-auto rounded-lg object-contain"
                    loading="lazy"
                  />
                </div>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!impulse) return;
                  tts.play(`${impulse.verse} – ${impulse.reference}. ${impulse.context}`);
                }}
                disabled={tts.isLoading}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                {tts.isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : tts.isPlaying ? (
                  <VolumeX className="h-3 w-3 mr-1.5" />
                ) : (
                  <Volume2 className="h-3 w-3 mr-1.5" />
                )}
                {tts.isPlaying ? t("impulse.stopAudio", "Stopp") : t("impulse.playAudio", "Vorlesen")}
              </Button>
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
                onClick={handleGenerateShareImage}
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

            {/* Subscribe: not yet subscribed */}
            {!isSubscribed && (
              <div className="mt-4 pt-4 border-t border-primary/15">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <p className="text-sm text-foreground/80 font-medium flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    {t("impulse.subscribeCta")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleSubscribePush}
                      disabled={isSubscribing}
                      className="text-xs h-7 bg-primary hover:bg-primary/90"
                    >
                      {isSubscribing && !showSmsInput ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Bell className="h-3 w-3 mr-1" />
                      )}
                      {t("subscribe.push")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSubscribeTelegram}
                      className="text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Telegram
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSmsInput(!showSmsInput)}
                      className="text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Smartphone className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                  </div>
                </div>
                {showSmsInput && (
                  <div className="mt-3 flex items-center gap-2 animate-fade-up">
                    <input
                      type="tel"
                      placeholder={t("subscribe.phonePlaceholder", "+41 79 123 45 67")}
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      className="flex-1 h-7 text-xs px-3 rounded-md border border-primary/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={20}
                    />
                    <Button
                      size="sm"
                      onClick={handleSubscribeSms}
                      disabled={isSubscribing || smsPhone.length < 8}
                      className="text-xs h-7 bg-primary hover:bg-primary/90"
                    >
                      {isSubscribing && showSmsInput ? <Loader2 className="h-3 w-3 animate-spin" /> : t("subscribe.submit", "Abonnieren")}
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5">{t("subscribe.footNote")}</p>
              </div>
            )}

            {/* Already subscribed: manage subscription */}
            {isSubscribed && (
              <div className="mt-3 pt-3 border-t border-primary/15">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-primary/70 flex items-center gap-1">
                    ✓ {t("impulse.alreadySubscribed")}
                    {subscriberChannel && (
                      <span className="text-muted-foreground ml-1">
                        ({subscriberChannel === "push" ? "Push" : subscriberChannel === "sms" ? "SMS" : "Telegram"})
                      </span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowManage(!showManage)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="h-3 w-3 mr-1" />
                    {t("subscribe.manage", "Abo verwalten")}
                  </Button>
                </div>
                {showManage && (
                  <div className="mt-3 space-y-3 animate-fade-up">
                    <div>
                      <p className="text-xs font-medium text-foreground/80 mb-2">
                        {t("subscribe.switchChannel", "Kanal wechseln:")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={handleSubscribePush}
                          disabled={isSubscribing}
                          variant={subscriberChannel === "push" ? "default" : "outline"}
                          className={`text-xs h-7 ${subscriberChannel === "push" ? "bg-primary hover:bg-primary/90" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                        >
                          {isSubscribing && !showSmsInput ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Bell className="h-3 w-3 mr-1" />}
                          Push
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubscribeTelegram}
                          variant={subscriberChannel === "telegram" ? "default" : "outline"}
                          className={`text-xs h-7 ${subscriberChannel === "telegram" ? "bg-primary hover:bg-primary/90" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                        >
                          <Send className="h-3 w-3 mr-1" /> Telegram
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowSmsInput(!showSmsInput)}
                          variant={subscriberChannel === "sms" ? "default" : "outline"}
                          className={`text-xs h-7 ${subscriberChannel === "sms" ? "bg-primary hover:bg-primary/90" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                        >
                          <Smartphone className="h-3 w-3 mr-1" /> SMS
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUnsubscribe}
                      disabled={isUnsubscribing}
                      className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {isUnsubscribing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {t("subscribe.unsubscribe", "Abo beenden")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )} {/* end isExpanded */}
      </>)} {/* end !collapsed */}
    </div>
  );
}

export default DailyImpulse;

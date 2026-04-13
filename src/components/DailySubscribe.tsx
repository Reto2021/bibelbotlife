import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Send, Phone, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = "BLMl5bBRzhlza0ozrHEblp3BfKtbyDsbOP-n120rl6teGPFdoyFb77P9WnOZpbFs2hKyfwILmw8WQebJrp_qc7c";

const SUBSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-daily`;
const TELEGRAM_LINK = "https://t.me/meinbibelbot";

type Channel = "push" | "sms" | "telegram";

export function DailySubscribe() {
  const { t, i18n } = useTranslation();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("+41 ");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const CHANNELS: { id: Channel; label: string; icon: typeof Bell; desc: string }[] = [
    { id: "push", label: t("subscribe.push"), icon: Bell, desc: t("subscribe.pushDesc") },
    { id: "telegram", label: t("subscribe.telegram"), icon: Send, desc: t("subscribe.telegramDesc") },
    { id: "sms", label: t("subscribe.sms"), icon: Smartphone, desc: t("subscribe.smsDesc") },
  ];

  const handleSubscribe = async () => {
    if (!selectedChannel) return;

    if (selectedChannel === "sms") {
      const cleaned = phone.replace(/\s/g, "");
      if (!cleaned.startsWith("+41") || cleaned.length < 12) {
        toast({ title: t("subscribe.smsSwissOnly", "Swiss numbers only"), description: t("subscribe.smsSwissOnlyDesc", "SMS is only available for Swiss numbers (+41)."), variant: "destructive" });
        return;
      }
    }
    setIsLoading(true);
    try {
      if (selectedChannel === "telegram") {
        window.open(TELEGRAM_LINK, "_blank");
        toast({ title: t("subscribe.toastTelegram"), description: t("subscribe.toastTelegramDesc") });
        setIsSuccess(true);
        return;
      }

      let pushSubscription: PushSubscription | null = null;

      if (selectedChannel === "push") {
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
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
      }

      const body: Record<string, unknown> = { channel: selectedChannel, language: i18n.language };
      if (firstName.trim()) body.first_name = firstName.trim();
      if (selectedChannel === "sms") body.phone_number = phone;
      if (selectedChannel === "push" && pushSubscription) {
        body.push_subscription = pushSubscription.toJSON();
      }

      const resp = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok && resp.status !== 200) {
        throw new Error(data.error || t("subscribe.toastErrorDesc"));
      }

      toast({ title: t("subscribe.toastSuccess"), description: data.message || t("subscribe.toastSuccessDesc") });
      setIsSuccess(true);
    } catch (e) {
      toast({ title: t("subscribe.toastError"), description: e instanceof Error ? e.message : t("subscribe.toastErrorDesc"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">{t("subscribe.successTitle")}</h3>
        <p className="text-muted-foreground">{t("subscribe.successText")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8">
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{t("subscribe.title")}</h3>
        <p className="text-muted-foreground">{t("subscribe.subtitle")}</p>
      </div>

      {/* Sample impulse preview */}
      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("subscribe.previewLabel", "So sieht dein täglicher Impuls aus")}</p>
        <div className="flex gap-2.5 items-start">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{t("subscribe.previewTitle", "BibleBot · Täglicher Impuls")}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t("subscribe.previewText", "«Fürchte dich nicht, denn ich bin bei dir.» – Jesaja 41,10 · Was macht dir heute Mut?")}</p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t("subscribe.firstName")} <span className="text-muted-foreground font-normal">{t("subscribe.firstNameOptional")}</span>
        </label>
        <Input placeholder={t("subscribe.firstNamePlaceholder")} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background" maxLength={50} />
        <p className="text-xs text-muted-foreground mt-1">{t("subscribe.firstNameHint")}</p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-foreground mb-2">{t("subscribe.channelLabel")}</label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer min-h-[100px] ${
                selectedChannel === ch.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <ch.icon className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 ${selectedChannel === ch.id ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs sm:text-sm font-semibold ${selectedChannel === ch.id ? "text-foreground" : "text-muted-foreground"}`}>{ch.label}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-snug line-clamp-2">{ch.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedChannel === "sms" && (
        <div className="mb-5 animate-fade-up">
          <label className="block text-sm font-medium text-foreground mb-1.5">{t("subscribe.phoneLabel")}</label>
          <Input type="tel" placeholder={t("subscribe.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background" maxLength={20} />
          <p className="text-xs text-muted-foreground mt-1">{t("subscribe.phoneHint")}</p>
        </div>
      )}

      {selectedChannel === "telegram" && (
        <div className="mb-5 animate-fade-up p-4 rounded-xl bg-telegram/10 border border-telegram/20">
          <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t("subscribe.telegramHint") }} />
        </div>
      )}

      {selectedChannel === "push" && (
        <div className="mb-5 animate-fade-up p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">{t("subscribe.pushHint")}</p>
        </div>
      )}

      <Button onClick={handleSubscribe} disabled={!selectedChannel || isLoading || (selectedChannel === "sms" && phone.length < 8)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base" size="lg">
        {isLoading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("subscribe.submitting")}</>
        ) : (
          <><Bell className="h-4 w-4 mr-2" />{t("subscribe.submit")}</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3">{t("subscribe.footNote")}</p>
    </div>
  );
}

export default DailySubscribe;

import { useState } from "react";
import { Bell, Send, Phone, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = "BLMl5bBRzhlza0ozrHEblp3BfKtbyDsbOP-n120rl6teGPFdoyFb77P9WnOZpbFs2hKyfwILmw8WQebJrp_qc7c";

const SUBSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-daily`;
const TELEGRAM_LINK = "https://t.me/BibelBot_ch_bot";

type Channel = "push" | "sms" | "telegram";

const CHANNELS: { id: Channel; label: string; icon: typeof Bell; desc: string }[] = [
  { id: "push", label: "Push", icon: Bell, desc: "Browser-Benachrichtigung" },
  { id: "telegram", label: "Telegram", icon: Send, desc: "Nachricht via Telegram" },
  { id: "sms", label: "SMS", icon: Smartphone, desc: "SMS auf dein Handy" },
];

export function DailySubscribe() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedChannel) return;

    setIsLoading(true);
    try {
      if (selectedChannel === "telegram") {
        window.open(TELEGRAM_LINK, "_blank");
        toast({
          title: "Telegram geöffnet 🙏",
          description: "Starte den Bot und schreibe /daily um den täglichen Impuls zu aktivieren.",
        });
        setIsSuccess(true);
        return;
      }

      let pushSubscription: PushSubscription | null = null;

      if (selectedChannel === "push") {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
          toast({
            title: "Nicht unterstützt",
            description: "Dein Browser unterstützt keine Push-Benachrichtigungen.",
            variant: "destructive",
          });
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast({
            title: "Berechtigung verweigert",
            description: "Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.",
            variant: "destructive",
          });
          return;
        }

        // Register service worker and get subscription
        const registration = await navigator.serviceWorker.register("/sw.js");
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
      }

      const body: Record<string, unknown> = { channel: selectedChannel };
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
        throw new Error(data.error || "Fehler bei der Anmeldung");
      }

      toast({
        title: "Angemeldet! 🙏",
        description: data.message || "Du erhältst ab morgen deinen täglichen Impuls.",
      });
      setIsSuccess(true);
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Bitte versuche es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Du bist angemeldet! 🙏</h3>
        <p className="text-muted-foreground">
          Ab morgen um 07:00 Uhr erhältst du deinen persönlichen Bibelimpuls.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8">
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Täglicher Bibelimpuls
        </h3>
        <p className="text-muted-foreground">
          Jeden Morgen um 07:00 Uhr – ein Vers, ein Gedanke, ein guter Start.
        </p>
      </div>

      {/* Vorname */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Dein Vorname <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          placeholder="z.B. Thomas"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-background"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Damit wir dich persönlich begrüssen können.
        </p>
      </div>

      {/* Kanal-Auswahl */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-foreground mb-2">
          Wie möchtest du den Impuls erhalten?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                selectedChannel === ch.id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <ch.icon
                className={`h-6 w-6 ${
                  selectedChannel === ch.id ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  selectedChannel === ch.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {ch.label}
              </span>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {ch.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SMS: Telefonnummer */}
      {selectedChannel === "sms" && (
        <div className="mb-5 animate-fade-up">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Handynummer
          </label>
          <Input
            type="tel"
            placeholder="+41 79 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-background"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Mit Ländervorwahl, z.B. +41 für die Schweiz.
          </p>
        </div>
      )}

      {/* Telegram Hinweis */}
      {selectedChannel === "telegram" && (
        <div className="mb-5 animate-fade-up p-4 rounded-xl bg-telegram/10 border border-telegram/20">
          <p className="text-sm text-foreground">
            Klicke auf «Anmelden» – du wirst zu Telegram weitergeleitet. 
            Starte dort den Bot und schreibe <strong>/daily</strong>, um den täglichen Impuls zu aktivieren.
          </p>
        </div>
      )}

      {/* Push Hinweis */}
      {selectedChannel === "push" && (
        <div className="mb-5 animate-fade-up p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            Nach dem Klick auf «Anmelden» fragt dein Browser nach der Berechtigung für Benachrichtigungen. 
            Bitte erlaube sie, um den Impuls zu erhalten.
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubscribe}
        disabled={!selectedChannel || isLoading || (selectedChannel === "sms" && phone.length < 8)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Wird angemeldet...
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Anmelden
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Kein Login nötig. Jederzeit abbestellbar.
      </p>
    </div>
  );
}

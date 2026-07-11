import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Clock, MapPin, Heart, CloudRain, CalendarDays, Plus, Trash2,
  Sparkle, Bell, BellRing, CalendarClock, Mic, Square, Loader2, Gift,
  Share2, RotateCcw, Check, Copy,
} from "lucide-react";
import { useUserPushSubscription } from "@/hooks/use-user-push-subscription";

import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  useBibleMoments,
  useCreateBibleMoment,
  useUpdateBibleMoment,
  useDeleteBibleMoment,
  type BibleMoment,
  type BibleMomentTrigger,
} from "@/hooks/use-bible-moments";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseGermanDate, extractPersonName, cleanEventLabel } from "@/lib/parse-german-date";

type TriggerType = BibleMomentTrigger | "birthday";

const TRIGGERS: Array<{
  type: TriggerType;
  icon: typeof Clock;
  title: string;
  desc: string;
  defaultConfig: Record<string, any>;
  defaultLabel: string;
}> = [
  {
    type: "time",
    icon: Clock,
    title: "Zeit-Moment",
    desc: "Ein Vers zu einer festen Uhrzeit — Aufwachen, Mittagspause, Feierabend.",
    defaultLabel: "Morgen-Impuls",
    defaultConfig: { time: "07:30", days: [1, 2, 3, 4, 5, 6, 0] },
  },
  {
    type: "mood",
    icon: Heart,
    title: "Stimmungs-Moment",
    desc: "Nach deinem täglichen Mood-Check kommt der passende Vers.",
    defaultLabel: "Stimmungs-Vers",
    defaultConfig: { moods: ["schwer", "suchend"] },
  },
  {
    type: "birthday",
    icon: Gift,
    title: "Geburtstag (Andere)",
    desc: "Erfasse Geburtstage von Familie & Freunden — verschick einen persönlichen Bibelgruss auf Knopfdruck.",
    defaultLabel: "Geburtstag",
    defaultConfig: { recipient_name: "", date: "", relationship: "" },
  },
  {
    type: "calendar",
    icon: CalendarClock,
    title: "Kalender-Termin",
    desc: "Trag Termine ein — Prüfung, Beerdigung, Predigt — und bekomm am Vortag einen stärkenden Vers.",
    defaultLabel: "Wichtiger Termin",
    defaultConfig: { event: "", date: "", lead_hours: 20 },
  },
  {
    type: "location",
    icon: MapPin,
    title: "Orts-Moment",
    desc: "Wenn du zuhause, bei der Arbeit oder in der Kirche ankommst.",
    defaultLabel: "Zuhause angekommen",
    defaultConfig: { place: "home" },
  },
  {
    type: "weather",
    icon: CloudRain,
    title: "Wetter-Moment",
    desc: "Regen, Sonne, erster Schnee — passende Psalmen zum Moment.",
    defaultLabel: "Regen-Trost",
    defaultConfig: { condition: "rain" },
  },
  {
    type: "event",
    icon: CalendarDays,
    title: "Ereignis-Moment",
    desc: "Geburtstage, Jahrestage oder selbst gesetzte schwere Tage.",
    defaultLabel: "Jahrestag",
    defaultConfig: { date: "" },
  },
];

function TriggerIcon({ type, className }: { type: string; className?: string }) {
  const meta = TRIGGERS.find((t) => t.type === type);
  const Icon = meta?.icon ?? Sparkle;
  return <Icon className={className} />;
}

function VoiceCapture({
  onTranscript,
  label = "Einsprechen",
}: {
  onTranscript: (text: string) => void;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        if (blob.size < 800) { setState("idle"); toast.info("Zu kurz — bitte nochmals versuchen"); return; }
        setState("transcribing");
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          fd.append("language", "de");
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
            {
              method: "POST",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: fd,
            },
          );
          if (!resp.ok) throw new Error("stt_failed");
          const data = await resp.json();
          const text = String(data?.text ?? "").trim();
          if (text) onTranscript(text);
          else toast.info("Nichts erkannt — bitte nochmals versuchen");
        } catch {
          toast.error("Sprach-Erkennung fehlgeschlagen");
        } finally {
          setState("idle");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setState("recording");
    } catch {
      toast.error("Kein Mikrofon-Zugriff");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  if (state === "transcribing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> übersetze…
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={state === "recording" ? "default" : "outline"}
      className="h-8 gap-1.5"
      onClick={state === "recording" ? stop : start}
    >
      {state === "recording" ? (
        <>
          <Square className="h-3.5 w-3.5 fill-current" /> Stopp
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </Button>
  );
}

const CHANNELS = [
  { value: "inapp", label: "In der App" },
  { value: "push", label: "Push-Benachrichtigung" },
  { value: "email", label: "E-Mail" },
  { value: "telegram", label: "Telegram" },
];

function formatDateHuman(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("de-CH", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function ShareGreetingDialog({ moment }: { moment: BibleMoment }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState<{
    title: string; verse: string; reflection: string; share_text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const cfg = (moment.config as any) ?? {};
  const recipient = cfg.recipient_name || moment.label || "";

  async function generate() {
    setLoading(true);
    setGreeting(null);
    try {
      const { data, error } = await supabase.functions.invoke("bible-greeting", {
        body: {
          recipient_name: recipient,
          occasion: cfg.occasion || "Geburtstag",
          relationship: cfg.relationship || "",
          language: moment.language || "de",
        },
      });
      if (error) throw error;
      setGreeting(data as any);
    } catch (e: any) {
      toast.error("Konnte Gruss nicht generieren");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!greeting) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: greeting.title,
          text: greeting.share_text,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(greeting.share_text);
      setCopied(true);
      toast.success("Gruss kopiert");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopy() {
    if (!greeting) return;
    await navigator.clipboard.writeText(greeting.share_text);
    setCopied(true);
    toast.success("In Zwischenablage kopiert");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !greeting) generate(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Bibelgruss
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Gruss für {recipient || "…"}
          </DialogTitle>
          <DialogDescription>
            Persönlicher Bibelvers mit warmer Segenszeile — zum Teilen per WhatsApp, SMS oder Email.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Gruss wird geschrieben…
          </div>
        )}

        {greeting && !loading && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-primary/5 p-4">
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {greeting.share_text}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleShare} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Teilen
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Kopieren
              </Button>
              <Button size="sm" variant="ghost" onClick={generate} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Neu generieren
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MomentCard({ moment }: { moment: BibleMoment }) {
  const update = useUpdateBibleMoment();
  const del = useDeleteBibleMoment();
  const meta = TRIGGERS.find((t) => t.type === moment.trigger_type);
  const cfg = (moment.config as any) ?? {};
  const isBirthday = moment.trigger_type === ("birthday" as any);

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TriggerIcon type={moment.trigger_type} className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{moment.label || meta?.title}</CardTitle>
            <CardDescription className="text-sm mt-0.5 line-clamp-2">
              {isBirthday && cfg.recipient_name
                ? `Für ${cfg.recipient_name}${cfg.date ? ` · ${formatDateHuman(cfg.date)}` : ""}`
                : meta?.desc}
            </CardDescription>
          </div>
          <Switch
            checked={moment.active}
            onCheckedChange={(v) => update.mutate({ id: moment.id, active: v })}
            aria-label="Moment aktivieren"
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-5 pb-4 md:pb-5 pt-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">
            {CHANNELS.find((c) => c.value === moment.delivery_channel)?.label ?? moment.delivery_channel}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5">
            Ruhezeit {String(moment.quiet_hours_start).padStart(2, "0")}:00–{String(moment.quiet_hours_end).padStart(2, "0")}:00
          </span>
          {moment.trigger_type === "time" && cfg.time && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">
              {cfg.time}
            </span>
          )}
          {(moment.trigger_type === "calendar" || isBirthday) && cfg.date && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">
              {formatDateHuman(cfg.date)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          {isBirthday ? <ShareGreetingDialog moment={moment} /> : <span />}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Diesen Moment wirklich löschen?")) del.mutate(moment.id);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Löschen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddMomentDialog() {
  const [open, setOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<TriggerType>("time");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:30");
  const [channel, setChannel] = useState<string>("inapp");
  const create = useCreateBibleMoment();

  const [calEvent, setCalEvent] = useState("");
  const [calDate, setCalDate] = useState("");

  const [bdayName, setBdayName] = useState("");
  const [bdayDate, setBdayDate] = useState("");
  const [bdayRelation, setBdayRelation] = useState("");

  const [lastParsed, setLastParsed] = useState<string | null>(null);

  const meta = TRIGGERS.find((t) => t.type === triggerType);

  function resetForm() {
    setLabel("");
    setCalEvent("");
    setCalDate("");
    setBdayName("");
    setBdayDate("");
    setBdayRelation("");
    setLastParsed(null);
  }

  function handleVoiceForCalendar(text: string) {
    const parsed = parseGermanDate(text);
    if (parsed.date) {
      setCalDate(parsed.date);
      setLastParsed(`📅 Datum erkannt: ${formatDateHuman(parsed.date)}`);
    } else {
      setLastParsed("⚠️ Kein Datum erkannt — bitte manuell eintragen");
    }
    const evt = cleanEventLabel(parsed.cleanedText || text);
    if (evt) setCalEvent((prev) => (prev ? `${prev} ${evt}`.trim() : evt));
  }

  function handleVoiceForBirthday(text: string) {
    const parsed = parseGermanDate(text);
    const name = extractPersonName(parsed.cleanedText || text);
    const notes: string[] = [];
    if (parsed.date) {
      setBdayDate(parsed.date);
      notes.push(`📅 ${formatDateHuman(parsed.date)}`);
    }
    if (name) {
      setBdayName(name);
      notes.push(`👤 ${name}`);
    }
    setLastParsed(notes.length ? `Erkannt: ${notes.join(" · ")}` : "⚠️ Nichts eindeutig erkannt — bitte manuell eintragen");
  }

  function handleCreate() {
    const finalLabel = label.trim() || meta?.defaultLabel || "Bible Moment";
    const config: Record<string, any> = { ...(meta?.defaultConfig ?? {}) };

    if (triggerType === "time") config.time = time;

    if (triggerType === "calendar") {
      if (!calDate) { toast.error("Bitte ein Datum wählen"); return; }
      config.event = calEvent.trim();
      config.date = calDate;
    }

    if (triggerType === "birthday") {
      if (!bdayName.trim()) { toast.error("Bitte einen Namen eingeben"); return; }
      if (!bdayDate) { toast.error("Bitte ein Datum wählen"); return; }
      config.recipient_name = bdayName.trim();
      config.date = bdayDate;
      config.relationship = bdayRelation.trim();
      config.occasion = "Geburtstag";
    }

    // Store birthday as calendar trigger under the hood — the dispatcher already
    // knows calendar; the config.recipient_name marks it as a shareable greeting.
    const persistedTrigger: BibleMomentTrigger =
      triggerType === "birthday" ? "calendar" : (triggerType as BibleMomentTrigger);

    create.mutate(
      {
        trigger_type: persistedTrigger,
        label: triggerType === "birthday" ? `Geburtstag: ${bdayName.trim()}` : finalLabel,
        config,
        delivery_channel: channel as any,
      },
      {
        onSuccess: () => {
          toast.success("Bible Moment angelegt");
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Neuen Moment anlegen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Neuer Bible Moment</DialogTitle>
          <DialogDescription>
            Wähle einen Auslöser. Momente sind privat, jederzeit pausierbar und respektieren deine Ruhezeit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {TRIGGERS.map((t) => {
              const Icon = t.icon;
              const active = triggerType === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => { setTriggerType(t.type); setLastParsed(null); }}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{t.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                </button>
              );
            })}
          </div>

          {triggerType !== "birthday" && (
            <div className="space-y-2">
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                placeholder={meta?.defaultLabel}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          )}

          {triggerType === "time" && (
            <div className="space-y-2">
              <Label htmlFor="time">Uhrzeit</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          )}

          {triggerType === "calendar" && (
            <div className="space-y-3 rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="cal-event">Termin / Anlass</Label>
                  <VoiceCapture onTranscript={handleVoiceForCalendar} label="Einsprechen" />
                </div>
                <Input
                  id="cal-event"
                  placeholder='z.B. "am 15. November Prüfung" — oder einsprechen'
                  value={calEvent}
                  onChange={(e) => setCalEvent(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-date">Datum</Label>
                <Input id="cal-date" type="date" value={calDate} onChange={(e) => setCalDate(e.target.value)} />
              </div>
              {lastParsed && (
                <div className="flex items-start justify-between gap-2 text-xs bg-background/60 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">{lastParsed}</span>
                  <button
                    type="button"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                    onClick={() => { setCalEvent(""); setCalDate(""); setLastParsed(null); }}
                  >
                    <RotateCcw className="h-3 w-3" /> Zurücksetzen
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Du bekommst am Vortag einen passenden Vers. Datumsangaben wie „15. November", „fünfzehnter November", „15.11." oder „morgen" werden automatisch erkannt.
              </p>
            </div>
          )}

          {triggerType === "birthday" && (
            <div className="space-y-3 rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="bday-name">Name & Datum</Label>
                  <VoiceCapture onTranscript={handleVoiceForBirthday} label="Einsprechen" />
                </div>
                <Input
                  id="bday-name"
                  placeholder='z.B. "Anna am 15. November" oder "Papa am 3.4."'
                  value={bdayName}
                  onChange={(e) => setBdayName(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="bday-date">Datum</Label>
                  <Input id="bday-date" type="date" value={bdayDate} onChange={(e) => setBdayDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bday-rel">Beziehung (optional)</Label>
                  <Input
                    id="bday-rel"
                    placeholder="Mutter, Freund…"
                    value={bdayRelation}
                    onChange={(e) => setBdayRelation(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
              {lastParsed && (
                <div className="flex items-start justify-between gap-2 text-xs bg-background/60 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">{lastParsed}</span>
                  <button
                    type="button"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                    onClick={() => { setBdayName(""); setBdayDate(""); setBdayRelation(""); setLastParsed(null); }}
                  >
                    <RotateCcw className="h-3 w-3" /> Zurücksetzen
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Am Geburtstag bekommst du eine Erinnerung mit persönlichem Bibelgruss — direkt teilbar per WhatsApp, SMS oder Email.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Kanal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(triggerType === "location" || triggerType === "weather" || triggerType === "event") && (
            <p className="text-xs text-muted-foreground rounded-md bg-muted/60 p-3">
              Feineinstellungen für diesen Trigger folgen im nächsten Update — dein Moment ist trotzdem angelegt und wartet startklar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? "Speichern…" : "Moment anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BibleMoments() {
  const { data: moments = [], isLoading } = useBibleMoments();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SEOHead
        titleKey="bibleMoments.title"
        descKey="bibleMoments.subtitle"
        path="/mein-bereich/momente"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to="/mein-bereich"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Mein Bereich
          </Link>
          <h1 className="font-display text-3xl md:text-4xl mt-2">
            Bible <em className="text-primary not-italic md:italic">Moments</em>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Präsenz zur richtigen Zeit. BibleBot findet für dich die Momente — durch Zeit, Ort, Stimmung, Wetter, Ereignis oder Geburtstag — und sendet einen passenden Vers mit einem kurzen Impuls.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 md:p-6 shadow-elegant">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl">Deine Momente</h2>
            <p className="text-xs text-muted-foreground">
              {moments.length === 0 ? "Noch keine Momente angelegt." : `${moments.length} Moment${moments.length === 1 ? "" : "e"}`}
            </p>
          </div>
          <AddMomentDialog />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Lädt…</div>
        ) : moments.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Sparkle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Leg deinen ersten Moment an — Morgen-Impuls, Trost-Vers bei schwerer Stimmung, oder ein Geburtstag mit persönlichem Bibelgruss.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {moments.map((m) => (
              <MomentCard key={m.id} moment={m} />
            ))}
          </div>
        )}
      </div>

      <PushEnableCard />

      <div className="rounded-2xl border border-dashed p-4 md:p-6 text-sm text-muted-foreground">
        <strong className="text-foreground">Datenschutz zuerst.</strong> Orts-Trigger prüfen dein Gerät nur clientseitig — Koordinaten werden nie gespeichert. Alle Momente sind privat und jederzeit pausierbar.
      </div>
    </div>
  );
}

function PushEnableCard() {
  const { status, isSubscribing, subscribe } = useUserPushSubscription();
  if (status === "unsupported") return null;
  const enabled = status === "subscribed";
  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 md:p-6 shadow-elegant flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {enabled ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg">Push-Benachrichtigungen</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {enabled
            ? "Aktiv — deine Momente kommen als sanfte Push-Benachrichtigung auf dieses Gerät."
            : "Aktiviere Push, damit deine Bible Moments dich direkt auf diesem Gerät erreichen."}
        </p>
        {status === "denied" && (
          <p className="text-xs text-destructive mt-2">Berechtigung wurde abgelehnt. Aktiviere Benachrichtigungen in den Browser-Einstellungen.</p>
        )}
      </div>
      {!enabled && (
        <Button onClick={subscribe} disabled={isSubscribing} size="sm">
          {isSubscribing ? "Aktiviere…" : "Aktivieren"}
        </Button>
      )}
    </div>
  );
}

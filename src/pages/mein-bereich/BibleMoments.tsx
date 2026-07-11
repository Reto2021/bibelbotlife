import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Heart, CloudRain, CalendarDays, Plus, Trash2, Sparkle, Bell, BellRing, CalendarClock } from "lucide-react";
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

const TRIGGERS: Array<{
  type: BibleMomentTrigger;
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
  {
    type: "calendar",
    icon: CalendarClock,
    title: "Kalender-Termin",
    desc: "Trag Termine ein — Prüfung, Beerdigung, Predigt — und bekomm am Vortag einen stärkenden Vers.",
    defaultLabel: "Wichtiger Termin",
    defaultConfig: { event: "", date: "", lead_hours: 20 },
  },
];

function TriggerIcon({ type, className }: { type: BibleMomentTrigger; className?: string }) {
  const meta = TRIGGERS.find((t) => t.type === type);
  const Icon = meta?.icon ?? Sparkle;
  return <Icon className={className} />;
}

const CHANNELS = [
  { value: "inapp", label: "In der App" },
  { value: "push", label: "Push-Benachrichtigung" },
  { value: "email", label: "E-Mail" },
  { value: "telegram", label: "Telegram" },
];

function MomentCard({ moment }: { moment: BibleMoment }) {
  const update = useUpdateBibleMoment();
  const del = useDeleteBibleMoment();
  const meta = TRIGGERS.find((t) => t.type === moment.trigger_type);

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
              {meta?.desc}
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
          {moment.trigger_type === "time" && moment.config?.time && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">
              {moment.config.time}
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-end">
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
  const [triggerType, setTriggerType] = useState<BibleMomentTrigger>("time");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:30");
  const [channel, setChannel] = useState<string>("inapp");
  const create = useCreateBibleMoment();

  const meta = TRIGGERS.find((t) => t.type === triggerType);

  function handleCreate() {
    const finalLabel = label.trim() || meta?.defaultLabel || "Bible Moment";
    const config = { ...(meta?.defaultConfig ?? {}) };
    if (triggerType === "time") config.time = time;

    create.mutate(
      {
        trigger_type: triggerType,
        label: finalLabel,
        config,
        delivery_channel: channel as any,
      },
      {
        onSuccess: () => {
          toast.success("Bible Moment angelegt");
          setOpen(false);
          setLabel("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Neuen Moment anlegen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
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
                  onClick={() => setTriggerType(t.type)}
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

          <div className="space-y-2">
            <Label htmlFor="label">Name</Label>
            <Input
              id="label"
              placeholder={meta?.defaultLabel}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {triggerType === "time" && (
            <div className="space-y-2">
              <Label htmlFor="time">Uhrzeit</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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
            Präsenz zur richtigen Zeit. BibleBot findet für dich die Momente — durch Zeit, Ort, Stimmung, Wetter oder Ereignis — und sendet einen passenden Vers mit einem kurzen Impuls.
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
              Leg deinen ersten Moment an — zum Beispiel einen Morgen-Impuls um 07:30 oder einen Trost-Vers bei schwerer Stimmung.
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


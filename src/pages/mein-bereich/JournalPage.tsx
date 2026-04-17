import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil, Flame, Save } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import {
  useJournalEntries,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  calculateStreak,
  getDayOfYear,
  type JournalMood,
  type JournalEntry,
} from "@/hooks/use-journal";

const MOODS: JournalMood[] = [
  "dankbar",
  "hoffnungsvoll",
  "schwer",
  "suchend",
  "friedvoll",
  "unklar",
];

const MOOD_EMOJI: Record<JournalMood, string> = {
  dankbar: "🙏",
  hoffnungsvoll: "🌅",
  schwer: "🌧",
  suchend: "🔍",
  friedvoll: "☮️",
  unklar: "❓",
};

const PROMPT_COUNT = 30;

const isSameLocalDay = (iso: string, date = new Date()) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

const JournalPage = () => {
  const { t, i18n } = useTranslation();
  const { data: entries = [], isLoading } = useJournalEntries();
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Today's prompt — deterministic, same for all users on the same day
  const promptIndex = useMemo(() => getDayOfYear() % PROMPT_COUNT, []);
  const todayPrompt = useMemo(() => {
    const key = `journal.prompts.${promptIndex}`;
    const value = t(key);
    // Fallback to English prompts if not translated for current language
    if (value === key) {
      return t(`journal.prompts.${promptIndex}`, { lng: "en" });
    }
    return value;
  }, [t, promptIndex, i18n.language]);

  // Today's entry, if any
  const todayEntry = useMemo(
    () => entries.find((e) => isSameLocalDay(e.created_at)),
    [entries],
  );

  const pastEntries = useMemo(
    () => entries.filter((e) => !todayEntry || e.id !== todayEntry.id),
    [entries, todayEntry],
  );

  const streak = useMemo(() => calculateStreak(entries), [entries]);

  // When today's entry exists and we're not editing, prefill view
  useEffect(() => {
    if (todayEntry && !editingId) {
      setContent("");
      setMood(null);
    }
  }, [todayEntry, editingId]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error(t("journal.writePlaceholder"));
      return;
    }
    if (editingId) {
      await updateEntry.mutateAsync({ id: editingId, content, mood });
      setEditingId(null);
    } else {
      await createEntry.mutateAsync({
        content,
        prompt: todayPrompt,
        mood,
      });
    }
    setContent("");
    setMood(null);
    toast.success(t("journal.saved"));
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setContent(entry.content);
    setMood(entry.mood);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setContent("");
    setMood(null);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry.mutateAsync(id);
    toast.success(t("journal.saved"));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <SEOHead titleKey="journal.title" descKey="journal.subtitle" path="/mein-bereich/journal" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t("journal.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("journal.subtitle")}</p>
        </div>
        {streak > 0 && (
          <Badge variant="secondary" className="gap-1.5 shrink-0">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">
              {t("journal.streak", { count: streak })}
            </span>
          </Badge>
        )}
      </div>

      {/* Today's entry */}
      <Card className="bg-card/80 border-border">
        <CardHeader className="pb-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {t("journal.todayPrompt")}
          </div>
          <CardTitle className="text-base md:text-lg leading-snug font-medium">
            {todayPrompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayEntry && !editingId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {todayEntry.mood && (
                  <span className="text-lg">{MOOD_EMOJI[todayEntry.mood]}</span>
                )}
                <span className="text-muted-foreground">
                  {format(new Date(todayEntry.created_at), "HH:mm")}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                {todayEntry.content}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(todayEntry)}>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  {t("journal.edit")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="text-sm font-medium mb-2">{t("journal.moodLabel")}</div>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(mood === m ? null : m)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        mood === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      {t(`journal.moods.${m}`)}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("journal.writePlaceholder")}
                className="min-h-[120px] resize-y"
                rows={5}
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={createEntry.isPending || updateEntry.isPending || !content.trim()}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {t("journal.save")}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={cancelEdit}>
                    {t("journal.delete") /* cancel reuse */}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("journal.history")}</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">…</div>
        ) : pastEntries.length === 0 ? (
          <Card className="bg-card/60 border-dashed border-border">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("journal.noEntries")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pastEntries.map((entry) => {
              const expanded = expandedId === entry.id;
              const preview =
                entry.content.length > 100
                  ? entry.content.slice(0, 100) + "…"
                  : entry.content;
              return (
                <Card
                  key={entry.id}
                  className="bg-card/80 border-border transition-colors"
                >
                  <CardContent className="p-3 md:p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.mood && (
                            <span className="text-base leading-none">
                              {MOOD_EMOJI[entry.mood]}
                            </span>
                          )}
                          <span>{format(new Date(entry.created_at), "dd.MM.yyyy")}</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {expanded ? entry.content : preview}
                      </p>
                      {!expanded && entry.content.length > 100 && (
                        <span className="text-xs text-primary mt-1 inline-block">
                          {t("journal.readMore")}
                        </span>
                      )}
                    </button>
                    {expanded && (
                      <div className="flex justify-end mt-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              {t("journal.delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("journal.deleteConfirm")}</AlertDialogTitle>
                              <AlertDialogDescription>{entry.content.slice(0, 120)}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("journal.edit") /* cancel */}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                {t("journal.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalPage;

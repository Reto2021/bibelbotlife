import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { openBibelBotChat } from "@/lib/chat-events";
import { useTrack } from "@/components/AnalyticsProvider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowRight, RotateCcw, Sparkles, X, Save, History, Trash2, ChevronLeft } from "lucide-react";

type AreaKey = "health" | "relationships" | "career" | "spirituality" | "finances" | "family" | "leisure" | "growth";

const AREAS: { key: AreaKey; emoji: string }[] = [
  { key: "health", emoji: "💪" },
  { key: "relationships", emoji: "❤️" },
  { key: "career", emoji: "💼" },
  { key: "spirituality", emoji: "✝️" },
  { key: "finances", emoji: "💰" },
  { key: "family", emoji: "👨‍👩‍👧‍👦" },
  { key: "leisure", emoji: "🎨" },
  { key: "growth", emoji: "🌱" },
];

type Step = "intro" | "sliders" | "result" | "history";

interface SavedResult {
  id: string;
  date: string;
  scores: Record<AreaKey, number>;
  average: string;
}

const STORAGE_KEY = "biblebot-lifewheel-history";

function loadHistory(): SavedResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(results: SavedResult[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, 20)));
}

export function LifeWheel() {
  return null; // unused standalone, LifeWheelProvider handles it
}

/** Imperative open trigger */
let openFn: (() => void) | null = null;
export function openLifeWheel() { openFn?.(); }

export function LifeWheelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  openFn = () => setOpen(true);

  return (
    <>
      {children}
      {open && <LifeWheelInner onClose={() => setOpen(false)} />}
    </>
  );
}

function LifeWheelInner({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { track } = useTrack();
  const [step, setStep] = useState<Step>("intro");
  const [scores, setScores] = useState<Record<AreaKey, number>>(
    () => Object.fromEntries(AREAS.map(a => [a.key, 5])) as Record<AreaKey, number>
  );
  const [history, setHistory] = useState<SavedResult[]>(loadHistory);
  const [selectedHistory, setSelectedHistory] = useState<SavedResult | null>(null);
  const [saved, setSaved] = useState(false);

  const chartData = useMemo(
    () => AREAS.map(a => ({
      area: t(`lifeWheel.areas.${a.key}`),
      value: scores[a.key],
      fullMark: 10,
    })),
    [scores, t]
  );

  const weakest = useMemo(() => {
    let min = 11;
    let minKey: AreaKey = "health";
    for (const a of AREAS) {
      if (scores[a.key] < min) {
        min = scores[a.key];
        minKey = a.key;
      }
    }
    return minKey;
  }, [scores]);

  const average = useMemo(
    () => (Object.values(scores).reduce((a, b) => a + b, 0) / AREAS.length).toFixed(1),
    [scores]
  );

  const handleReset = () => {
    setScores(Object.fromEntries(AREAS.map(a => [a.key, 5])) as Record<AreaKey, number>);
    setStep("intro");
    setSaved(false);
  };

  const handleGetImpulse = () => {
    const areaName = t(`lifeWheel.areas.${weakest}`);
    const prompt = t("lifeWheel.prompt", { area: areaName, score: scores[weakest] });
    track("lifewheel_complete", { weakest, scores, average: parseFloat(average) });
    onClose();
    setTimeout(() => openBibelBotChat(prompt), 300);
  };

  const handleSave = () => {
    const entry: SavedResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      scores: { ...scores },
      average,
    };
    const updated = [entry, ...history];
    setHistory(updated);
    saveHistory(updated);
    setSaved(true);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleViewHistory = (entry: SavedResult) => {
    setSelectedHistory(entry);
  };

  const historyChartData = useMemo(() => {
    if (!selectedHistory) return [];
    return AREAS.map(a => ({
      area: t(`lifeWheel.areas.${a.key}`),
      value: selectedHistory.scores[a.key],
      fullMark: 10,
    }));
  }, [selectedHistory, t]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            🎡 {t("lifeWheel.title")}
          </h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && step !== "history" && (
              <button
                onClick={() => { setSelectedHistory(null); setStep("history"); }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title={t("lifeWheel.history")}
              >
                <History className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-5"
              >
                <p className="text-muted-foreground leading-relaxed">
                  {t("lifeWheel.intro")}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {AREAS.map(a => (
                    <div key={a.key} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50">
                      <span className="text-2xl">{a.emoji}</span>
                      <span className="text-xs text-muted-foreground text-center leading-tight">
                        {t(`lifeWheel.areas.${a.key}`)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStep("sliders")} className="w-full" size="lg">
                  {t("lifeWheel.start")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === "sliders" && (
              <motion.div
                key="sliders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <p className="text-sm text-muted-foreground text-center">
                  {t("lifeWheel.sliderHint")}
                </p>
                <div className="space-y-4">
                  {AREAS.map((a, i) => (
                    <motion.div
                      key={a.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <span>{a.emoji}</span>
                          {t(`lifeWheel.areas.${a.key}`)}
                        </label>
                        <span className={cn(
                          "text-sm font-bold tabular-nums w-6 text-right",
                          scores[a.key] <= 3 ? "text-destructive" :
                          scores[a.key] <= 6 ? "text-primary" : "text-secondary"
                        )}>
                          {scores[a.key]}
                        </span>
                      </div>
                      <Slider
                        value={[scores[a.key]]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={([v]) =>
                          setScores(prev => ({ ...prev, [a.key]: v }))
                        }
                        className="w-full"
                      />
                    </motion.div>
                  ))}
                </div>
                <Button onClick={() => setStep("result")} className="w-full" size="lg">
                  {t("lifeWheel.showResult")}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
              >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="area"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t("lifeWheel.average")}</span>
                    <span className="font-bold text-foreground">{average}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t("lifeWheel.weakestArea")}</span>
                    <span className="font-bold text-destructive flex items-center gap-1">
                      {AREAS.find(a => a.key === weakest)?.emoji} {t(`lifeWheel.areas.${weakest}`)} ({scores[weakest]}/10)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleGetImpulse} className="w-full" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("lifeWheel.getImpulse", { area: t(`lifeWheel.areas.${weakest}`) })}
                  </Button>
                  {!saved ? (
                    <Button onClick={handleSave} variant="secondary" className="w-full" size="sm">
                      <Save className="mr-2 h-3 w-3" />
                      {t("lifeWheel.save")}
                    </Button>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">✅ {t("lifeWheel.saved")}</p>
                  )}
                  <Button onClick={handleReset} variant="outline" className="w-full" size="sm">
                    <RotateCcw className="mr-2 h-3 w-3" />
                    {t("lifeWheel.reset")}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Button onClick={() => { setSelectedHistory(null); setStep("intro"); }} variant="ghost" size="sm" className="mb-2">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("lifeWheel.backToNew")}
                </Button>

                {selectedHistory ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedHistory.date} · ⌀ {selectedHistory.average}/10
                    </p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={historyChartData} cx="50%" cy="50%" outerRadius="75%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="area"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Radar
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.25}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1">
                      {AREAS.map(a => (
                        <div key={a.key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{a.emoji} {t(`lifeWheel.areas.${a.key}`)}</span>
                          <span className="font-medium">{selectedHistory.scores[a.key]}/10</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setSelectedHistory(null)} variant="outline" size="sm" className="w-full">
                      <ChevronLeft className="mr-1 h-3 w-3" />
                      {t("lifeWheel.backToList")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{t("lifeWheel.history")}</h3>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">{t("lifeWheel.noHistory")}</p>
                    ) : (
                      history.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => handleViewHistory(entry)}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{entry.date}</p>
                            <p className="text-xs text-muted-foreground">⌀ {entry.average}/10</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

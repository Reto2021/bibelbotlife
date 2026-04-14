import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { Trophy, BookOpen, HelpCircle, Loader2, ChevronRight, Gauge, RotateCcw, Star, ArrowLeft, MessageCircle } from "lucide-react";
import { openBibleBotChat } from "@/lib/chat-events";
import { SiteHeader } from "@/components/SiteHeader";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type QuizMode = "multiple_choice" | "verse_guess";
type Difficulty = "easy" | "medium" | "hard";
const ROUND_SIZE = 10;

interface QuizQuestion {
  mode: QuizMode;
  question: string;
  options: string[];
  correct: string;
  correctIndex?: number;
  explanation?: string;
  reference: string;
  verse_text?: string;
  hint?: string;
  difficulty?: Difficulty;
}

interface AnswerRecord {
  reference: string;
  correct: boolean;
}

function getSessionId() {
  let id = localStorage.getItem("biblebot-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("biblebot-session", id);
  }
  return id;
}

interface HighscoreEntry {
  score: number;
  total_questions: number;
  quiz_mode: string;
  difficulty: string;
  created_at: string;
}

export default function BibleQuiz() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);

  const difficultyConfig: Record<Difficulty, { labelKey: string; emoji: string; descKey: string; color: string }> = {
    easy: { labelKey: "quiz.easy", emoji: "🟢", descKey: "quiz.easyDesc", color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" },
    medium: { labelKey: "quiz.medium", emoji: "🟡", descKey: "quiz.mediumDesc", color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" },
    hard: { labelKey: "quiz.hard", emoji: "🔴", descKey: "quiz.hardDesc", color: "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" },
  };

  useEffect(() => {
    supabase
      .from("quiz_scores")
      .select("score, total_questions, quiz_mode, difficulty, created_at")
      .gte("total_questions", ROUND_SIZE)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data) setHighscores(data);
      });
  }, [mode]);
  const [total, setTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [roundComplete, setRoundComplete] = useState(false);

  const fetchQuestion = useCallback(async (quizMode: QuizMode, diff: Difficulty) => {
    setLoading(true);
    setSelected(null);
    setShowResult(false);

    try {
      const { data, error } = await supabase.functions.invoke("bible-quiz", {
        body: { mode: quizMode, translation: "luther1912", difficulty: diff },
      });

      if (error) throw error;
      setQuestion(data as QuizQuestion);
    } catch (e) {
      console.error("Quiz fetch error:", e);
    }
    setLoading(false);
  }, []);

  function startGame(m: QuizMode) {
    setMode(m);
    setScore(0);
    setTotal(0);
    setAnswers([]);
    setRoundComplete(false);
    fetchQuestion(m, difficulty);
  }

  async function handleAnswer(option: string) {
    if (selected) return;
    setSelected(option);
    setShowResult(true);
    const newTotal = total + 1;
    const isCorrect = option === question?.correct;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setTotal(newTotal);
    setAnswers(prev => [...prev, { reference: question?.reference || "", correct: isCorrect }]);

    if (newTotal % 5 === 0) {
      await supabase.from("quiz_scores").insert({
        session_id: getSessionId(),
        quiz_mode: mode!,
        score: newScore,
        total_questions: newTotal,
        difficulty,
      } as any);
    }
  }

  function nextQuestion() {
    if (total >= ROUND_SIZE) {
      setRoundComplete(true);
      return;
    }
    fetchQuestion(mode!, difficulty);
  }

  const diffCfg = difficultyConfig[difficulty];

  // Mode selection screen
  if (!mode) {
    return (
      <>
        <SEOHead
          title={t("quiz.seoTitle")}
          description={t("quiz.seoDesc")}
        />
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <div className="container mx-auto max-w-lg px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-10">🧠 {t("quiz.title")}</h1>

            {/* Difficulty selector */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t("quiz.difficulty")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => {
                  const cfg = difficultyConfig[d];
                  const isActive = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-center transition-all",
                        isActive
                          ? cfg.color + " ring-1 ring-offset-1 ring-offset-background"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-lg block mb-0.5">{cfg.emoji}</span>
                      <span className={cn("text-sm font-semibold block", !isActive && "text-foreground")}>{t(cfg.labelKey)}</span>
                      <span className={cn("text-[11px] leading-tight block mt-0.5", !isActive && "text-muted-foreground")}>{t(cfg.descKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode selection */}
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className="p-6 cursor-pointer hover:border-primary/40 transition-all group"
                  onClick={() => startGame("multiple_choice")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground text-lg">{t("quiz.multipleChoice")}</h2>
                      <p className="text-muted-foreground text-sm">{t("quiz.multipleChoiceDesc")}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card
                  className="p-6 cursor-pointer hover:border-secondary/40 transition-all group"
                  onClick={() => startGame("verse_guess")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground text-lg">{t("quiz.verseGuess")}</h2>
                      <p className="text-muted-foreground text-sm">{t("quiz.verseGuessDesc")}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Highscores */}
            {highscores.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{t("quiz.highscores")}</h3>
                  </div>
                  <div className="space-y-2">
                    {highscores.map((hs, i) => {
                      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                      const pct = Math.round((hs.score / hs.total_questions) * 100);
                      const date = new Date(hs.created_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
                      const diffEmoji = hs.difficulty === "easy" ? "🟢" : hs.difficulty === "hard" ? "🔴" : "🟡";
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0 border-border">
                          <span className="w-6 text-center font-medium">{medal}</span>
                          <span className="font-bold text-foreground">{hs.score}/{hs.total_questions}</span>
                          <span className="text-muted-foreground">({pct}%)</span>
                          <span className="text-xs" title={t(`quiz.${hs.difficulty}`)}>{diffEmoji}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {hs.quiz_mode === "multiple_choice" ? "MC" : t("quiz.verseGuess")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{date}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Round summary screen
  if (roundComplete) {
    const pct = Math.round((score / ROUND_SIZE) * 100);
    const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🌟" : pct >= 50 ? "👍" : "💪";
    const message = pct >= 90 ? t("quiz.resultExcellent") : pct >= 70 ? t("quiz.resultGreat") : pct >= 50 ? t("quiz.resultGood") : t("quiz.resultKeepGoing");

    return (
      <>
        <SEOHead title={t("quiz.resultSeoTitle")} description={t("quiz.resultSeoDesc")} />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto max-w-lg px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Big result */}
              <Card className="p-8 text-center">
                <p className="text-5xl mb-3">{emoji}</p>
                <h2 className="text-2xl font-bold text-foreground mb-1">{message}</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {diffCfg.emoji} {t(diffCfg.labelKey)} · {mode === "multiple_choice" ? t("quiz.multipleChoice") : t("quiz.verseGuess")}
                </p>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{score}</p>
                    <p className="text-xs text-muted-foreground">{t("quiz.rightLabel")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-muted-foreground">{ROUND_SIZE - score}</p>
                    <p className="text-xs text-muted-foreground">{t("quiz.wrongLabel")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-foreground">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{t("quiz.percentLabel")}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </Card>

              {/* Answer list */}
              <Card className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-3">{t("quiz.yourAnswers")}</h3>
                <div className="space-y-1.5">
                  {answers.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span>{a.correct ? "✅" : "❌"}</span>
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="text-foreground truncate">{a.reference}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setMode(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> {t("quiz.menu")}
                </Button>
                <Button className="flex-1" onClick={() => startGame(mode!)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> {t("quiz.playAgain")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Quiz screen
  return (
    <>
      <SEOHead title={t("quiz.seoTitle")} description={t("quiz.seoDesc")} />
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-lg px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("quiz.back")}
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{score}/{total}</span>
              <Badge variant="outline" className="text-xs">
                {diffCfg.emoji} {t(diffCfg.labelKey)}
              </Badge>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t("quiz.question", { current: total + (showResult ? 0 : 1), total: ROUND_SIZE })}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(total / ROUND_SIZE) * 100}%` }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">{t("quiz.loading")}</p>
            </div>
          ) : question ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={question.reference}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Question */}
                <Card className="p-5">
                  {question.mode === "verse_guess" && question.hint && (
                    <Badge variant="outline" className="mb-3 text-xs">{question.hint}</Badge>
                  )}
                  <p className="text-foreground font-medium leading-relaxed text-base">
                    {question.mode === "verse_guess"
                      ? `„${question.question}"`
                      : question.question}
                  </p>
                  {question.mode === "verse_guess" && (
                    <p className="text-muted-foreground text-sm mt-2">{t("quiz.whichBook")}</p>
                  )}
                </Card>

                {/* Options */}
                <div className="space-y-2">
                  {question.options.map((opt, i) => {
                    const isCorrect = opt === question.correct;
                    const isSelected = opt === selected;
                    const showColors = showResult;

                    return (
                      <motion.button
                        key={opt}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selected}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all text-sm",
                          !showColors && "bg-card border-border hover:border-primary/40 cursor-pointer",
                          showColors && isCorrect && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-800 dark:text-emerald-200",
                          showColors && isSelected && !isCorrect && "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-800 dark:text-red-200",
                          showColors && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                        )}
                      >
                        <span className="font-medium text-primary/70">{String.fromCharCode(65 + i)}.</span> {opt.replace(/^[A-D]\)\s*/, "")}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Result */}
                {showResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={cn(
                      "p-4",
                      selected === question.correct
                        ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                    )}>
                      <p className="font-semibold text-sm mb-1">
                        {selected === question.correct ? t("quiz.correct") : t("quiz.wrong")}
                      </p>
                      {question.explanation && (
                        <p className="text-muted-foreground text-xs mb-2">{question.explanation}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        📖 {question.reference}
                        {question.verse_text && (
                          <span className="block mt-1 italic">„{question.verse_text}"</span>
                        )}
                      </p>
                    </Card>

                    <Button onClick={nextQuestion} className="w-full mt-4" size="lg">
                      {t("quiz.next")} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </>
  );
}
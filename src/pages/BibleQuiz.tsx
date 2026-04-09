import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Trophy, BookOpen, HelpCircle, Loader2, ChevronRight, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type QuizMode = "multiple_choice" | "verse_guess";
type Difficulty = "easy" | "medium" | "hard";

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

const difficultyConfig: Record<Difficulty, { label: string; emoji: string; desc: string; color: string }> = {
  easy: { label: "Leicht", emoji: "🟢", desc: "Bücher aus verschiedenen Teilen der Bibel", color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Mittel", emoji: "🟡", desc: "Bücher aus dem gleichen Testament", color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" },
  hard: { label: "Schwer", emoji: "🔴", desc: "Sehr ähnliche Bücher – für Kenner", color: "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" },
};

function getSessionId() {
  let id = localStorage.getItem("biblebot-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("biblebot-session", id);
  }
  return id;
}

export default function BibleQuiz() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);

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

    if (newTotal % 5 === 0) {
      await supabase.from("quiz_scores").insert({
        session_id: getSessionId(),
        quiz_mode: mode!,
        score: newScore,
        total_questions: newTotal,
      });
    }
  }

  function nextQuestion() {
    fetchQuestion(mode!, difficulty);
  }

  // Mode selection screen
  if (!mode) {
    return (
      <>
        <SEOHead
          title="Bibelquiz – Spielerisch lernen | BibleBot.Life"
          description="Teste dein Bibelwissen mit Multiple-Choice-Fragen und Vers-Raten."
        />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto max-w-lg px-4 py-8">
            <div className="flex items-center gap-3 mb-10">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">🧠 Bibelquiz</h1>
            </div>

            {/* Difficulty selector */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Schwierigkeitsgrad</span>
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
                      <span className={cn("text-sm font-semibold block", !isActive && "text-foreground")}>{cfg.label}</span>
                      <span className={cn("text-[11px] leading-tight block mt-0.5", !isActive && "text-muted-foreground")}>{cfg.desc}</span>
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
                      <h2 className="font-semibold text-foreground text-lg">Multiple Choice</h2>
                      <p className="text-muted-foreground text-sm">KI generiert Fragen zu Bibelversen</p>
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
                      <h2 className="font-semibold text-foreground text-lg">Vers erraten</h2>
                      <p className="text-muted-foreground text-sm">Welches Buch? Erkenne den Bibelvers</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const diffCfg = difficultyConfig[difficulty];

  // Quiz screen
  return (
    <>
      <SEOHead title="Bibelquiz | BibleBot.Life" description="Teste dein Bibelwissen!" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-lg px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{score}/{total}</span>
              <Badge variant="outline" className="text-xs">
                {diffCfg.emoji} {diffCfg.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {mode === "multiple_choice" ? "Multiple Choice" : "Vers erraten"}
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Frage wird generiert…</p>
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
                    <p className="text-muted-foreground text-sm mt-2">Aus welchem Buch stammt dieser Vers?</p>
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
                        <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
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
                        {selected === question.correct ? "✅ Richtig!" : "❌ Leider falsch"}
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
                      Nächste Frage <ChevronRight className="h-4 w-4 ml-1" />
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

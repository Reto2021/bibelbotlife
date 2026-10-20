import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle } from "lucide-react";
import leaImg from "@/assets/companions/lea.jpg";
import jonasImg from "@/assets/companions/jonas.jpg";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type CompanionPick = "lea" | "jonas";
const STORAGE_KEY = "bibelbot-companion";
const MAX_Q = 12;

const PEOPLE: Record<CompanionPick, { name: string; img: string }> = {
  lea: { name: "Lea", img: leaImg },
  jonas: { name: "Jonas", img: jonasImg },
};

function pickRandom<T>(arr: T[], n: number, seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}

export function CompanionHero({ onAsk }: { onAsk: (question: string) => void }) {
  const { t, i18n } = useTranslation();
  const [pick, setPick] = useState<CompanionPick>("lea");
  // seed 0 on server → first four questions; randomised after hydration
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "lea" || v === "jonas") setPick(v);
    } catch { /* storage unavailable */ }
    setSeed(Date.now() % 233280);
  }, []);

  const choose = (p: CompanionPick) => {
    setPick(p);
    setSeed((s) => s + 7);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
  };

  const questions = useMemo(() => {
    const pool: string[] = [];
    for (let n = 1; n <= MAX_Q; n++) {
      const key = `companion.${pick}.q${n}`;
      if (i18n.exists(key)) pool.push(t(key));
    }
    return seed === 0 ? pool.slice(0, 4) : pickRandom(pool, 4, seed);
  }, [pick, seed, t, i18n]);

  const tagline = t(`companion.${pick}.tagline`);
  const hello = t(`companion.${pick}.hello`);

  return (
    <div className="max-w-2xl mx-auto w-full mb-5">
      {/* Two large portrait cards */}
      <div className="grid grid-cols-2 gap-3 mb-3" role="radiogroup" aria-label={t("companion.choose")}>
        {(Object.keys(PEOPLE) as CompanionPick[]).map((id) => {
          const p = PEOPLE[id];
          const active = id === pick;
          return (
            <motion.button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(id)}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: active ? 1 : 0.96, opacity: active ? 1 : 0.7 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "relative aspect-[4/5] rounded-2xl overflow-hidden text-left transition-shadow",
                active ? "ring-2 ring-primary shadow-warm" : "ring-1 ring-border",
              )}
            >
              <img
                src={p.img}
                alt={t("companion.imgAlt", { name: p.name })}
                width={320}
                height={400}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
              <span className="absolute bottom-0 left-0 right-0 p-3">
                <span className="flex items-center gap-1.5 text-lg font-semibold text-background">
                  {active && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  {p.name}
                </span>
                <span className="block text-[11px] leading-tight text-background/85 line-clamp-2">
                  {t(`companion.${id}.tagline`)}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pick}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="relative bg-card border border-border rounded-2xl px-4 py-3 shadow-warm text-left"
        >
          <span
            className={cn(
              "absolute -top-2 h-4 w-4 rotate-45 bg-card border-l border-t border-border",
              pick === "lea" ? "left-[22%]" : "right-[22%]",
            )}
          />
          <p className="sr-only">{tagline}</p>
          <p className="text-base text-foreground leading-snug">{hello}</p>
        </motion.div>
      </AnimatePresence>

      {/* One-tap curiosity questions, rotating */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((q, i) => (
          <motion.button
            key={`${pick}-${seed}-${q}`}
            type="button"
            onClick={() => onAsk(q)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 * i }}
            whileTap={{ scale: 0.98 }}
            className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground"
          >
            «{q}»
          </motion.button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{t("companion.footer")}</p>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 13)}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/10"
        >
          <Shuffle className="h-3.5 w-3.5" />
          {t("companion.more", { defaultValue: "↻" })}
        </button>
      </div>
    </div>
  );
}

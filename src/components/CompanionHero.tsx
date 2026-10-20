import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import leaImg from "@/assets/companions/lea.jpg";
import jonasImg from "@/assets/companions/jonas.jpg";
import { cn } from "@/lib/utils";

export type CompanionPick = "lea" | "jonas";
const STORAGE_KEY = "bibelbot-companion";

const PEOPLE: Record<CompanionPick, { name: string; img: string; tagline: string; hello: string; questions: string[] }> = {
  lea: {
    name: "Lea",
    img: leaImg,
    tagline: "34, Pflegefachfrau · hört zuerst zu",
    hello: "Hoi, ich bin Lea. Ich glaube – auch ohne Kirche. Was trägst du heute mit dir herum?",
    questions: [
      "Kann man glauben, ohne in eine Kirche zu gehen?",
      "Ich fühle mich leer. Wo finde ich Halt?",
      "Wie bete ich, wenn ich nicht weiss wie?",
      "Gott hat mich enttäuscht. Darf ich das sagen?",
    ],
  },
  jonas: {
    name: "Jonas",
    img: jonasImg,
    tagline: "41 · direkt, ehrlich, ohne Moralkeule",
    hello: "Salü, ich bin Jonas. Ich bin lange vor Gott davongelaufen. Frag mich, was du sonst für dich behältst.",
    questions: [
      "Ich zweifle an allem. Ist das schlimm?",
      "Was sagt die Bibel wirklich über Sex?",
      "Wie werde ich Schuld los, die mich verfolgt?",
      "Ist die Bibel nicht einfach ein altes Märchenbuch?",
    ],
  },
};

export function CompanionHero({ onAsk }: { onAsk: (question: string) => void }) {
  const [pick, setPick] = useState<CompanionPick>("lea");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "lea" || v === "jonas") setPick(v);
    } catch { /* storage unavailable */ }
  }, []);

  const choose = (p: CompanionPick) => {
    setPick(p);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
  };

  const person = PEOPLE[pick];

  return (
    <div className="max-w-2xl mx-auto w-full mb-5">
      {/* Choose your companion */}
      <div className="flex justify-center gap-4 mb-4" role="radiogroup" aria-label="Wer soll dich begleiten?">
        {(Object.keys(PEOPLE) as CompanionPick[]).map((id) => {
          const p = PEOPLE[id];
          const active = id === pick;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-opacity",
                active ? "opacity-100" : "opacity-55 hover:opacity-90",
              )}
            >
              <span
                className={cn(
                  "relative block h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden ring-offset-2 ring-offset-background transition-all",
                  active ? "ring-2 ring-primary shadow-warm" : "ring-1 ring-border",
                )}
              >
                <img src={p.img} alt={`${p.name}, Begleitfigur`} width={80} height={80} className="h-full w-full object-cover" />
                {active && <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />}
              </span>
              <span className="text-sm font-medium text-foreground">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Speech bubble */}
      <motion.div
        key={pick}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative bg-card border border-border rounded-2xl px-4 py-3 shadow-warm text-left"
      >
        <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
          {person.name} · {person.tagline}
        </p>
        <p className="text-base text-foreground leading-snug">{person.hello}</p>
      </motion.div>

      {/* One-tap curiosity questions */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {person.questions.map((q, i) => (
          <motion.button
            key={`${pick}-${q}`}
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

      <p className="mt-2 text-[11px] text-muted-foreground text-center">
        Lea und Jonas sind erfundene Figuren des Vereins Tech4Good. Antippen genügt – oder schreib unten selbst.
      </p>
    </div>
  );
}

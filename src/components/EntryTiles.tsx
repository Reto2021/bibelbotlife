import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { openBibleBotChat } from "@/lib/chat-events";
import { openLifeWheel } from "@/components/LifeWheel";
import { useTrack } from "@/components/AnalyticsProvider";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type TileConfig = {
  emoji: string;
  key: string;
  label: string;
  special?: "lifewheel" | "sevenwhys";
  href?: string;
};

const PRIMARY_TILES: TileConfig[] = [
  { emoji: "😰", key: "anxiety",    label: "Ich mache mir Sorgen" },
  { emoji: "💔", key: "heartbreak", label: "Ich bin verletzt" },
  { emoji: "🫂", key: "loneliness", label: "Ich fühle mich allein" },
];

const SECONDARY_TILES: TileConfig[] = [
  { emoji: "⚖️", key: "decision", label: "Ich stehe vor einer Entscheidung" },
  { emoji: "🌱", key: "newstart",  label: "Ich will neu anfangen" },
  { emoji: "🧭", key: "calling",   label: "Was ist mein Weg?" },
];

const DEEP_TILES: TileConfig[] = [
  { emoji: "📖", key: "bibleverse", label: "Bibelstelle verstehen" },
  { emoji: "🔍", key: "sevenwhys",  label: "Warum tue ich das wirklich?", special: "sevenwhys" },
  { emoji: "🎡", key: "lifewheel",  label: "Wo stehe ich im Leben?", special: "lifewheel" },
];

const MORE_TILES: TileConfig[] = [
  { emoji: "🙏", key: "thankfulness",  label: "Dankbarkeit" },
  { emoji: "😢", key: "burnout",       label: "Erschöpfung" },
  { emoji: "🤷", key: "meaningcrisis", label: "Sinnkrise" },
  { emoji: "🪞", key: "selfdoubt",     label: "Selbstzweifel" },
  { emoji: "😡", key: "anger",         label: "Wut & Ärger" },
  { emoji: "💸", key: "financial",     label: "Finanzielle Sorgen" },
  { emoji: "🏥", key: "illness",       label: "Krankheit" },
  { emoji: "💐", key: "condolence",    label: "Trauer & Verlust" },
  { emoji: "💍", key: "wedding",       label: "Heirat & Partnerschaft" },
  { emoji: "🕊️", key: "baptism",      label: "Taufe & Glaubensweg" },
  { emoji: "⛪", key: "faithdoubt",    label: "Glaubenszweifel" },
  { emoji: "🤝", key: "forgiveness",   label: "Vergeben & Loslassen" },
  { emoji: "🌙", key: "sleepless",     label: "Schlaflosigkeit" },
  { emoji: "🧠", key: "biblequiz",     label: "Bibelquiz", href: "/bibelquiz" },
  { emoji: "🙏", key: "prayerwall",    label: "Gebetswand", href: "/gebetswand" },
];

const GROUPS = [
  { label: "Mir geht etwas nach",    tiles: PRIMARY_TILES,   accent: "text-amber-600 dark:text-amber-400" },
  { label: "Ich suche Orientierung", tiles: SECONDARY_TILES, accent: "text-teal-600 dark:text-teal-400" },
  { label: "Ich will tiefer gehen",  tiles: DEEP_TILES,      accent: "text-primary" },
];

export function EntryTiles() {
  const { t } = useTranslation();
  const { track } = useTrack();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const getPrompt = (key: string): string => {
    for (let i = 1; i <= 3; i++) {
      const k = `tiles.${key}.prompt_v${i}`;
      const v = t(k);
      if (v !== k) return v;
    }
    const fallback = t(`tiles.${key}.prompt`);
    return fallback !== `tiles.${key}.prompt` ? fallback : key;
  };

  const handleClick = (tile: TileConfig) => {
    track("tile_click", { tile: tile.key });
    if (tile.href) { navigate(tile.href); return; }
    if (tile.special === "lifewheel") { openLifeWheel(); return; }
    openBibleBotChat(getPrompt(tile.key), tile.special === "sevenwhys" ? "seven-whys" : "normal");
  };

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto max-w-3xl">

        {GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", group.accent)}>
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {group.tiles.map((tile, i) => (
                <motion.button
                  key={tile.key}
                  onClick={() => handleClick(tile)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-center"
                >
                  <span className="text-2xl" role="img">{tile.emoji}</span>
                  <span className="text-xs font-medium text-foreground leading-tight">
                    {tile.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {/* Mehr Themen */}
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMore ? "Weniger anzeigen" : "Weitere Themen entdecken"}
          </button>
        </div>

        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 flex flex-wrap gap-2 justify-center"
          >
            {MORE_TILES.map((tile) => (
              <button
                key={tile.key}
                onClick={() => handleClick(tile)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <span role="img">{tile.emoji}</span>
                {tile.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

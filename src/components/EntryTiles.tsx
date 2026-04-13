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
  { emoji: "😰", key: "anxiety",    label: "anxiety" },
  { emoji: "💔", key: "heartbreak", label: "heartbreak" },
  { emoji: "🫂", key: "loneliness", label: "loneliness" },
];

const SECONDARY_TILES: TileConfig[] = [
  { emoji: "⚖️", key: "decision", label: "decision" },
  { emoji: "🌱", key: "newstart",  label: "newstart" },
  { emoji: "🧭", key: "calling",   label: "calling" },
];

const DEEP_TILES: TileConfig[] = [
  { emoji: "📖", key: "bibleverse", label: "bibleverse" },
  { emoji: "🔍", key: "sevenwhys",  label: "sevenwhys", special: "sevenwhys" },
  { emoji: "🎡", key: "lifewheel",  label: "lifewheel", special: "lifewheel" },
];

const MORE_TILES: TileConfig[] = [
  { emoji: "🙏", key: "thankfulness",  label: "thankfulness" },
  { emoji: "😢", key: "burnout",       label: "burnout" },
  { emoji: "🤷", key: "meaningcrisis", label: "meaningcrisis" },
  { emoji: "🪞", key: "selfdoubt",     label: "selfdoubt" },
  { emoji: "😡", key: "anger",         label: "anger" },
  { emoji: "💸", key: "financial",     label: "financial" },
  { emoji: "🏥", key: "illness",       label: "illness" },
  { emoji: "💐", key: "condolence",    label: "condolence" },
  { emoji: "💍", key: "wedding",       label: "wedding" },
  { emoji: "🕊️", key: "baptism",      label: "baptism" },
  { emoji: "⛪", key: "faithdoubt",    label: "faithdoubt" },
  { emoji: "🤝", key: "forgiveness",   label: "forgiveness" },
  { emoji: "🌙", key: "sleepless",     label: "sleepless" },
  { emoji: "🧠", key: "biblequiz",     label: "biblequiz", href: "/bibelquiz" },
  { emoji: "🙏", key: "prayerwall",    label: "prayerwall", href: "/gebetswand" },
];

const GROUPS = [
  { labelKey: "emotional",    tiles: PRIMARY_TILES,   accent: "text-amber-600 dark:text-amber-400" },
  { labelKey: "orientation",  tiles: SECONDARY_TILES, accent: "text-teal-600 dark:text-teal-400" },
  { labelKey: "deep",         tiles: DEEP_TILES,      accent: "text-primary" },
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
          <div key={group.labelKey} className="mb-6">
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", group.accent)}>
              {t(`entryTiles.groups.${group.labelKey}`)}
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
                    {t(`entryTiles.labels.${tile.label}`)}
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
            {showMore ? t("entryTiles.showLess") : t("entryTiles.showMore")}
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
                {t(`entryTiles.labels.${tile.label}`)}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

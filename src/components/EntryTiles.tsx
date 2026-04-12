import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openBibleBotChat } from "@/lib/chat-events";
import { openLifeWheel } from "@/components/LifeWheel";
import { useTrack } from "@/components/AnalyticsProvider";
import { cn } from "@/lib/utils";

type TileConfig = {
  emoji: string;
  key: string;
  accentClass: string;
  bgClass: string;
  special?: "lifewheel" | "sevenwhys";
  href?: string;
};

const allTiles: TileConfig[] = [
  // Casual / curiosity-driven (front)
  { emoji: "🤔", key: "namequiz", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "☕", key: "dailywisdom", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🎲", key: "funfact", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "💡", key: "lifehack", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🌟", key: "strengths", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🎡", key: "lifewheel", accentClass: "bg-gradient-to-r from-primary to-secondary", bgClass: "bg-card", special: "lifewheel" },
  { emoji: "👨‍👩‍👧", key: "family", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "😴", key: "relax", accentClass: "bg-secondary", bgClass: "bg-card" },
  // Positive / lighter
  { emoji: "🙌", key: "gratitude", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🎊", key: "joy", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "📖", key: "bibleverse", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🔍", key: "sevenwhys", accentClass: "bg-gradient-to-r from-secondary to-primary", bgClass: "bg-card", special: "sevenwhys" },
  // Deeper topics
  { emoji: "🙏", key: "prayer", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🕊️", key: "baptism", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "💔", key: "heartbreak", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "😰", key: "anxiety", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🌅", key: "newstart", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "💐", key: "condolence", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "💍", key: "wedding", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🙏", key: "confession", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🫂", key: "loneliness", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "⚖️", key: "decision", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "😡", key: "anger", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "😔", key: "shame", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "😢", key: "burnout", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🏥", key: "illness", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "💸", key: "financial", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🤷", key: "meaningcrisis", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🪞", key: "selfdoubt", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🧭", key: "calling", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "⛪", key: "faithdoubt", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🤝", key: "forgiveness", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "👪", key: "familyconflict", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🫣", key: "envy", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🌙", key: "sleepless", accentClass: "bg-secondary", bgClass: "bg-card" },
  // Navigation tiles
  { emoji: "🙏", key: "prayerwall", accentClass: "bg-gradient-to-r from-primary to-secondary", bgClass: "bg-card", href: "/gebetswand" },
  { emoji: "🧠", key: "biblequiz", accentClass: "bg-gradient-to-r from-secondary to-primary", bgClass: "bg-card", href: "/bibelquiz" },
];

export function EntryTiles() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { t } = useTranslation();
  const { track } = useTrack();
  const navigate = useNavigate();

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
  };

  const getRandomPrompt = (tileKey: string): string => {
    // Try prompt variants (prompt_v1, prompt_v2, prompt_v3), fall back to single prompt
    const variants: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const key = `tiles.${tileKey}.prompt_v${i}`;
      const val = t(key);
      if (val !== key) variants.push(val); // i18next returns the key if missing
    }
    if (variants.length > 0) {
      return variants[Math.floor(Math.random() * variants.length)];
    }
    return t(`tiles.${tileKey}.prompt`);
  };

  const handleClick = (tile: TileConfig) => {
    track("tile_click", { tile: tile.key, special: tile.special || tile.href ? "navigate" : "chat" });
    if (tile.href) {
      navigate(tile.href);
    } else if (tile.special === "lifewheel") {
      openLifeWheel();
    } else if (tile.special === "sevenwhys") {
      openBibleBotChat(getRandomPrompt(tile.key), "seven-whys");
    } else {
      openBibleBotChat(getRandomPrompt(tile.key));
    }
  };

  // Split tiles into 2 rows
  const half = Math.ceil(allTiles.length / 2);
  const row1 = allTiles.slice(0, half);
  const row2 = allTiles.slice(half);

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("tiles.sectionTitle")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("tiles.sectionSubtitle")}
          </p>
        </div>

        {/* 2-row horizontal carousel */}
        <div className="relative group/carousel">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all -ml-2 md:-ml-5"
              aria-label="Nach links scrollen"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all -mr-2 md:-mr-5"
              aria-label="Nach rechts scrollen"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Fade edges */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />
          )}

          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex flex-col gap-3 w-max">
              {/* Row 1 */}
              <div className="flex gap-3">
                {row1.map((tile, i) => (
                  <TileCard
                    key={tile.key}
                    tile={tile}
                    title={t(`tiles.${tile.key}.title`)}
                    desc={t(`tiles.${tile.key}.desc`)}
                    onClick={() => handleClick(tile)}
                    index={i}
                  />
                ))}
              </div>
              {/* Row 2 */}
              <div className="flex gap-3">
                {row2.map((tile, i) => (
                  <TileCard
                    key={tile.key}
                    tile={tile}
                    title={t(`tiles.${tile.key}.title`)}
                    desc={t(`tiles.${tile.key}.desc`)}
                    onClick={() => handleClick(tile)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TileCard({
  tile,
  title,
  desc,
  onClick,
  className,
  index = 0,
}: {
  tile: TileConfig;
  title: string;
  desc: string;
  onClick: () => void;
  className?: string;
  index?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 8px 20px -6px hsl(var(--primary) / 0.12)" }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative text-left rounded-xl border border-border p-4 cursor-pointer flex-shrink-0 w-[200px] md:w-[220px]",
        "hover:border-primary/30 transition-colors",
        tile.bgClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" role="img">
          {tile.emoji}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs leading-snug mt-0.5 line-clamp-2">
            {desc}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

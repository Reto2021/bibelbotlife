import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { openBibelBotChat } from "@/lib/chat-events";
import { openLifeWheel } from "@/components/LifeWheel";
import { useTrack } from "@/components/AnalyticsProvider";
import { cn } from "@/lib/utils";

type TileConfig = {
  emoji: string;
  key: string;
  accentClass: string;
  bgClass: string;
  special?: "lifewheel" | "sevenwhys";
};

const tileConfigs: TileConfig[] = [
  { emoji: "🎡", key: "lifewheel", accentClass: "bg-gradient-to-r from-primary to-secondary", bgClass: "bg-card", special: "lifewheel" },
  { emoji: "🔍", key: "sevenwhys", accentClass: "bg-gradient-to-r from-secondary to-primary", bgClass: "bg-card", special: "sevenwhys" },
  { emoji: "🕊️", key: "baptism", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🙏", key: "prayer", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "💔", key: "heartbreak", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "😰", key: "anxiety", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🌅", key: "newstart", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🙌", key: "gratitude", accentClass: "bg-primary", bgClass: "bg-card" },
];

const moreTileConfigs: TileConfig[] = [
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
  { emoji: "🎊", key: "joy", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "📖", key: "bibleverse", accentClass: "bg-secondary", bgClass: "bg-card" },
  { emoji: "🤔", key: "namequiz", accentClass: "bg-primary", bgClass: "bg-card" },
  { emoji: "🌙", key: "sleepless", accentClass: "bg-secondary", bgClass: "bg-card" },
];

export function EntryTiles() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState(false);

  const { t } = useTranslation();
  const { track } = useTrack();

  const handleClick = (tile: TileConfig) => {
    track("tile_click", { tile: tile.key, special: tile.special || "chat" });
    if (tile.special === "lifewheel") {
      openLifeWheel();
    } else if (tile.special === "sevenwhys") {
      openBibelBotChat(t(`tiles.${tile.key}.prompt`), "seven-whys");
    } else {
      openBibelBotChat(t(`tiles.${tile.key}.prompt`));
    }
  };

  const visibleTiles = showMore ? [...tileConfigs, ...moreTileConfigs] : tileConfigs;

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {visibleTiles.map((tile, i) => (
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

        <div className="text-center mt-6">
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-sm px-6 py-2.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
          >
            {showMore ? t("tiles.showLess", "Weniger anzeigen") : t("tiles.showMore", "Mehr Themen entdecken")}
          </button>
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
        "group relative text-left rounded-xl border border-border p-4 cursor-pointer",
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
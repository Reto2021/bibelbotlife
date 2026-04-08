import { useRef, useState, useEffect, useCallback } from "react";
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
  { emoji: "🎡", key: "lifewheel", accentClass: "bg-gradient-to-r from-primary to-secondary", bgClass: "bg-[hsl(32_40%_94%)] dark:bg-[hsl(32_25%_14%)]", special: "lifewheel" },
  { emoji: "🔍", key: "sevenwhys", accentClass: "bg-gradient-to-r from-secondary to-primary", bgClass: "bg-[hsl(260_30%_94%)] dark:bg-[hsl(260_20%_14%)]", special: "sevenwhys" },
  { emoji: "🕊️", key: "baptism", accentClass: "bg-primary", bgClass: "bg-[hsl(32_50%_95%)] dark:bg-[hsl(32_30%_16%)]" },
  { emoji: "💐", key: "condolence", accentClass: "bg-secondary", bgClass: "bg-[hsl(185_30%_94%)] dark:bg-[hsl(185_25%_14%)]" },
  { emoji: "💍", key: "wedding", accentClass: "bg-primary", bgClass: "bg-[hsl(38_40%_95%)] dark:bg-[hsl(38_25%_15%)]" },
  { emoji: "😰", key: "anxiety", accentClass: "bg-secondary", bgClass: "bg-[hsl(210_25%_94%)] dark:bg-[hsl(210_20%_14%)]" },
  { emoji: "🙏", key: "confession", accentClass: "bg-primary", bgClass: "bg-[hsl(30_35%_93%)] dark:bg-[hsl(30_20%_14%)]" },
  { emoji: "💔", key: "heartbreak", accentClass: "bg-secondary", bgClass: "bg-[hsl(340_25%_94%)] dark:bg-[hsl(340_20%_14%)]" },
  { emoji: "🌅", key: "newstart", accentClass: "bg-secondary", bgClass: "bg-[hsl(100_25%_93%)] dark:bg-[hsl(100_15%_14%)]" },
  { emoji: "🤔", key: "namequiz", accentClass: "bg-primary", bgClass: "bg-[hsl(270_20%_94%)] dark:bg-[hsl(270_15%_14%)]" },
  { emoji: "🌙", key: "sleepless", accentClass: "bg-secondary", bgClass: "bg-[hsl(220_25%_94%)] dark:bg-[hsl(220_18%_14%)]" },
  { emoji: "🫂", key: "loneliness", accentClass: "bg-primary", bgClass: "bg-[hsl(25_30%_94%)] dark:bg-[hsl(25_20%_14%)]" },
  { emoji: "⚖️", key: "decision", accentClass: "bg-secondary", bgClass: "bg-[hsl(200_25%_94%)] dark:bg-[hsl(200_18%_14%)]" },
  { emoji: "🙌", key: "gratitude", accentClass: "bg-primary", bgClass: "bg-[hsl(45_35%_94%)] dark:bg-[hsl(45_20%_14%)]" },
  // Akute Lebenssituationen
  { emoji: "😡", key: "anger", accentClass: "bg-secondary", bgClass: "bg-[hsl(0_30%_94%)] dark:bg-[hsl(0_20%_14%)]" },
  { emoji: "😔", key: "shame", accentClass: "bg-primary", bgClass: "bg-[hsl(280_20%_94%)] dark:bg-[hsl(280_15%_14%)]" },
  { emoji: "😢", key: "burnout", accentClass: "bg-secondary", bgClass: "bg-[hsl(15_25%_94%)] dark:bg-[hsl(15_18%_14%)]" },
  { emoji: "🏥", key: "illness", accentClass: "bg-primary", bgClass: "bg-[hsl(190_25%_94%)] dark:bg-[hsl(190_18%_14%)]" },
  { emoji: "💸", key: "financial", accentClass: "bg-secondary", bgClass: "bg-[hsl(50_25%_94%)] dark:bg-[hsl(50_18%_14%)]" },
  // Sinnsuche & Identität
  { emoji: "🤷", key: "meaningcrisis", accentClass: "bg-primary", bgClass: "bg-[hsl(240_20%_94%)] dark:bg-[hsl(240_15%_14%)]" },
  { emoji: "🪞", key: "selfdoubt", accentClass: "bg-secondary", bgClass: "bg-[hsl(310_20%_94%)] dark:bg-[hsl(310_15%_14%)]" },
  { emoji: "🧭", key: "calling", accentClass: "bg-primary", bgClass: "bg-[hsl(160_25%_93%)] dark:bg-[hsl(160_18%_14%)]" },
  { emoji: "⛪", key: "faithdoubt", accentClass: "bg-secondary", bgClass: "bg-[hsl(35_30%_94%)] dark:bg-[hsl(35_20%_14%)]" },
  // Beziehungen
  { emoji: "🤝", key: "forgiveness", accentClass: "bg-primary", bgClass: "bg-[hsl(140_25%_93%)] dark:bg-[hsl(140_18%_14%)]" },
  { emoji: "👪", key: "familyconflict", accentClass: "bg-secondary", bgClass: "bg-[hsl(20_30%_94%)] dark:bg-[hsl(20_20%_14%)]" },
  { emoji: "🫣", key: "envy", accentClass: "bg-primary", bgClass: "bg-[hsl(55_25%_94%)] dark:bg-[hsl(55_18%_14%)]" },
  // Positive Trigger
  { emoji: "🎊", key: "joy", accentClass: "bg-secondary", bgClass: "bg-[hsl(60_35%_94%)] dark:bg-[hsl(60_20%_14%)]" },
  { emoji: "🙏", key: "prayer", accentClass: "bg-primary", bgClass: "bg-[hsl(275_25%_94%)] dark:bg-[hsl(275_18%_14%)]" },
  { emoji: "📖", key: "bibleverse", accentClass: "bg-secondary", bgClass: "bg-[hsl(170_25%_93%)] dark:bg-[hsl(170_18%_14%)]" },
];

export function EntryTiles() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("tiles.sectionTitle")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("tiles.sectionSubtitle")}
          </p>
        </div>

        {/* Mobile: Horizontal carousel */}
        <div className="md:hidden relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tileConfigs.map((tile, i) => (
              <TileCard
                key={i}
                tile={tile}
                title={t(`tiles.${tile.key}.title`)}
                desc={t(`tiles.${tile.key}.desc`)}
                onClick={() => handleClick(tile)}
                index={i}
                className="min-w-[220px] max-w-[250px] snap-start flex-shrink-0"
              />
            ))}
            {/* Spacer to prevent last tile from being clipped */}
            <div className="min-w-[1px] flex-shrink-0" aria-hidden="true" />
          </div>
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: Math.ceil(tileConfigs.length / 2) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30" />
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tileConfigs.map((tile, i) => (
            <TileCard
              key={i}
              tile={tile}
              title={t(`tiles.${tile.key}.title`)}
              desc={t(`tiles.${tile.key}.desc`)}
              onClick={() => handleClick(tile)}
              index={i}
            />
          ))}
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: "0 12px 28px -8px hsl(var(--primary) / 0.15)" }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative text-left rounded-2xl border border-border p-5 cursor-pointer",
        "hover:border-primary/30",
        tile.bgClass,
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-1 rounded-b-full transition-all duration-300",
          "group-hover:left-3 group-hover:right-3",
          tile.accentClass
        )}
      />
      <motion.span
        className="text-3xl block mb-3"
        role="img"
        whileHover={{ scale: 1.25, rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.4 }}
      >
        {tile.emoji}
      </motion.span>
      <h3 className="font-semibold text-foreground text-base mb-1">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-snug">
        {desc}
      </p>
    </motion.button>
  );
}
import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { openBibelBotChat } from "@/lib/chat-events";
import { cn } from "@/lib/utils";

type TileConfig = {
  emoji: string;
  key: string;
  accentClass: string;
  bgClass: string;
};

const tileConfigs: TileConfig[] = [
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

  const handleClick = (tile: TileConfig) => {
    openBibelBotChat(t(`tiles.${tile.key}.prompt`));
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
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          )}
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
                className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0"
              />
            ))}
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
}: {
  tile: TileConfig;
  title: string;
  desc: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl border border-border p-5 transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
        "active:scale-[0.98] cursor-pointer",
        tile.bgClass,
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-1 rounded-b-full transition-all",
          "group-hover:left-3 group-hover:right-3",
          tile.accentClass
        )}
      />
      <span className="text-3xl block mb-3" role="img">
        {tile.emoji}
      </span>
      <h3 className="font-semibold text-foreground text-base mb-1">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-snug">
        {desc}
      </p>
    </button>
  );
}
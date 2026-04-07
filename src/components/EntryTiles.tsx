import { useRef, useState, useEffect, useCallback } from "react";
import { openBibelBotChat } from "@/lib/chat-events";
import { cn } from "@/lib/utils";

type EntryTile = {
  emoji: string;
  title: string;
  desc: string;
  prompt: string;
  accentClass: string;
  bgClass: string;
};

const tiles: EntryTile[] = [
  {
    emoji: "🕊️",
    title: "Taufspruch finden",
    desc: "Der perfekte Vers für dein Kind",
    prompt: "Hilf mir, einen passenden Taufspruch zu finden. Was für ein Kind ist es und was wünschen sich die Eltern?",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(32_50%_95%)]  dark:bg-[hsl(32_30%_16%)]",
  },
  {
    emoji: "💐",
    title: "Trostworte",
    desc: "Kondolenz & Abschied begleiten",
    prompt: "Ich brauche tröstende Worte für eine Trauerkarte. Kannst du mir helfen, etwas Passendes zu formulieren?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(185_30%_94%)] dark:bg-[hsl(185_25%_14%)]",
  },
  {
    emoji: "💍",
    title: "Hochzeitsspruch",
    desc: "Biblische Worte für eure Liebe",
    prompt: "Wir suchen einen schönen biblischen Spruch für unsere Hochzeit. Welche Bibelstellen passen zu Liebe und Partnerschaft?",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(38_40%_95%)] dark:bg-[hsl(38_25%_15%)]",
  },
  {
    emoji: "😰",
    title: "Angst & Sorgen",
    desc: "Mut finden in schweren Zeiten",
    prompt: "Ich habe gerade mit Ängsten und Sorgen zu kämpfen. Was sagt die Bibel dazu? Gibt es Verse, die Mut machen?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(210_25%_94%)] dark:bg-[hsl(210_20%_14%)]",
  },
  {
    emoji: "🙏",
    title: "Beichte",
    desc: "Gott vergibt — sprich es aus",
    prompt: "Ich möchte etwas loswerden, das mich belastet. Was sagt die Bibel über Vergebung und Neuanfang?",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(30_35%_93%)] dark:bg-[hsl(30_20%_14%)]",
  },
  {
    emoji: "💔",
    title: "Liebeskummer",
    desc: "Was die Bibel über Herzschmerz sagt",
    prompt: "Mein Herz ist gebrochen. Was sagt die Bibel über Liebeskummer und wie man wieder Hoffnung findet?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(340_25%_94%)] dark:bg-[hsl(340_20%_14%)]",
  },
  {
    emoji: "🌅",
    title: "Neuanfang",
    desc: "Kraft für einen neuen Lebensabschnitt",
    prompt: "Ich stehe vor einem Neuanfang und brauche Ermutigung. Welche Bibelstellen sprechen über Neuanfänge?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(100_25%_93%)] dark:bg-[hsl(100_15%_14%)]",
  },
  {
    emoji: "🤔",
    title: "Tauf-Quiz",
    desc: "Finde den passenden biblischen Namen",
    prompt: "Ich suche einen biblischen Namen für mein Kind. Kannst du mir ein paar Vorschläge machen und ihre Bedeutung erklären?",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(270_20%_94%)] dark:bg-[hsl(270_15%_14%)]",
  },
  {
    emoji: "🌙",
    title: "Schlaflos",
    desc: "Ruhe finden in der Nacht",
    prompt: "Ich kann nicht schlafen und mache mir Gedanken. Gibt es ein beruhigendes Gebet oder einen Psalm für die Nacht?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(220_25%_94%)] dark:bg-[hsl(220_18%_14%)]",
  },
  {
    emoji: "🫂",
    title: "Einsamkeit",
    desc: "Du bist nie allein",
    prompt: "Ich fühle mich einsam. Was sagt die Bibel darüber, dass Gott immer bei uns ist?",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(25_30%_94%)] dark:bg-[hsl(25_20%_14%)]",
  },
  {
    emoji: "⚖️",
    title: "Schwere Entscheidung",
    desc: "Weisheit für den richtigen Weg",
    prompt: "Ich stehe vor einer schwierigen Entscheidung. Welche Bibelstellen helfen mir, den richtigen Weg zu finden?",
    accentClass: "bg-secondary",
    bgClass: "bg-[hsl(200_25%_94%)] dark:bg-[hsl(200_18%_14%)]",
  },
  {
    emoji: "🙌",
    title: "Dankbarkeit",
    desc: "Ein persönliches Dankgebet",
    prompt: "Ich möchte Gott danken. Hilf mir, ein persönliches Dankgebet zu formulieren.",
    accentClass: "bg-primary",
    bgClass: "bg-[hsl(45_35%_94%)] dark:bg-[hsl(45_20%_14%)]",
  },
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

  const handleClick = (tile: EntryTile) => {
    openBibelBotChat(tile.prompt);
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Was bewegt dich?
          </h2>
          <p className="text-muted-foreground text-lg">
            Wähle ein Thema — der BibelBot begleitet dich
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
            {tiles.map((tile, i) => (
              <TileCard
                key={i}
                tile={tile}
                onClick={() => handleClick(tile)}
                className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0"
              />
            ))}
          </div>
          {/* Scroll indicator dots */}
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: Math.ceil(tiles.length / 2) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30" />
            ))}
          </div>
        </div>

        {/* Desktop: 2-column grid (3 cols on lg) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tiles.map((tile, i) => (
            <TileCard
              key={i}
              tile={tile}
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
  onClick,
  className,
}: {
  tile: EntryTile;
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
      {/* Top accent bar */}
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
        {tile.title}
      </h3>
      <p className="text-muted-foreground text-sm leading-snug">
        {tile.desc}
      </p>
    </button>
  );
}

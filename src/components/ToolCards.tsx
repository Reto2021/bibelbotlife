import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { openBibleBotChat } from "@/lib/chat-events";
import { openLifeWheel } from "@/components/LifeWheel";
import { useFavoriteTools } from "@/hooks/use-favorite-tools";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMode } from "@/lib/chat-events";

export interface ToolDef {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  action: () => void;
}

export function useToolDefs(): ToolDef[] {
  return [
    {
      id: "lifewheel",
      emoji: "🎡",
      titleKey: "tools.lifewheel.title",
      descKey: "tools.lifewheel.desc",
      ctaKey: "tools.lifewheel.cta",
      action: () => openLifeWheel(),
    },
    {
      id: "sevenwhys",
      emoji: "🔍",
      titleKey: "tools.sevenwhys.title",
      descKey: "tools.sevenwhys.desc",
      ctaKey: "tools.sevenwhys.cta",
      action: () => openBibleBotChat("Ich möchte die 7-Warum-Methode ausprobieren", "seven-whys"),
    },
    {
      id: "gratitude",
      emoji: "🙏",
      titleKey: "tools.gratitude.title",
      descKey: "tools.gratitude.desc",
      ctaKey: "tools.gratitude.cta",
      action: () => openBibleBotChat("Ich möchte das Dankbarkeitstagebuch ausprobieren. Bitte frag mich nach drei Dingen, für die ich heute dankbar bin, und finde dann passende Bibelverse dazu.", "gratitude"),
    },
    {
      id: "lectio",
      emoji: "📖",
      titleKey: "tools.lectio.title",
      descKey: "tools.lectio.desc",
      ctaKey: "tools.lectio.cta",
      action: () => openBibleBotChat("Ich möchte Lectio Divina ausprobieren. Bitte führe mich durch die vier Schritte: Lectio (Lesen), Meditatio (Meditieren), Oratio (Beten), Contemplatio (Ruhen). Wähle einen passenden Bibeltext für mich.", "lectio"),
    },
    {
      id: "forgiveness",
      emoji: "✉️",
      titleKey: "tools.forgiveness.title",
      descKey: "tools.forgiveness.desc",
      ctaKey: "tools.forgiveness.cta",
      action: () => openBibleBotChat("Ich möchte einen Vergebungsbrief schreiben. Bitte begleite mich Schritt für Schritt — mit biblischen Impulsen und einfühlsam.", "forgiveness"),
    },
    {
      id: "values",
      emoji: "🧭",
      titleKey: "tools.values.title",
      descKey: "tools.values.desc",
      ctaKey: "tools.values.cta",
      action: () => openBibleBotChat("Ich möchte meinen Werte-Kompass entdecken. Hilf mir herauszufinden, was mir wirklich wichtig ist — und zeige mir, was die Bibel zu meinen Kernwerten sagt.", "values"),
    },
    {
      id: "examen",
      emoji: "🕯️",
      titleKey: "tools.examen.title",
      descKey: "tools.examen.desc",
      ctaKey: "tools.examen.cta",
      action: () => openBibleBotChat("Ich möchte das Ignatianische Examen machen. Bitte führe mich durch die 5 Schritte: 1) Stille werden und Gottes Gegenwart spüren, 2) Dankbarkeit für den Tag, 3) Rückblick auf den Tag, 4) Was hat mich berührt oder belastet?, 5) Ausblick auf morgen mit einem Gebet.", "examen"),
    },
  ];
}

interface ToolCardProps {
  tool: ToolDef;
  isFavorite: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: () => void;
  compact?: boolean;
}

export function ToolCard({ tool, isFavorite, isLoggedIn, onToggleFavorite, compact }: ToolCardProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <button
        onClick={tool.action}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/80 border border-border hover:border-primary hover:shadow-md transition-all duration-200 active:scale-[0.97] min-w-0"
      >
        <span className="text-2xl shrink-0">{tool.emoji}</span>
        <span className="text-sm font-medium text-card-foreground truncate">{t(tool.titleKey)}</span>
      </button>
    );
  }

  return (
    <Card className="bg-card/80 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
      {isLoggedIn && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/60 transition-colors z-10"
          title={isFavorite ? t("tools.removeFavorite") : t("tools.addFavorite")}
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          />
        </button>
      )}
      <CardHeader className="text-center pb-2">
        <span className="text-5xl mb-3 block">{tool.emoji}</span>
        <CardTitle className="text-xl text-card-foreground">{t(tool.titleKey)}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <CardDescription className="text-muted-foreground leading-relaxed">
          {t(tool.descKey)}
        </CardDescription>
        <Button
          variant={tool.id === "lifewheel" ? "default" : "outline"}
          onClick={tool.action}
          className="w-full"
        >
          {t(tool.ctaKey)}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FavoriteToolsBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const tools = useToolDefs();
  const { favorites } = useFavoriteTools();

  if (!user || favorites.length === 0) return null;

  const favTools = tools.filter((tool) => favorites.includes(tool.id));
  if (favTools.length === 0) return null;

  return (
    <section className="py-4 px-4">
      <div className="container mx-auto max-w-4xl">
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-primary text-primary" />
          {t("tools.myFavorites")}
        </p>
        <div className="flex flex-wrap gap-2">
          {favTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={true}
              isLoggedIn={true}
              onToggleFavorite={() => {}}
              compact
            />
          ))}
        </div>
      </div>
    </section>
  );
}

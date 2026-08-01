import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import placeholder1 from "@/assets/cross-placeholder-1.jpg";
import placeholder2 from "@/assets/cross-placeholder-2.jpg";
import placeholder3 from "@/assets/cross-placeholder-3.jpg";

interface Item {
  id: string;
  place_label: string;
  image_url: string | null;
  prayer_count: number;
}

interface PlaceholderItem {
  id: `placeholder-${number}`;
  place_label_key: string;
  image_url: string;
  placeholder: true;
}

type MarqueeItem = Item | PlaceholderItem;

const PLACEHOLDERS: PlaceholderItem[] = [
  { id: "placeholder-1", place_label_key: "crossways.marquee.placeholder1", image_url: placeholder1, placeholder: true },
  { id: "placeholder-2", place_label_key: "crossways.marquee.placeholder2", image_url: placeholder2, placeholder: true },
  { id: "placeholder-3", place_label_key: "crossways.marquee.placeholder3", image_url: placeholder3, placeholder: true },
];

function isPlaceholder(item: MarqueeItem): item is PlaceholderItem {
  return "placeholder" in item && item.placeholder === true;
}

/**
 * Living marquee of recently approved crosses — an entry point to /kreuzwege
 * on the landing page. Always renders, filling the carousel with placeholder
 * motifs when fewer than 3 community photos exist yet.
 */
export function CrossMarquee() {
  const { t } = useTranslation();
  const [realItems, setRealItems] = useState<Item[]>([]);

  useEffect(() => {
    let active = true;
    supabase.functions.invoke("cross-posts-feed").then(({ data, error }) => {
      if (!active || error || !data?.posts) return;
      const withImages = (data.posts as Item[]).filter((p) => p.image_url).slice(0, 12);
      setRealItems(withImages);
    });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<MarqueeItem[]>(() => {
    if (realItems.length >= 3) return realItems;
    const needed = Math.max(3 - realItems.length, 0);
    return [...realItems, ...PLACEHOLDERS.slice(0, needed)];
  }, [realItems]);

  // Duplicate the row so the CSS translate loop appears seamless.
  const loop = [...items, ...items];

  return (
    <section className="border-y border-border/50 bg-card/40 py-12" aria-labelledby="kreuzwege-teaser">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-primary">
              <MapPin className="h-3.5 w-3.5" /> {t("crossways.marquee.eyebrow")}
            </p>
            <h2 id="kreuzwege-teaser" className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
              {t("crossways.marquee.title")}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {t("crossways.marquee.description")}
            </p>
          </div>
          <Button asChild size="lg" className="gap-1.5">
            <Link to="/kreuzwege">
              {t("crossways.marquee.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max gap-4 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {loop.map((p, i) => {
            const label = isPlaceholder(p) ? t(p.place_label_key) : p.place_label;
            return (
              <Link
                key={`${p.id}-${i}`}
                to="/kreuzwege"
                className="relative w-56 shrink-0 overflow-hidden rounded-xl border border-border/60 transition-transform duration-300 hover:scale-[1.03] sm:w-64"
                aria-label={t("crossways.card.imageAlt", { place: label })}
              >
                <img
                  src={p.image_url!}
                  alt={t("crossways.card.imageAlt", { place: label })}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

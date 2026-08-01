import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  place_label: string;
  image_url: string | null;
  prayer_count: number;
}

/**
 * Living marquee of recently approved crosses — an entry point to /kreuzwege
 * on the landing page. Renders nothing until at least 3 images are available.
 */
export function CrossMarquee() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let active = true;
    supabase.functions.invoke("cross-posts-feed").then(({ data, error }) => {
      if (!active || error || !data?.posts) return;
      const withImages = (data.posts as Item[]).filter((p) => p.image_url).slice(0, 12);
      setItems(withImages);
    });
    return () => {
      active = false;
    };
  }, []);

  if (items.length < 3) return null;

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
          {loop.map((p, i) => (
            <Link
              key={`${p.id}-${i}`}
              to="/kreuzwege"
              className="relative w-56 shrink-0 overflow-hidden rounded-xl border border-border/60 transition-transform duration-300 hover:scale-[1.03] sm:w-64"
              aria-label={t("crossways.card.imageAlt", { place: p.place_label })}
            >
              <img
                src={p.image_url!}
                alt={`Kreuz bei ${p.place_label}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                <p className="truncate text-sm font-medium text-foreground">{p.place_label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

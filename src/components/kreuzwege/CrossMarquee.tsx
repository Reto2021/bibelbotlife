import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrossPosts, type CrossPost } from "@/hooks/use-cross-posts";
import placeholder1 from "@/assets/cross-placeholder-1.jpg";
import placeholder2 from "@/assets/cross-placeholder-2.jpg";
import placeholder3 from "@/assets/cross-placeholder-3.jpg";
import { CrossDetailModal } from "./CrossDetailModal";

interface PlaceholderItem {
  id: `placeholder-${number}`;
  place_label_key: string;
  image_url: string;
  placeholder: true;
}

type MarqueeItem = CrossPost | PlaceholderItem;

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
  const { posts: realItems, hasReacted, react } = useCrossPosts();
  const [selected, setSelected] = useState<CrossPost | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const items = useMemo<MarqueeItem[]>(() => {
    const withImages = realItems.filter((p) => p.image_url).slice(0, 12);
    if (withImages.length >= 3) return withImages;
    const needed = Math.max(3 - withImages.length, 0);
    return [...withImages, ...PLACEHOLDERS.slice(0, needed)];
  }, [realItems]);

  // Duplicate the row so the scroll loop appears seamless.
  const loop = [...items, ...items];

  // Auto-scroll a native scroll container: users can still swipe/drag freely,
  // and the drift pauses while they interact.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    const SPEED = 40; // px per second

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current) {
        const half = el.scrollWidth / 2;
        let next = el.scrollLeft + SPEED * dt;
        if (half > 0 && next >= half) next -= half;
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };
    let resumeTimer: number | undefined;
    const pauseThenResume = () => {
      pause();
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(resume, 2500);
    };

    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    // Desktop mouse drag ("grab and pull").
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      pause();
      if (e.pointerType === "mouse") {
        dragging = true;
        startX = e.clientX;
        startScroll = el.scrollLeft;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const onUp = () => { dragging = false; };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", pauseThenResume, { passive: true });
    el.addEventListener("wheel", pauseThenResume, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", pauseThenResume);
      el.removeEventListener("wheel", pauseThenResume);
    };
  }, [loop.length]);


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
        <Link
          to="/kreuzwege?upload=1"
          className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3"
          aria-label={t("crossways.marquee.uploadAria")}
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">{t("crossways.marquee.uploadCta")}</span>
        </Link>

        <div
          ref={trackRef}
          className="flex w-full gap-4 overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x] cursor-grab active:cursor-grabbing"
        >

          {loop.map((p, i) => {
            const label = isPlaceholder(p) ? t(p.place_label_key) : p.place_label;
            const cardContent = (
              <>
                <img
                  src={p.image_url!}
                  alt={t("crossways.card.imageAlt", { place: label })}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent p-3 pt-8">
                  <p className="truncate text-sm font-semibold text-background drop-shadow">{label}</p>
                </div>
              </>
            );

            const cardClass =
              "relative z-10 w-56 shrink-0 overflow-hidden rounded-xl border border-border/60 text-left [touch-action:manipulation] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] sm:w-64";

            if (isPlaceholder(p)) {
              return (
                <Link
                  key={`${p.id}-${i}`}
                  to="/kreuzwege"
                  className={cardClass}
                  aria-label={t("crossways.card.imageAlt", { place: label })}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <button
                key={`${p.id}-${i}`}
                type="button"
                onClick={() => setSelected(p)}
                className={cardClass}
                aria-label={t("crossways.card.imageAlt", { place: label })}
              >
                {cardContent}
              </button>
            );
          })}
        </div>
      </div>


      <CrossDetailModal
        post={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        hasReacted={hasReacted}
        onReact={react}
      />
    </section>
  );
}

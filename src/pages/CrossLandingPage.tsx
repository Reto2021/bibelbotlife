import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Map as MapIcon, Navigation, ArrowRight } from "lucide-react";
import { CrossFeed } from "@/components/kreuzwege/CrossFeed";
import { CrossUploadDialog } from "@/components/kreuzwege/CrossUploadDialog";
import { CrossDetailModal } from "@/components/kreuzwege/CrossDetailModal";
import { useCrossPosts, distanceKm } from "@/hooks/use-cross-posts";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CrossMap = lazy(() => import("@/components/kreuzwege/CrossMap"));

type LandingType = "wegkreuze" | "gipfelkreuze" | "bergkreuze";

interface Config {
  titleKey: string;
  subtitleKey: string;
  metaTitleKey: string;
  metaDescriptionKey: string;
  keywords: string[];
  canonicalPath: string;
  eyebrowKey: string;
}

const CONFIGS: Record<LandingType, Config> = {
  wegkreuze: {
    titleKey: "crossways.landing.wegkreuze.title",
    subtitleKey: "crossways.landing.wegkreuze.subtitle",
    metaTitleKey: "crossways.landing.wegkreuze.metaTitle",
    metaDescriptionKey: "crossways.landing.wegkreuze.metaDescription",
    keywords: ["wegkreuz", "flurkreuz", "feldkreuz", "wegkreuze", "strassenkreuz", "kreuzweg", "marterl", " Bildstock"],
    canonicalPath: "/wegkreuze",
    eyebrowKey: "crossways.landing.wegkreuze.eyebrow",
  },
  gipfelkreuze: {
    titleKey: "crossways.landing.gipfelkreuze.title",
    subtitleKey: "crossways.landing.gipfelkreuze.subtitle",
    metaTitleKey: "crossways.landing.gipfelkreuze.metaTitle",
    metaDescriptionKey: "crossways.landing.gipfelkreuze.metaDescription",
    keywords: ["gipfelkreuz", "bergkreuz", "gipfel", "berg", "summit cross", "mountain cross", "alpen"],
    canonicalPath: "/gipfelkreuze",
    eyebrowKey: "crossways.landing.gipfelkreuze.eyebrow",
  },
  bergkreuze: {
    titleKey: "crossways.landing.bergkreuze.title",
    subtitleKey: "crossways.landing.bergkreuze.subtitle",
    metaTitleKey: "crossways.landing.bergkreuze.metaTitle",
    metaDescriptionKey: "crossways.landing.bergkreuze.metaDescription",
    keywords: ["bergkreuz", "gipfelkreuz", "berg", "gipfel", "mountain cross", "summit cross", "alpen"],
    canonicalPath: "/bergkreuze",
    eyebrowKey: "crossways.landing.bergkreuze.eyebrow",
  },
};

function matchesLanding(post: { place_label?: string | null; story?: string | null; country?: string | null }, keywords: string[]) {
  const haystack = [post.place_label, post.story, post.country]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.some((k) => haystack.includes(k.toLowerCase()));
}

interface Props {
  type: LandingType;
}

export default function CrossLandingPage({ type }: Props) {
  const { t } = useTranslation();
  const { posts, loading, hasReacted, react, reload } = useCrossPosts();
  const { toast } = useToast();
  const [view, setView] = useState<"feed" | "map">("feed");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const cfg = CONFIGS[type];

  const filtered = useMemo(
    () => posts.filter((p) => matchesLanding(p, cfg.keywords)),
    [posts, cfg.keywords],
  );

  const sorted = useMemo(() => {
    if (!me) return filtered;
    return [...filtered].sort((a, b) => {
      const da = a.lat != null && a.lng != null ? distanceKm(me, { lat: a.lat, lng: a.lng }) : Infinity;
      const db = b.lat != null && b.lng != null ? distanceKm(me, { lat: b.lat, lng: b.lng }) : Infinity;
      return da - db;
    });
  }, [filtered, me]);

  const detailPost = useMemo(
    () => posts.find((p) => p.id === detailId) ?? null,
    [posts, detailId],
  );

  function nearMe() {
    if (!navigator.geolocation) {
      toast({ title: t("crossways.locationUnavailable"), variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({ title: t("crossways.sortNear") });
      },
      () => toast({ title: t("crossways.locationDenied"), variant: "destructive" }),
    );
  }

  // Keep the URL in sync with the open cross so it can be shared / indexed.
  function openDetail(id: string) {
    setDetailId(id);
    const post = posts.find((p) => p.id === id);
    if (post?.slug) window.history.replaceState(null, "", `/kreuzwege/${post.slug}`);
  }

  function closeDetail() {
    setDetailId(null);
    window.history.replaceState(null, "", cfg.canonicalPath);
  }

  const title = t(cfg.titleKey, { defaultValue: cfg.titleKey });
  const subtitle = t(cfg.subtitleKey, { defaultValue: cfg.subtitleKey });
  const metaTitle = t(cfg.metaTitleKey, { defaultValue: title });
  const metaDescription = t(cfg.metaDescriptionKey, { defaultValue: subtitle });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={metaTitle} description={metaDescription} path={cfg.canonicalPath} />
      <SiteHeader />

      <main className="container mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            {t(cfg.eyebrowKey, { defaultValue: "Kreuzwege" })}
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{subtitle}</p>
          <Button asChild variant="outline" className="mt-5 gap-1.5">
            <Link to="/kreuzwege">
              {t("crossways.landing.allCrosses", { defaultValue: "Alle Kreuze entdecken" })} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/60 p-1">
            <Button
              variant={view === "feed" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setView("feed")}
            >
              <LayoutGrid className="h-4 w-4" /> {t("crossways.feed")}
            </Button>
            <Button
              variant={view === "map" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setView("map")}
            >
              <MapIcon className="h-4 w-4" /> {t("crossways.map")}
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={nearMe}>
            <Navigation className="h-4 w-4" /> {t("crossways.nearMe")}
          </Button>
          <div className="ml-auto">
            <CrossUploadDialog onSubmitted={reload} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : view === "feed" ? (
          <CrossFeed posts={sorted} hasReacted={hasReacted} onReact={react} onOpen={openDetail} />
        ) : (
          <Suspense fallback={<div className="h-[70vh] rounded-xl bg-muted/40" />}>
            <CrossMap posts={filtered} center={me ? [me.lat, me.lng] : undefined} zoom={me ? 11 : 6} />
          </Suspense>
        )}

        {sorted.length > 0 && (
          <nav aria-label={title} className="mt-12 border-t border-border/60 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {t("crossways.landing.detailPages", { defaultValue: "Detailseiten" })}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {sorted.slice(0, 60).map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/kreuzwege/${p.slug}`}
                    className="inline-flex rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {p.place_label || t("crossways.landing.unnamed", { defaultValue: "Kreuz" })}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <CrossDetailModal
          post={detailPost}
          open={!!detailPost}
          onOpenChange={(o) => !o && closeDetail()}
          hasReacted={hasReacted}
          onReact={react}
        />
      </main>
    </div>
  );
}

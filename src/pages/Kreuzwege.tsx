import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Map as MapIcon, Navigation } from "lucide-react";
import { CrossFeed } from "@/components/kreuzwege/CrossFeed";
import { CrossUploadDialog } from "@/components/kreuzwege/CrossUploadDialog";
import { CrossDetailModal } from "@/components/kreuzwege/CrossDetailModal";
import { useCrossPosts, distanceKm } from "@/hooks/use-cross-posts";
import { useToast } from "@/hooks/use-toast";

const CrossMap = lazy(() => import("@/components/kreuzwege/CrossMap"));

export default function Kreuzwege() {
  const { t } = useTranslation();
  const { posts, loading, hasReacted, react, reload } = useCrossPosts();
  const { toast } = useToast();
  const [view, setView] = useState<"feed" | "map">("feed");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [detailId, setDetailId] = useState<string | null>(null);

  const deepLinkId = searchParams.get("post");
  const uploadParam = searchParams.get("upload");
  const uploadOpen = uploadParam === "1";

  useEffect(() => {
    if (deepLinkId && posts.some((p) => p.id === deepLinkId)) setDetailId(deepLinkId);
  }, [deepLinkId, posts]);

  function clearUploadParam() {
    if (uploadParam !== null) {
      const next = new URLSearchParams(searchParams);
      next.delete("upload");
      setSearchParams(next, { replace: true });
    }
  }

  const detailPost = useMemo(
    () => posts.find((p) => p.id === detailId) ?? null,
    [posts, detailId],
  );

  function closeDetail() {
    setDetailId(null);
    if (searchParams.has("post")) {
      const next = new URLSearchParams(searchParams);
      next.delete("post");
      setSearchParams(next, { replace: true });
    }
  }


  const sorted = useMemo(() => {
    if (!me) return posts;
    return [...posts].sort((a, b) => {
      const da = a.lat != null && a.lng != null ? distanceKm(me, { lat: a.lat, lng: a.lng }) : Infinity;
      const db = b.lat != null && b.lng != null ? distanceKm(me, { lat: b.lat, lng: b.lng }) : Infinity;
      return da - db;
    });
  }, [posts, me]);

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("crossways.metaTitle")}
        description={t("crossways.metaDescription")}
      />
      <SiteHeader />

      <main className="container mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">{t("crossways.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("crossways.subtitle")}</p>
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
            <CrossUploadDialog
              onSubmitted={reload}
              defaultOpen={uploadOpen}
              onOpenChange={(open) => {
                if (!open) clearUploadParam();
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : view === "feed" ? (
          <CrossFeed posts={sorted} hasReacted={hasReacted} onReact={react} />
        ) : (
          <Suspense fallback={<div className="h-[70vh] rounded-xl bg-muted/40" />}>
            <CrossMap
              posts={posts}
              center={me ? [me.lat, me.lng] : undefined}
              zoom={me ? 11 : 6}
            />
          </Suspense>
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

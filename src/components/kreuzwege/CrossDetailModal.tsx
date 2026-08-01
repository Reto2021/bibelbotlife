import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, HandHeart, Sparkles, ExternalLink, Plus, Minus, Link2, Check, Maximize2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CrossPost, CrossInteraction } from "@/hooks/use-cross-posts";
import CrossMap from "./CrossMap";

interface Props {
  post: CrossPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasReacted: (id: string, kind: CrossInteraction) => boolean;
  onReact: (id: string, kind: CrossInteraction) => void;
}

const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

export function CrossDetailModal({ post, open, onOpenChange, hasReacted, onReact }: Props) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(13);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (open) {
      setZoom(13);
      setCopied(false);
      setLightbox(false);
    }
  }, [open, post?.id]);

  if (!post) return null;

  const prayed = hasReacted(post.id, "prayer");
  const amened = hasReacted(post.id, "amen");
  const hasCoords = post.lat != null && post.lng != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [post.place_label, post.country].filter(Boolean).join(", "),
      )}`;

  const openExternalMaps = () => window.open(mapsUrl, "_blank", "noopener,noreferrer");

  const shareUrl = `${window.location.origin}/kreuzwege?post=${post.id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    onReact(post.id, "share");
    toast.success(t("crossways.modal.linkCopied", "Link kopiert"), {
      description: t("crossways.modal.linkCopiedDescription", "Der Link wurde in die Zwischenablage kopiert."),
    });
    setTimeout(() => setCopied(false), 2000);
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="max-h-[80vh] overflow-y-auto">
          {post.image_url && (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              aria-label={t("crossways.modal.openLightbox", "Foto im Vollbild anzeigen")}
              className="relative block w-full cursor-zoom-in bg-foreground/90"
            >
              <img
                src={post.image_url}
                alt={t("crossways.card.imageAlt", { place: post.place_label })}
                className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-background/80 p-2 text-foreground shadow-sm backdrop-blur">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
          )}

          <div className="p-6 space-y-5">
            <DialogHeader className="text-left space-y-2">
              <button
                type="button"
                onClick={openExternalMaps}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                title={t("crossways.modal.openMaps", "In Karten öffnen")}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{post.place_label}</span>
                {post.country && <span>· {post.country}</span>}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <DialogTitle className="text-2xl font-display uppercase tracking-tight">
                {post.place_label}
              </DialogTitle>
              {post.quote && (
                <blockquote className="border-l-2 border-primary/60 pl-3 text-base italic leading-relaxed text-foreground/90">
                  {`\u201E${post.quote}\u201C`}
                  {post.quote_reference && (
                    <footer className="mt-1 text-sm not-italic text-muted-foreground">
                      {post.quote_reference}
                    </footer>
                  )}
                </blockquote>
              )}
              {post.story && (
                <DialogDescription className="text-base leading-relaxed">
                  {post.story}
                </DialogDescription>
              )}
            </DialogHeader>

            {hasCoords && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("crossways.modal.mapLabel", "Standort")}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("crossways.modal.zoomOut", "Weiter herauszoomen")}
                      disabled={zoom <= MIN_ZOOM}
                      onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 2))}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("crossways.modal.zoomIn", "Näher heranzoomen")}
                      disabled={zoom >= MAX_ZOOM}
                      onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 2))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CrossMap
                  posts={[post]}
                  center={[post.lat as number, post.lng as number]}
                  zoom={zoom}
                  height="240px"
                  onMarkerClick={openExternalMaps}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {t("crossways.modal.pinHint", "Nadel antippen, um die Adresse in Karten zu öffnen")}
                  </p>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={openExternalMaps}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("crossways.modal.openMaps", "In Karten öffnen")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant={prayed ? "secondary" : "outline"}
                size="default"
                disabled={prayed}
                onClick={() => onReact(post.id, "prayer")}
                className="gap-2"
              >
                <HandHeart className="h-4 w-4" />
                {prayed ? t("crossways.card.prayed") : t("crossways.card.prayer")}
                <span className="text-xs text-muted-foreground">{post.prayer_count}</span>
              </Button>

              <Button
                variant={amened ? "secondary" : "outline"}
                size="default"
                disabled={amened}
                onClick={() => onReact(post.id, "amen")}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {t("crossways.card.amen")}
                <span className="text-xs text-muted-foreground">{post.amen_count}</span>
              </Button>

              <Button variant="outline" size="default" onClick={copyLink} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {copied
                  ? t("crossways.modal.linkCopied", "Link kopiert")
                  : t("crossways.modal.copyLink", "Link kopieren")}
              </Button>
            </div>
          </div>
        </div>

        {/* Full-screen photo overlay: the whole motif, never cropped. */}
        {lightbox && post.image_url && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("crossways.modal.openLightbox", "Foto im Vollbild anzeigen")}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-foreground/95 p-4 animate-in fade-in"
          >
            <img
              src={post.image_url}
              alt={t("crossways.card.imageAlt", { place: post.place_label })}
              className="max-h-full max-w-full object-contain"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4"
              aria-label={t("crossways.modal.closeLightbox", "Vollbild schliessen")}
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

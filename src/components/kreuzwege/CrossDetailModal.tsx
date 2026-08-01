import { useTranslation } from "react-i18next";
import { MapPin, HandHeart, Sparkles } from "lucide-react";
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

export function CrossDetailModal({ post, open, onOpenChange, hasReacted, onReact }: Props) {
  const { t } = useTranslation();

  if (!post) return null;

  const prayed = hasReacted(post.id, "prayer");
  const amened = hasReacted(post.id, "amen");
  const hasCoords = post.lat != null && post.lng != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="max-h-[80vh] overflow-y-auto">
          {post.image_url && (
            <img
              src={post.image_url}
              alt={t("crossways.card.imageAlt", { place: post.place_label })}
              className="aspect-[16/10] w-full object-cover"
            />
          )}

          <div className="p-6 space-y-5">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{post.place_label}</span>
                {post.country && <span>· {post.country}</span>}
              </div>
              <DialogTitle className="text-2xl font-display uppercase tracking-tight">
                {post.place_label}
              </DialogTitle>
              {post.story && (
                <DialogDescription className="text-base leading-relaxed">
                  {post.story}
                </DialogDescription>
              )}
            </DialogHeader>

            {hasCoords && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("crossways.modal.mapLabel", "Standort")}
                </p>
                <CrossMap
                  posts={[post]}
                  center={[post.lat as number, post.lng as number]}
                  zoom={13}
                  height="240px"
                />
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

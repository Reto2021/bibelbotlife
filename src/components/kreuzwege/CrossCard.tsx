import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  HandHeart,
  Share2,
  Sparkles,
  Flag,
  FlagOff,
} from "lucide-react";
import type { CrossInteraction, CrossPost } from "@/hooks/use-cross-posts";
import { getCrossPostUrl } from "@/hooks/use-cross-posts";
import { useToast } from "@/hooks/use-toast";

interface Props {
  post: CrossPost;
  hasReacted: (id: string, kind: CrossInteraction) => boolean;
  onReact: (id: string, kind: CrossInteraction) => void;
  /** Opens the detail overlay showing the full, uncropped photo. */
  onOpen?: (id: string) => void;
}

export function CrossCard({ post, hasReacted, onReact, onOpen }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const prayed = hasReacted(post.id, "prayer");
  const amened = hasReacted(post.id, "amen");
  const reported = hasReacted(post.id, "report");

  async function share() {
    const url = getCrossPostUrl(post);
    const text = t("crossways.card.shareText", { place: post.place_label });
    let completed = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("crossways.card.shareTitle"), text, url });
        completed = true;
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        completed = true;
        toast({ title: t("crossways.card.linkCopied") });
      }
    } catch {
      /* abgebrochen */
    }
    if (completed) onReact(post.id, "share");
  }

  function report() {
    onReact(post.id, "report");
    toast({ title: t("crossways.card.reportSentTitle"), description: t("crossways.card.reportSentDesc") });
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
      {post.image_url && (
        <button
          type="button"
          onClick={() => onOpen?.(post.id)}
          aria-label={t("crossways.card.openPhoto", "Foto gross anzeigen")}
          className="group block w-full cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={post.image_url}
            alt={t("crossways.card.imageAlt", { place: post.place_label })}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{post.place_label}</span>
          {post.country && <span>· {post.country}</span>}
        </div>

        {post.quote && (
          <blockquote className="border-l-2 border-primary/60 pl-3 text-sm italic leading-relaxed text-foreground/90">
            {`\u201E${post.quote}\u201C`}
            {post.quote_reference && (
              <footer className="mt-1 text-xs not-italic text-muted-foreground">
                {post.quote_reference}
              </footer>
            )}
          </blockquote>
        )}

        {post.story && (
          <p className="text-sm leading-relaxed text-muted-foreground">{post.story}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {post.is_anonymous || !post.author_name ? t("crossways.card.anonymous") : post.author_name}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <Button
            variant={prayed ? "secondary" : "outline"}
            size="sm"
            disabled={prayed}
            onClick={() => onReact(post.id, "prayer")}
            className="gap-1.5"
          >
            <HandHeart className="h-4 w-4" />
            {prayed ? t("crossways.card.prayed") : t("crossways.card.prayer")}
            <span className="text-xs text-muted-foreground">{post.prayer_count}</span>
          </Button>

          <Button
            variant={amened ? "secondary" : "ghost"}
            size="sm"
            disabled={amened}
            onClick={() => onReact(post.id, "amen")}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {t("crossways.card.amen")}
            <span className="text-xs text-muted-foreground">{post.amen_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={share}
            className="ml-auto gap-1.5"
            aria-label={t("crossways.card.share")}
          >
            <Share2 className="h-4 w-4" />
            {t("crossways.card.share")}
            {post.share_count > 0 && (
              <span className="text-xs text-muted-foreground">{post.share_count}</span>
            )}
          </Button>

          <Button
            variant={reported ? "secondary" : "ghost"}
            size="sm"
            disabled={reported}
            onClick={report}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            aria-label={t("crossways.card.report")}
          >
            {reported ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
            {reported ? t("crossways.card.reported") : t("crossways.card.report")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, HandHeart, Share2 } from "lucide-react";
import type { CrossPost } from "@/hooks/use-cross-posts";
import { useToast } from "@/hooks/use-toast";

interface Props {
  post: CrossPost;
  hasPrayed: boolean;
  onPray: (id: string) => void;
}

export function CrossCard({ post, hasPrayed, onPray }: Props) {
  const { toast } = useToast();

  async function share() {
    const url = `${window.location.origin}/kreuzwege`;
    const text = `${post.place_label} – Kreuzwege auf BibleBot.Life`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kreuzwege", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: "Link kopiert" });
      }
    } catch {
      /* abgebrochen */
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
      {post.image_url && (
        <img
          src={post.image_url}
          alt={`Kreuz bei ${post.place_label}`}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{post.place_label}</span>
          {post.country && <span>· {post.country}</span>}
        </div>

        {post.story && (
          <p className="text-sm leading-relaxed text-muted-foreground">{post.story}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {post.is_anonymous || !post.author_name ? "Anonym" : post.author_name}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant={hasPrayed ? "secondary" : "ghost"}
              size="sm"
              disabled={hasPrayed}
              onClick={() => onPray(post.id)}
              className="gap-1.5"
            >
              <HandHeart className="h-4 w-4" />
              {post.prayer_count}
            </Button>
            <Button variant="ghost" size="sm" onClick={share} aria-label="Teilen">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

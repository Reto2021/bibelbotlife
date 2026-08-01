import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  HandHeart,
  Share2,
  Sparkles,
  Flag,
  FlagOff,
} from "lucide-react";
import type { CrossInteraction, CrossPost } from "@/hooks/use-cross-posts";
import { useToast } from "@/hooks/use-toast";

interface Props {
  post: CrossPost;
  hasReacted: (id: string, kind: CrossInteraction) => boolean;
  onReact: (id: string, kind: CrossInteraction) => void;
}

export function CrossCard({ post, hasReacted, onReact }: Props) {
  const { toast } = useToast();
  const prayed = hasReacted(post.id, "prayer");
  const amened = hasReacted(post.id, "amen");
  const reported = hasReacted(post.id, "report");

  async function share() {
    const url = `${window.location.origin}/kreuzwege`;
    const text = `${post.place_label} – Kreuzwege auf BibleBot.Life`;
    let completed = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kreuzwege", text, url });
        completed = true;
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        completed = true;
        toast({ title: "Link kopiert" });
      }
    } catch {
      /* abgebrochen */
    }
    if (completed) onReact(post.id, "share");
  }

  function report() {
    onReact(post.id, "report");
    toast({ title: "Meldung gesendet", description: "Danke, wir prüfen den Beitrag." });
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

        <p className="text-xs text-muted-foreground">
          {post.is_anonymous || !post.author_name ? "Anonym" : post.author_name}
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
            {prayed ? "Im Gebet" : "Ein Gebet dafür"}
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
            Amen
            <span className="text-xs text-muted-foreground">{post.amen_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={share}
            className="ml-auto gap-1.5"
            aria-label="Teilen"
          >
            <Share2 className="h-4 w-4" />
            Teilen
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
            aria-label="Melden"
          >
            {reported ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
            {reported ? "Gemeldet" : "Melden"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

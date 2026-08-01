import { CrossCard } from "./CrossCard";
import type { CrossInteraction, CrossPost } from "@/hooks/use-cross-posts";

interface Props {
  posts: CrossPost[];
  hasReacted: (id: string, kind: CrossInteraction) => boolean;
  onReact: (id: string, kind: CrossInteraction) => void;
}

export function CrossFeed({ posts, hasReacted, onReact }: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Noch keine Kreuze veröffentlicht. Sei der erste Beitrag.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <CrossCard key={p.id} post={p} hasReacted={hasReacted} onReact={onReact} />
      ))}
    </div>
  );
}

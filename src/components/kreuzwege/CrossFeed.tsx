import { CrossCard } from "./CrossCard";
import type { CrossPost } from "@/hooks/use-cross-posts";

interface Props {
  posts: CrossPost[];
  prayed: Set<string>;
  onPray: (id: string) => void;
}

export function CrossFeed({ posts, prayed, onPray }: Props) {
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
        <CrossCard key={p.id} post={p} hasPrayed={prayed.has(p.id)} onPray={onPray} />
      ))}
    </div>
  );
}

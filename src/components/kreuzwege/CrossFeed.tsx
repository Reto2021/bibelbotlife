import { useTranslation } from "react-i18next";
import { CrossCard } from "./CrossCard";
import type { CrossInteraction, CrossPost } from "@/hooks/use-cross-posts";

interface Props {
  posts: CrossPost[];
  hasReacted: (id: string, kind: CrossInteraction) => boolean;
  onReact: (id: string, kind: CrossInteraction) => void;
  onOpen?: (id: string) => void;
}

export function CrossFeed({ posts, hasReacted, onReact, onOpen }: Props) {
  const { t } = useTranslation();
  if (posts.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        {t("crossways.empty")}
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <CrossCard key={p.id} post={p} hasReacted={hasReacted} onReact={onReact} onOpen={onOpen} />
      ))}
    </div>
  );
}

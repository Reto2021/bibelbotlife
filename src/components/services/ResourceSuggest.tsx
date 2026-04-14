import { useState, useMemo, useRef, useEffect } from "react";
import { Music, BookOpen, HandHeart, Tag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useResources, type Resource } from "@/hooks/use-resources";
import type { BlockType } from "./ServiceBlock";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  song: <Music className="h-3.5 w-3.5" />,
  prayer: <HandHeart className="h-3.5 w-3.5" />,
  reading: <BookOpen className="h-3.5 w-3.5" />,
  liturgy: <BookOpen className="h-3.5 w-3.5" />,
  other: <Tag className="h-3.5 w-3.5" />,
};

/** Maps block types to the resource_type they should search. "any" = show all types. */
const BLOCK_TO_RESOURCE: Record<BlockType, string | "any"> = {
  song: "song",
  reading: "reading",
  prayer: "prayer",
  liturgy: "liturgy",
  sermon: "any",
  blessing: "prayer",
  communion: "liturgy",
  announcement: "any",
  free: "any",
  music: "song",
};

interface ResourceSuggestProps {
  query: string;
  blockType: BlockType;
  onSelect: (resource: Resource) => void;
  visible: boolean;
}

export function ResourceSuggest({ query, blockType, onSelect, visible }: ResourceSuggestProps) {
  const { data: resources = [] } = useResources();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const resourceType = BLOCK_TO_RESOURCE[blockType];

  const suggestions = useMemo(() => {
    if (!query || query.length < 2 || !visible) return [];
    const q = query.toLowerCase();
    return resources
      .filter((r) => {
        // Filter by resource type if block has a specific matching type
        if (resourceType !== "any" && r.resource_type !== resourceType) return false;
        return (
          r.title.toLowerCase().includes(q) ||
          (r.content ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [resources, query, resourceType, visible]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length, query]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
    >
      <div className="p-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Vorschläge aus Bibliothek
        </p>
        {suggestions.map((r, i) => (
          <button
            key={r.id}
            className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex items-start gap-2.5 ${
              i === selectedIndex ? "bg-accent" : "hover:bg-muted"
            }`}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent blur before click fires
              onSelect(r);
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <div className="mt-0.5 text-primary shrink-0">{TYPE_ICONS[r.resource_type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
              {r.content && (
                <p className="text-xs text-muted-foreground line-clamp-1">{r.content}</p>
              )}
              {(r.tags ?? []).length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {(r.tags ?? []).slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] px-1 py-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

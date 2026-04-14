import { useState, useMemo } from "react";
import { BookOpen, Music, HandHeart, Search, Tag, Filter, Plus, X, BookOpenText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResources, type Resource } from "@/hooks/use-resources";
import type { Database } from "@/integrations/supabase/types";

type ResourceType = Database["public"]["Enums"]["resource_type"];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  song: <Music className="h-4 w-4" />,
  prayer: <HandHeart className="h-4 w-4" />,
  reading: <BookOpenText className="h-4 w-4" />,
  liturgy: <BookOpen className="h-4 w-4" />,
  other: <Tag className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  song: "Lied",
  prayer: "Gebet",
  reading: "Lesung",
  liturgy: "Liturgie",
  other: "Sonstiges",
};

const MOOD_TAGS = ["freudig", "nachdenklich", "feierlich", "ruhig", "dankbar", "tröstend"];
const CEREMONY_TAGS = ["taufe", "hochzeit", "abdankung", "konfirmation", "abendmahl"];
const SEASON_TAGS = ["advent", "weihnachten", "passion", "ostern", "pfingsten", "erntedank"];

interface ResourceSidebarProps {
  onSelect: (resource: Resource) => void;
  onClose: () => void;
}

export function ResourceSidebar({ onSelect, onClose }: ResourceSidebarProps) {
  const { data: resources = [], isLoading } = useResources();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => (r.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== "all" && r.resource_type !== typeFilter) return false;
      if (activeTag && !(r.tags ?? []).includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.content ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, typeFilter, activeTag, search]);

  const quickTags = useMemo(() => {
    const present = new Set(allTags.map((t) => t.toLowerCase()));
    const categories = [
      { label: "Stimmung", tags: MOOD_TAGS.filter((t) => present.has(t)) },
      { label: "Zeremonie", tags: CEREMONY_TAGS.filter((t) => present.has(t)) },
      { label: "Kirchenjahr", tags: SEASON_TAGS.filter((t) => present.has(t)) },
    ].filter((c) => c.tags.length > 0);
    return categories;
  }, [allTags]);

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          Bibliothek
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | "all")}>
          <SelectTrigger className="h-8 text-sm">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                <span className="flex items-center gap-1.5">{TYPE_ICONS[k]} {v}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Tag Filters */}
      {quickTags.length > 0 && (
        <div className="p-3 border-b space-y-2">
          {quickTags.map((cat) => (
            <div key={cat.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{cat.label}</p>
              <div className="flex flex-wrap gap-1">
                {cat.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={activeTag === tag ? "default" : "outline"}
                    className="text-[10px] cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-6">Laden…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {resources.length === 0 ? "Noch keine Ressourcen." : "Keine Treffer."}
            </p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-2.5 py-2.5 rounded-md hover:bg-muted transition-colors flex items-start gap-2.5"
                onClick={() => onSelect(r)}
              >
                <div className="mt-0.5 text-primary shrink-0">{TYPE_ICONS[r.resource_type]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  </div>
                  {r.content && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.content}</p>
                  )}
                  {(r.tags ?? []).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(r.tags ?? []).slice(0, 4).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t">
        <p className="text-[10px] text-muted-foreground text-center">
          {filtered.length} von {resources.length} Ressourcen
        </p>
      </div>
    </div>
  );
}

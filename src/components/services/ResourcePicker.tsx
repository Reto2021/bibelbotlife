import { useState, useMemo } from "react";
import { BookOpen, Music, HandHeart, Search, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResources, type Resource } from "@/hooks/use-resources";
import type { Database } from "@/integrations/supabase/types";

type ResourceType = Database["public"]["Enums"]["resource_type"];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  song: <Music className="h-4 w-4" />,
  prayer: <HandHeart className="h-4 w-4" />,
  reading: <BookOpen className="h-4 w-4" />,
  liturgy: <BookOpen className="h-4 w-4" />,
  other: <Tag className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  song: "Lied", prayer: "Gebet", reading: "Lesung", liturgy: "Liturgie", other: "Sonstiges",
};

interface ResourcePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (resource: Resource) => void;
  filterType?: ResourceType;
}

export function ResourcePicker({ open, onOpenChange, onSelect, filterType }: ResourcePickerProps) {
  const { data: resources = [], isLoading } = useResources();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">(filterType ?? "all");

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== "all" && r.resource_type !== typeFilter) return false;
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
  }, [resources, typeFilter, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aus Bibliothek einfügen</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {!filterType && (
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | "all")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Laden…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {resources.length === 0 ? "Noch keine Ressourcen in der Bibliothek." : "Keine Treffer."}
            </p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-3 rounded-md hover:bg-muted transition-colors flex items-start gap-3"
                onClick={() => {
                  onSelect(r);
                  onOpenChange(false);
                }}
              >
                <div className="mt-0.5 text-primary shrink-0">{TYPE_ICONS[r.resource_type]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {TYPE_LABELS[r.resource_type] ?? r.resource_type}
                    </Badge>
                  </div>
                  {r.content && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.content}</p>
                  )}
                  {(r.tags ?? []).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {(r.tags ?? []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Music, HandHeart, BookOpenText, Plus, Search,
  Pencil, Trash2, X, Tag, Filter, MoreHorizontal, Globe, Church,
  Download, Library,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useResources, useCreateResource, useUpdateResource, useDeleteResource,
  useImportSystemResource,
  type Resource,
} from "@/hooks/use-resources";
import { useUserChurch } from "@/hooks/use-user-church";
import type { Database } from "@/integrations/supabase/types";

type ResourceType = Database["public"]["Enums"]["resource_type"];

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: React.ReactNode }[] = [
  { value: "song", label: "Lied", icon: <Music className="h-4 w-4" /> },
  { value: "prayer", label: "Gebet", icon: <HandHeart className="h-4 w-4" /> },
  { value: "reading", label: "Lesung", icon: <BookOpenText className="h-4 w-4" /> },
  { value: "liturgy", label: "Liturgie", icon: <BookOpen className="h-4 w-4" /> },
  { value: "other", label: "Sonstiges", icon: <Tag className="h-4 w-4" /> },
];

const TRADITIONS = [
  { value: "reformed", label: "Reformiert" },
  { value: "catholic", label: "Katholisch" },
  { value: "lutheran", label: "Lutherisch" },
  { value: "evangelical", label: "Evangelikal" },
];

const COUNTRIES = [
  { value: "CH", label: "🇨🇭 Schweiz" },
  { value: "DE", label: "🇩🇪 Deutschland" },
  { value: "AT", label: "🇦🇹 Österreich" },
  { value: "INT", label: "🌍 International" },
];

const FIXED_TAG_CATEGORIES = [
  {
    label: "Stimmung",
    tags: ["freudig", "nachdenklich", "feierlich", "ruhig", "dankbar", "tröstend", "hoffnungsvoll", "andächtig"],
  },
  {
    label: "Zeremonie",
    tags: ["taufe", "hochzeit", "abdankung", "konfirmation", "abendmahl", "segnung"],
  },
  {
    label: "Kirchenjahr",
    tags: ["advent", "weihnachten", "passion", "ostern", "pfingsten", "erntedank", "reformationsonntag", "ewigkeitssonntag"],
  },
];

const typeLabel = (t: ResourceType) => RESOURCE_TYPES.find((r) => r.value === t)?.label ?? t;
const typeIcon = (t: ResourceType) => RESOURCE_TYPES.find((r) => r.value === t)?.icon;

interface FormState {
  title: string;
  content: string;
  resource_type: ResourceType;
  tags: string[];
  tagInput: string;
}

const emptyForm: FormState = { title: "", content: "", resource_type: "song", tags: [], tagInput: "" };

export default function ResourceLibrary() {
  const { data: resources = [], isLoading } = useResources();
  const { data: church } = useUserChurch();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const importResource = useImportSystemResource();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [filterTag, setFilterTag] = useState<string | "all">("all");
  const [filterTradition, setFilterTradition] = useState<string | "all">("all");
  const [filterCountry, setFilterCountry] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "system">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const myResources = useMemo(() => resources.filter(r => !r.is_system), [resources]);
  const systemResources = useMemo(() => resources.filter(r => r.is_system), [resources]);

  // Collect all tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => (r.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [resources]);

  // Filter & search
  const filtered = useMemo(() => {
    const base = activeTab === "mine" ? myResources : activeTab === "system" ? systemResources : resources;
    return base.filter((r) => {
      if (filterType !== "all" && r.resource_type !== filterType) return false;
      if (filterTag !== "all" && !(r.tags ?? []).includes(filterTag)) return false;
      if (filterTradition !== "all" && r.tradition !== filterTradition) return false;
      if (filterCountry !== "all" && r.country !== filterCountry) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.content ?? "").toLowerCase().includes(q) ||
          (r.hymnal_ref ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, myResources, systemResources, activeTab, filterType, filterTag, filterTradition, filterCountry, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: Resource) => {
    setEditingId(r.id);
    setForm({
      title: r.title,
      content: r.content ?? "",
      resource_type: r.resource_type,
      tags: r.tags ?? [],
      tagInput: "",
    });
    setDialogOpen(true);
  };

  const addTag = () => {
    const tag = form.tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag], tagInput: "" }));
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Titel ist erforderlich");
      return;
    }

    try {
      if (editingId) {
        await updateResource.mutateAsync({
          id: editingId,
          title: form.title.trim(),
          content: form.content.trim() || null,
          resource_type: form.resource_type,
          tags: form.tags,
        });
        toast.success("Ressource aktualisiert");
      } else {
        await createResource.mutateAsync({
          title: form.title.trim(),
          content: form.content.trim() || null,
          resource_type: form.resource_type,
          tags: form.tags,
          church_id: church?.id ?? null,
        });
        toast.success("Ressource erstellt");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource.mutateAsync(id);
      toast.success("Ressource gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleImport = async (r: Resource) => {
    try {
      await importResource.mutateAsync(r);
      toast.success(`«${r.title}» in deine Bibliothek kopiert`);
    } catch {
      toast.error("Fehler beim Importieren");
    }
  };

  const ResourceCard = ({ r }: { r: Resource }) => (
    <Card key={r.id} className="group hover:shadow-md transition-shadow">
      <CardContent className="py-4 px-5 flex items-start gap-4">
        <div className="mt-1 text-primary">{typeIcon(r.resource_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
            <Badge variant="secondary" className="text-xs shrink-0">
              {typeLabel(r.resource_type)}
            </Badge>
            {r.is_system && (
              <Badge variant="outline" className="text-xs shrink-0 border-primary/30 text-primary">
                <Library className="h-3 w-3 mr-1" />
                Katalog
              </Badge>
            )}
            {r.hymnal_ref && (
              <Badge variant="outline" className="text-xs shrink-0 font-mono">
                {r.hymnal_ref}
              </Badge>
            )}
            {r.tradition && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Church className="h-3 w-3 mr-1" />
                {TRADITIONS.find(t => t.value === r.tradition)?.label ?? r.tradition}
              </Badge>
            )}
            {r.country && (
              <span className="text-xs text-muted-foreground">
                {COUNTRIES.find(c => c.value === r.country)?.label ?? r.country}
              </span>
            )}
          </div>
          {r.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.content}</p>
          )}
          {(r.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(r.tags ?? []).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {r.is_system ? (
          <Button
            variant="outline"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => handleImport(r)}
            disabled={importResource.isPending}
          >
            <Download className="h-4 w-4 mr-1" /> Importieren
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(r)}>
                <Pencil className="h-4 w-4 mr-2" /> Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bibliothek</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Neue Ressource
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">Alle ({resources.length})</TabsTrigger>
          <TabsTrigger value="mine">Meine ({myResources.length})</TabsTrigger>
          <TabsTrigger value="system">
            <Globe className="h-4 w-4 mr-1" />
            Katalog ({systemResources.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as ResourceType | "all")}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {RESOURCE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex items-center gap-1.5">{t.icon} {t.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTradition} onValueChange={(v) => setFilterTradition(v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Church className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Konfession" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Konfessionen</SelectItem>
            {TRADITIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Globe className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Regionen</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={filterTag} onValueChange={(v) => setFilterTag(v)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Tag className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Tags</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {resources.length === 0
                ? "Noch keine Ressourcen vorhanden. Erstelle dein erstes Lied, Gebet oder eine Lesung."
                : "Keine Ergebnisse für diese Filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Ressource bearbeiten" : "Neue Ressource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Titel *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="z.B. «Lobe den Herren» oder «Ps 23»"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Typ</label>
              <Select
                value={form.resource_type}
                onValueChange={(v) => setForm((f) => ({ ...f, resource_type: v as ResourceType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-1.5">{t.icon} {t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Inhalt / Text</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Liedtext, Gebetstext oder Lesungstext…"
                rows={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tags</label>
              {/* Fixed category quick-picks */}
              <div className="space-y-2 mb-3">
                {FIXED_TAG_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p className="text-xs text-muted-foreground mb-1">{cat.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={form.tags.includes(tag) ? "default" : "outline"}
                          className="text-xs cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            if (form.tags.includes(tag)) {
                              removeTag(tag);
                            } else {
                              setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Free tag input */}
              <div className="flex gap-2 mb-2">
                <Input
                  value={form.tagInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                  placeholder="Eigener Tag…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={createResource.isPending || updateResource.isPending}
            >
              {editingId ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

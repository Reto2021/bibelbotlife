import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Music, HandHeart, BookOpenText, Plus, Search,
  Pencil, Trash2, X, Tag, Filter, MoreHorizontal, Globe, Church,
  Download, Library, ChevronDown, ChevronUp, Copy, MessageCircle, Share2, Users,
  Paperclip, FileText, FileAudio, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { openBibleBotChat } from "@/lib/chat-events";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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

const LANGUAGES = [
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "en", label: "🇬🇧 English" },
  { value: "fr", label: "🇫🇷 Français" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "it", label: "🇮🇹 Italiano" },
  { value: "pt", label: "🇵🇹 Português" },
  { value: "nl", label: "🇳🇱 Nederlands" },
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
const isAudioFile = (name: string) => /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(name);

function InlineAudioPlayer({ attachmentPath }: { attachmentPath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    supabase.storage
      .from("resource-attachments")
      .createSignedUrl(attachmentPath, 3600)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.signedUrl) setUrl(data.signedUrl);
        else setError(true);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attachmentPath]);

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Audio…</div>;
  if (error || !url) return <p className="text-sm text-destructive">Audio konnte nicht geladen werden</p>;
  return (
    <audio controls preload="metadata" className="w-full max-w-md h-10 rounded-lg">
      <source src={url} />
    </audio>
  );
}

interface FormState {
  title: string;
  content: string;
  resource_type: ResourceType;
  tags: string[];
  tagInput: string;
  language: string;
  attachment_url: string | null;
  attachment_name: string | null;
}

const emptyForm = (lang: string): FormState => ({ title: "", content: "", resource_type: "song", tags: [], tagInput: "", language: lang, attachment_url: null, attachment_name: null });

export default function ResourceLibrary() {
  const { i18n } = useTranslation();
  const defaultLang = i18n.language?.slice(0, 2) || "de";
  const { data: resources = [], isLoading } = useResources();
  const { user } = useAuth();
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
  const [filterLanguage, setFilterLanguage] = useState<string>(defaultLang);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "system">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultLang));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
      if (filterLanguage !== "all" && r.language !== filterLanguage) return false;
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
  }, [resources, myResources, systemResources, activeTab, filterType, filterTag, filterTradition, filterCountry, filterLanguage, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(defaultLang));
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
      language: r.language ?? defaultLang,
      attachment_url: r.attachment_url ?? null,
      attachment_name: r.attachment_name ?? null,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Datei zu gross (max. 20 MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("resource-attachments")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("resource-attachments")
        .getPublicUrl(path);
      // For private buckets we use signed URLs, but store the path
      setForm((f) => ({ ...f, attachment_url: path, attachment_name: file.name }));
      toast.success("Datei hochgeladen");
    } catch {
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setForm((f) => ({ ...f, attachment_url: null, attachment_name: null }));
  };

  const getAttachmentUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("resource-attachments")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const handleDownloadAttachment = async (r: Resource) => {
    if (!r.attachment_url) return;
    const url = await getAttachmentUrl(r.attachment_url);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Datei konnte nicht geöffnet werden");
    }
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
          language: form.language,
          attachment_url: form.attachment_url,
          attachment_name: form.attachment_name,
        });
        toast.success("Ressource aktualisiert");
      } else {
        await createResource.mutateAsync({
          title: form.title.trim(),
          content: form.content.trim() || null,
          resource_type: form.resource_type,
          tags: form.tags,
          language: form.language,
          church_id: church?.id ?? null,
          attachment_url: form.attachment_url,
          attachment_name: form.attachment_name,
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

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("In Zwischenablage kopiert");
  };

  const handleToggleShare = async (r: Resource) => {
    try {
      const newVal = !r.shared_with_church;
      await updateResource.mutateAsync({
        id: r.id,
        shared_with_church: newVal,
        church_id: church?.id ?? r.church_id ?? null,
      });
      toast.success(newVal ? "Ressource mit Team geteilt" : "Teilen aufgehoben");
    } catch {
      toast.error("Fehler beim Ändern der Freigabe");
    }
  };

  const handleChatDeepen = (r: Resource) => {
    const prefix = r.resource_type === "reading"
      ? "Erkläre mir diese Bibelstelle:"
      : r.resource_type === "prayer"
      ? "Erzähle mir mehr über dieses Gebet:"
      : "Erzähle mir mehr über:";
    openBibleBotChat(`${prefix} ${r.title}`);
  };

  const ResourceCard = ({ r }: { r: Resource }) => {
    const isExpanded = expandedIds.has(r.id);
    return (
      <Card key={r.id} className="group hover:shadow-md transition-shadow">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-4">
            <button
              className="mt-1 text-primary cursor-pointer"
              onClick={() => toggleExpand(r.id)}
              aria-label={isExpanded ? "Zuklappen" : "Aufklappen"}
            >
              {typeIcon(r.resource_type)}
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(r.id)}>
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
                {r.attachment_url && (
                  <span title={r.attachment_name ?? "Anhang"}><Paperclip className="h-3 w-3 text-muted-foreground shrink-0" /></span>
                )}
                {r.shared_with_church && !r.is_system && (
                  <Badge variant="outline" className="text-xs shrink-0 border-green-500/30 text-green-600 dark:text-green-400">
                    <Users className="h-3 w-3 mr-1" />
                    Geteilt
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
                {r.language && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {LANGUAGES.find(l => l.value === r.language)?.label ?? r.language}
                  </Badge>
                )}
              </div>
              {r.content && !isExpanded && (
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
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleExpand(r.id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {r.is_system ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4 mr-2" /> Bearbeiten
                    </DropdownMenuItem>
                    {church && (
                      <DropdownMenuItem onClick={() => handleToggleShare(r)}>
                        {r.shared_with_church ? (
                          <><Users className="h-4 w-4 mr-2" /> Teilen aufheben</>
                        ) : (
                          <><Share2 className="h-4 w-4 mr-2" /> Mit Team teilen</>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {/* Expanded content */}
          {isExpanded && r.content && (
            <div className="mt-3 ml-10 border-t pt-3 space-y-3">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {r.content}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyContent(r.content!)}
                >
                  <Copy className="h-4 w-4 mr-1" /> Kopieren
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChatDeepen(r)}
                >
                <MessageCircle className="h-4 w-4 mr-1" /> Im Chat vertiefen
                </Button>
                {r.attachment_url && r.attachment_name && isAudioFile(r.attachment_name) && (
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileAudio className="h-3 w-3" />{r.attachment_name}</p>
                    <InlineAudioPlayer attachmentPath={r.attachment_url} />
                  </div>
                )}
                {r.attachment_url && r.attachment_name && !isAudioFile(r.attachment_name) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadAttachment(r)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {r.attachment_name}
                  </Button>
                )}
          )}
          {isExpanded && !r.content && (
            <div className="mt-3 ml-10 border-t pt-3 space-y-3">
              <p className="text-sm text-muted-foreground italic">Kein Inhalt hinterlegt.</p>
              {r.attachment_url && r.attachment_name && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadAttachment(r)}
                >
                  {r.attachment_name.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                    <FileAudio className="h-4 w-4 mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  {r.attachment_name}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
        <Select value={filterLanguage} onValueChange={(v) => setFilterLanguage(v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Globe className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Sprache" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Sprachen</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
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
              <label className="text-sm font-medium text-foreground mb-1 block">Sprache</label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* File attachment */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                <Paperclip className="h-4 w-4 inline mr-1" />
                Anhang (PDF, Noten, Audio)
              </label>
              {form.attachment_name ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  {form.attachment_name.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                    <FileAudio className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm flex-1 truncate">{form.attachment_name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeAttachment}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.mp3,.wav,.ogg,.m4a,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Laden…</>
                    ) : (
                      <><Paperclip className="h-4 w-4 mr-1" /> Datei wählen</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max. 20 MB · PDF, Audio, Bilder</p>
                </div>
              )}
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

import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Save, Clock, Plus, Play, Library, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceBlock, type ServiceBlockData, type BlockType } from "@/components/services/ServiceBlock";
import { BlockPalette } from "@/components/services/BlockPalette";
import { useAuth } from "@/hooks/use-auth";
import { useUserChurch } from "@/hooks/use-user-church";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResourcePicker } from "@/components/services/ResourcePicker";
import type { Resource } from "@/hooks/use-resources";
import { useTemplates, useCreateTemplate, type ServiceTemplate } from "@/hooks/use-templates";

export default function ServiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: church } = useUserChurch();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("Neuer Gottesdienst");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceTime, setServiceTime] = useState("10:00");
  const [serviceType, setServiceType] = useState("regular");
  const [tradition, setTradition] = useState("reformed");
  const [blocks, setBlocks] = useState<ServiceBlockData[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [bibleBotOpen, setBibleBotOpen] = useState(false);
  const [bibleBotContext, setBibleBotContext] = useState("");
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const [resourcePickerBlockId, setResourcePickerBlockId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(isNew);
  const { data: templates = [] } = useTemplates();
  const createTemplate = useCreateTemplate();
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !user) return;
    try {
      await createTemplate.mutateAsync({
        name: templateName.trim(),
        tradition: tradition,
        blocks: blocks,
        church_id: church?.id,
      });
      toast.success(`Vorlage «${templateName.trim()}» gespeichert`);
      setSaveAsTemplateOpen(false);
      setTemplateName("");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Speichern der Vorlage");
    }
  };

  // Load existing service
  useEffect(() => {
    if (isNew || !user || !id) return;
    setLoading(true);
    supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (data) {
          setTitle(data.title);
          setServiceDate(data.service_date);
          setServiceTime(data.service_time || "10:00");
          setServiceType(data.service_type);
          setTradition(data.tradition);
          setBlocks((data.blocks as unknown as ServiceBlockData[]) || []);
        }
        setLoading(false);
      });
  }, [id, isNew, user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: ServiceBlockData = {
      id: crypto.randomUUID(),
      type,
      title: "",
      content: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<ServiceBlockData>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const askBibleBot = useCallback((block: ServiceBlockData) => {
    const typeLabels: Record<string, string> = {
      song: "ein passendes Lied", reading: "eine passende Bibelstelle",
      sermon: "Predigtimpulse", prayer: "ein passendes Gebet",
      blessing: "einen Segenspruch", liturgy: "einen liturgischen Text",
    };
    const suggestion = typeLabels[block.type] || "einen Vorschlag";
    setBibleBotContext(`Für den Gottesdienst "${title}" am ${serviceDate}: Schlage mir ${suggestion} vor${block.title ? ` zum Thema "${block.title}"` : ""}.`);
    setBibleBotOpen(true);
  }, [title, serviceDate]);

  const totalDuration = blocks.reduce((sum, b) => sum + (b.duration || 0), 0);

  const pickResourceForBlock = useCallback((block: ServiceBlockData) => {
    setResourcePickerBlockId(block.id);
    setResourcePickerOpen(true);
  }, []);

  const handleResourceSelected = useCallback((resource: Resource) => {
    if (resourcePickerBlockId) {
      // Fill existing block with resource content
      updateBlock(resourcePickerBlockId, {
        title: resource.title,
        content: resource.content ?? "",
        metadata: { ...blocks.find(b => b.id === resourcePickerBlockId)?.metadata, resourceId: resource.id },
      });
    }
    setResourcePickerBlockId(null);
  }, [resourcePickerBlockId, updateBlock, blocks]);

  const addBlockFromResource = useCallback((resource: Resource) => {
    const typeMap: Record<string, BlockType> = {
      song: "song", prayer: "prayer", reading: "reading", liturgy: "liturgy", other: "free",
    };
    const blockType = typeMap[resource.resource_type] || "free";
    const newBlock: ServiceBlockData = {
      id: crypto.randomUUID(),
      type: blockType,
      title: resource.title,
      content: resource.content ?? "",
      metadata: { resourceId: resource.id },
    };
    setBlocks((prev) => [...prev, newBlock]);
    toast.success(`«${resource.title}» hinzugefügt`);
  }, []);

  const applyTemplate = useCallback((template: ServiceTemplate) => {
    const newBlocks = (template.blocks ?? []).map((b) => ({ ...b, id: crypto.randomUUID() }));
    setBlocks(newBlocks);
    setTradition(template.tradition);
    if (!title || title === "Neuer Gottesdienst") {
      setTitle(template.name);
    }
    setTemplatePickerOpen(false);
    toast.success(`Vorlage «${template.name}» angewendet`);
  }, [title]);

  const handleSave = async () => {
    if (!user || !church) return;
    setSaving(true);
    try {
      const payload = {
        title,
        service_date: serviceDate,
        service_time: serviceTime,
        service_type: serviceType as any,
        tradition: tradition as any,
        blocks: blocks as any,
        created_by: user.id,
        church_id: church.id,
      };

      if (isNew) {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
        toast.success("Gottesdienst erstellt");
      } else {
        const { error } = await supabase.from("services").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Gottesdienst gespeichert");
      }
      navigate("/dashboard/services");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Gottesdienst wird geladen...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Neuer Gottesdienst" : "Gottesdienst bearbeiten"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {totalDuration > 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {totalDuration} Min.
            </span>
          )}
          {!isNew && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/conductor/${id}`)}>
              <Play className="h-4 w-4 mr-2" />
              Live
            </Button>
          )}
          {blocks.length > 0 && (
            <Button variant="outline" onClick={() => { setTemplateName(title); setSaveAsTemplateOpen(true); }}>
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Als Vorlage
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Titel</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gottesdienst-Titel" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Datum</label>
              <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Uhrzeit</label>
              <Input type="time" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Typ</label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Sonntagsgottesdienst</SelectItem>
                  <SelectItem value="baptism">Taufe</SelectItem>
                  <SelectItem value="wedding">Trauung</SelectItem>
                  <SelectItem value="funeral">Abdankung</SelectItem>
                  <SelectItem value="confirmation">Konfirmation</SelectItem>
                  <SelectItem value="communion">Abendmahl</SelectItem>
                  <SelectItem value="special">Spezialgottesdienst</SelectItem>
                  <SelectItem value="other">Anderes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tradition</label>
              <Select value={tradition} onValueChange={setTradition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reformed">Reformiert</SelectItem>
                  <SelectItem value="catholic">Katholisch</SelectItem>
                  <SelectItem value="lutheran">Lutherisch</SelectItem>
                  <SelectItem value="evangelical">Evangelikal</SelectItem>
                  <SelectItem value="secular">Säkular / Frei</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Palette */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Block hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <BlockPalette onAdd={addBlock} />
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => { setResourcePickerBlockId(null); setResourcePickerOpen(true); }}
          >
            <Library className="h-4 w-4" /> Aus Bibliothek einfügen
          </Button>
        </CardContent>
      </Card>

      {/* Blocks */}
      <div className="space-y-2">
        {blocks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Füge Blöcke hinzu, um den Ablauf zu gestalten.</p>
              <p className="text-xs mt-1">Klicke oben auf einen Block-Typ oder ziehe Blöcke per Drag & Drop in die richtige Reihenfolge.</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <ServiceBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onAskBibleBot={askBibleBot}
                  onPickResource={pickResourceForBlock}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* BibleBot Dialog */}
      <Dialog open={bibleBotOpen} onOpenChange={setBibleBotOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💬 BibleBot fragen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kopiere diese Anfrage in den BibleBot-Chat:
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm">
              {bibleBotContext}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(bibleBotContext);
                  toast.success("In Zwischenablage kopiert");
                }}
              >
                Kopieren
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  window.open("/", "_blank");
                  setBibleBotOpen(false);
                }}
              >
                BibleBot öffnen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Picker */}
      <ResourcePicker
        open={resourcePickerOpen}
        onOpenChange={setResourcePickerOpen}
        onSelect={(resource) => {
          if (resourcePickerBlockId) {
            handleResourceSelected(resource);
          } else {
            addBlockFromResource(resource);
          }
        }}
      />

      {/* Template Picker (shown for new services) */}
      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vorlage auswählen</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Noch keine Vorlagen vorhanden.</p>
              <p className="text-xs mt-1">Du kannst Vorlagen unter «Vorlagen» im Menü erstellen.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors border border-border"
                  onClick={() => applyTemplate(t)}
                >
                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(t.blocks ?? []).length} Blöcke · {t.tradition === "reformed" ? "Reformiert" : t.tradition === "catholic" ? "Katholisch" : t.tradition === "lutheran" ? "Lutherisch" : t.tradition === "evangelical" ? "Evangelikal" : t.tradition}
                  </p>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setTemplatePickerOpen(false)}>
              Ohne Vorlage starten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

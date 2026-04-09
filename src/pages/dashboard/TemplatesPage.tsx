import { useState, useCallback } from "react";
import { Copy, Edit2, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, type ServiceTemplate } from "@/hooks/use-templates";
import { useUserChurch } from "@/hooks/use-user-church";
import { BlockPalette } from "@/components/services/BlockPalette";
import { ServiceBlock, type ServiceBlockData, type BlockType, BLOCK_LABELS } from "@/components/services/ServiceBlock";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

const TRADITION_LABELS: Record<string, string> = {
  reformed: "Reformiert",
  catholic: "Katholisch",
  lutheran: "Lutherisch",
  evangelical: "Evangelikal",
  secular: "Säkular / Frei",
};

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { data: church } = useUserChurch();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tradition, setTradition] = useState("reformed");
  const [blocks, setBlocks] = useState<ServiceBlockData[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openNew = () => {
    setEditId(null);
    setName("");
    setTradition("reformed");
    setBlocks([]);
    setEditOpen(true);
  };

  const openEdit = (t: ServiceTemplate) => {
    setEditId(t.id);
    setName(t.name);
    setTradition(t.tradition);
    setBlocks(t.blocks ?? []);
    setEditOpen(true);
  };

  const duplicateTemplate = (t: ServiceTemplate) => {
    setEditId(null);
    setName(`${t.name} (Kopie)`);
    setTradition(t.tradition);
    setBlocks(t.blocks ?? []);
    setEditOpen(true);
  };

  const addBlock = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, { id: crypto.randomUUID(), type, title: "", content: "" }]);
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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Bitte gib einen Namen ein.");
      return;
    }
    try {
      if (editId) {
        await updateTemplate.mutateAsync({ id: editId, name, tradition, blocks });
        toast.success("Vorlage aktualisiert");
      } else {
        await createTemplate.mutateAsync({ name, tradition, blocks, church_id: church?.id });
        toast.success("Vorlage erstellt");
      }
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Speichern");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Vorlage gelöscht");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Löschen");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gottesdienst-Vorlagen</h1>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Neue Vorlage
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-12">Laden…</p>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Noch keine Vorlagen erstellt.</p>
            <p className="text-xs mt-1">Erstelle eine Vorlage, um Gottesdienste schneller anzulegen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {TRADITION_LABELS[t.tradition] ?? t.tradition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  {(t.blocks ?? []).length} Blöcke: {(t.blocks ?? []).map((b) => BLOCK_LABELS[b.type] ?? b.type).join(", ") || "–"}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(t)}>
                    <Edit2 className="h-3.5 w-3.5" /> Bearbeiten
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => duplicateTemplate(t)}>
                    <Copy className="h-3.5 w-3.5" /> Kopieren
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Vorlage bearbeiten" : "Neue Vorlage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Sonntagsgottesdienst" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tradition</label>
                <Select value={tradition} onValueChange={setTradition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRADITION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Blöcke</label>
              <BlockPalette onAdd={addBlock} />
            </div>

            <div className="space-y-2">
              {blocks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Füge Blöcke hinzu, um den Standard-Ablauf zu definieren.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                      <ServiceBlock
                        key={block.id}
                        block={block}
                        onUpdate={updateBlock}
                        onDelete={deleteBlock}
                        onAskBibleBot={() => {}}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
              {editId ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Save, Clock, Plus, Play } from "lucide-react";
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
  const [bibleBotOpen, setBibleBotOpen] = useState(false);
  const [bibleBotContext, setBibleBotContext] = useState("");

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
        <CardContent className="pt-0">
          <BlockPalette onAdd={addBlock} />
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
    </div>
  );
}

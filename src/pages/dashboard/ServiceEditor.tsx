import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Save, Clock, Plus, Play, Library, BookmarkPlus, FileDown, FileText, Mail, Users, GripVertical, PanelRightOpen, PanelRightClose, Trash2, Copy, MoreVertical, Archive, Eye, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceBlock, type ServiceBlockData, type BlockType } from "@/components/services/ServiceBlock";
import { BlockPalette } from "@/components/services/BlockPalette";
import { useAuth } from "@/hooks/use-auth";
import { useUserChurch } from "@/hooks/use-user-church";
import { useTeam } from "@/hooks/use-team";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResourcePicker } from "@/components/services/ResourcePicker";
import { ResourceSidebar } from "@/components/services/ResourceSidebar";
import type { Resource } from "@/hooks/use-resources";
import { useTemplates, useCreateTemplate, type ServiceTemplate } from "@/hooks/use-templates";
import { exportServicePdf, exportServicePdfBlob } from "@/lib/export-service-pdf";
import { exportServiceDocx } from "@/lib/export-service-docx";
import { Label } from "@/components/ui/label";
import { useDeleteService, useDuplicateService, useUpdateServiceStatus } from "@/hooks/use-services";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const SERVICE_TYPE_TITLES: Record<string, string> = {
  regular: "Neuer Gottesdienst",
  baptism: "Taufgottesdienst",
  wedding: "Trauung",
  funeral: "Abdankung",
  confirmation: "Konfirmationsgottesdienst",
  communion: "Abendmahlsgottesdienst",
  special: "Spezialgottesdienst",
  other: "Anderer Gottesdienst",
};

export default function ServiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: church } = useUserChurch();
  const { data: teamMembers } = useTeam();
  const isNew = !id || id === "new";

  const initialType = (isNew && searchParams.get("type")) || "regular";
  const [title, setTitle] = useState(SERVICE_TYPE_TITLES[initialType] || "Neuer Gottesdienst");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceTime, setServiceTime] = useState("10:00");
  const [serviceType, setServiceType] = useState(initialType);
  const [tradition, setTradition] = useState("reformed");
  const [blocks, setBlocks] = useState<ServiceBlockData[]>([]);
  const [notes, setNotes] = useState("");
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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<string>("draft");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteService = useDeleteService();
  const duplicateService = useDuplicateService();
  const updateStatus = useUpdateServiceStatus();

  const uploadPdfAndGetUrl = async (): Promise<string> => {
    const blob = exportServicePdfBlob({ title, serviceDate, serviceTime, serviceType, tradition, blocks, churchName: church?.name });
    const fileName = `${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    const { error: uploadError } = await supabase.storage.from("service-pdfs").upload(fileName, blob, { contentType: "application/pdf" });
    if (uploadError) throw uploadError;
    const { data } = await supabase.storage.from("service-pdfs").createSignedUrl(fileName, 60 * 60 * 24 * 7);
    if (!data?.signedUrl) throw new Error("Signed URL konnte nicht erstellt werden");
    return data.signedUrl;
  };

  const handleSendEmail = async () => {
    if (!emailRecipient.trim()) return;
    setEmailSending(true);
    try {
      const downloadUrl = await uploadPdfAndGetUrl();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "service-share",
          recipientEmail: emailRecipient.trim(),
          idempotencyKey: `service-share-${id || "new"}-${emailRecipient}-${Date.now()}`,
          templateData: {
            serviceTitle: title,
            serviceDate,
            churchName: church?.name || "",
            downloadUrl,
            senderName: user?.user_metadata?.full_name || user?.email || "",
          },
        },
      });
      toast.success(`E-Mail an ${emailRecipient} gesendet`);
      setEmailDialogOpen(false);
      setEmailRecipient("");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim E-Mail-Versand");
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendToTeam = async () => {
    const membersWithEmail = (teamMembers || []).filter((m) => m.is_active && m.email);
    if (membersWithEmail.length === 0) {
      toast.error("Keine Team-Mitglieder mit E-Mail-Adresse gefunden");
      return;
    }
    setEmailSending(true);
    try {
      const downloadUrl = await uploadPdfAndGetUrl();
      for (const member of membersWithEmail) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "service-share",
            recipientEmail: member.email!,
            idempotencyKey: `service-share-team-${id || "new"}-${member.id}-${Date.now()}`,
            templateData: {
              serviceTitle: title,
              serviceDate,
              churchName: church?.name || "",
              downloadUrl,
              senderName: user?.user_metadata?.full_name || user?.email || "",
            },
          },
        });
      }
      toast.success(`Ablauf an ${membersWithEmail.length} Team-Mitglieder gesendet`);
      setEmailDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Fehler beim E-Mail-Versand");
    } finally {
      setEmailSending(false);
    }
  };

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
          setNotes(data.notes || "");
          setServiceStatus(data.status);
        }
        setLoading(false);
      });
  }, [id, isNew, user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
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
        notes: notes || null,
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
    <div className="flex h-full">
    <div className={`flex-1 max-w-4xl mx-auto space-y-6 ${sidebarOpen ? 'mr-0' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
              {isNew ? "Neuer Gottesdienst" : "Gottesdienst bearbeiten"}
            </h1>
            {!isNew && (
              <Badge variant={serviceStatus === "published" ? "default" : serviceStatus === "archived" ? "secondary" : "outline"} className="text-xs shrink-0">
                {serviceStatus === "draft" ? "Entwurf" : serviceStatus === "published" ? "Veröffentlicht" : "Archiviert"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {totalDuration > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {totalDuration}'
            </span>
          )}
          {!isNew && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/conductor/${id}`)}>
              <Play className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Live</span>
            </Button>
          )}
          {blocks.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportServicePdf({
                title, serviceDate, serviceTime, serviceType, tradition, blocks,
                churchName: church?.name, notes,
              })}>
                <FileDown className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportServiceDocx({
                title, serviceDate, serviceTime, serviceType, tradition, blocks,
                churchName: church?.name, notes,
              })}>
                <FileText className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Word</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                <Mail className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">E-Mail</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setTemplateName(title); setSaveAsTemplateOpen(true); }}>
                <BookmarkPlus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Vorlage</span>
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{saving ? "Speichern..." : "Speichern"}</span>
          </Button>
          <Button
            variant={sidebarOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Bibliothek-Panel"
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4 sm:mr-1" /> : <PanelRightOpen className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">Bibliothek</span>
          </Button>
          {!isNew && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                  try {
                    const result = await duplicateService.mutateAsync(id!);
                    toast.success("Gottesdienst kopiert");
                    navigate(`/dashboard/editor/${result.id}`);
                  } catch { toast.error("Fehler beim Kopieren"); }
                }}>
                  <Copy className="h-4 w-4 mr-2" /> Kopieren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {serviceStatus !== "published" && (
                  <DropdownMenuItem onClick={async () => {
                    await updateStatus.mutateAsync({ id: id!, status: "published" });
                    setServiceStatus("published");
                    toast.success("Veröffentlicht");
                  }}>
                    <Eye className="h-4 w-4 mr-2" /> Veröffentlichen
                  </DropdownMenuItem>
                )}
                {serviceStatus !== "draft" && (
                  <DropdownMenuItem onClick={async () => {
                    await updateStatus.mutateAsync({ id: id!, status: "draft" });
                    setServiceStatus("draft");
                    toast.success("Auf Entwurf zurückgesetzt");
                  }}>
                    <FileEdit className="h-4 w-4 mr-2" /> Auf Entwurf setzen
                  </DropdownMenuItem>
                )}
                {serviceStatus !== "archived" && (
                  <DropdownMenuItem onClick={async () => {
                    await updateStatus.mutateAsync({ id: id!, status: "archived" });
                    setServiceStatus("archived");
                    toast.success("Archiviert");
                  }}>
                    <Archive className="h-4 w-4 mr-2" /> Archivieren
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Leitgedanke / Thema</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. «Dankbarkeit im Alltag» — der rote Faden für diesen Gottesdienst"
              className="resize-none min-h-[56px]"
              rows={2}
            />
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => { setActiveId(null); setOverId(null); }}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => {
                const activeIndex = activeId ? blocks.findIndex((b) => b.id === activeId) : -1;
                const thisIndex = blocks.findIndex((b) => b.id === block.id);
                const showIndicatorBefore = overId === block.id && activeId !== block.id && activeIndex > thisIndex;
                const showIndicatorAfter = overId === block.id && activeId !== block.id && activeIndex < thisIndex;
                return (
                  <div key={block.id}>
                    {showIndicatorBefore && (
                      <div className="h-1 rounded-full bg-primary mx-2 my-1 animate-scale-in" />
                    )}
                    <ServiceBlock
                      block={block}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                      onAskBibleBot={askBibleBot}
                      onPickResource={pickResourceForBlock}
                    />
                    {showIndicatorAfter && (
                      <div className="h-1 rounded-full bg-primary mx-2 my-1 animate-scale-in" />
                    )}
                  </div>
                );
              })}
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
              {activeId ? (() => {
                const activeBlock = blocks.find((b) => b.id === activeId);
                if (!activeBlock) return null;
                return (
                  <div className="rounded-lg border-l-4 border bg-card p-3 shadow-xl ring-2 ring-primary/20 opacity-90 pointer-events-none max-w-md">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {activeBlock.type}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {activeBlock.title || activeBlock.type}
                      </span>
                    </div>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* BibleBot Dialog */}
      <Dialog open={bibleBotOpen} onOpenChange={setBibleBotOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💬 Begleiter fragen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kopiere diese Anfrage in den Chat (unten rechts):
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm">
              {bibleBotContext}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(bibleBotContext);
                toast.success("In Zwischenablage kopiert — öffne den Chat unten rechts");
                setBibleBotOpen(false);
                // Trigger chat open via custom event
                window.dispatchEvent(new CustomEvent("open-bibelbot-chat"));
              }}
            >
              Kopieren & Chat öffnen
            </Button>
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
      {/* Save as Template Dialog */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Als Vorlage speichern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Vorlagenname</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="z.B. Sonntagsgottesdienst"
                onKeyDown={(e) => e.key === "Enter" && handleSaveAsTemplate()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alle {blocks.length} Blöcke werden als Vorlage gespeichert.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSaveAsTemplateOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim() || createTemplate.isPending}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {createTemplate.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Share Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Ablauf per E-Mail teilen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empfänger E-Mail</Label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="empfaenger@beispiel.ch"
                onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Der Ablauf wird als PDF generiert und ein Download-Link per E-Mail versendet.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSendEmail} disabled={emailSending || !emailRecipient.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                {emailSending ? "Sende..." : "E-Mail senden"}
              </Button>
              {(teamMembers || []).filter((m) => m.is_active && m.email).length > 0 && (
                <Button variant="outline" onClick={handleSendToTeam} disabled={emailSending}>
                  <Users className="h-4 w-4 mr-2" />
                  {emailSending ? "Sende..." : `An Team senden (${(teamMembers || []).filter((m) => m.is_active && m.email).length})`}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {/* Delete Confirmation */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gottesdienst löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            «{title}» wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              try {
                await deleteService.mutateAsync(id!);
                toast.success("Gottesdienst gelöscht");
                navigate("/dashboard/services");
              } catch { toast.error("Fehler beim Löschen"); }
            }}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Resource Sidebar */}
    {sidebarOpen && (
      <ResourceSidebar
        onSelect={(resource) => {
          addBlockFromResource(resource);
        }}
        onClose={() => setSidebarOpen(false)}
      />
    )}
    </div>
  );
}

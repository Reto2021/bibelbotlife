import { useState, useMemo } from "react";
import {
  ListMusic, Plus, Pencil, Trash2, Calendar, ChevronDown, ChevronRight,
  Link2, Unlink, MoreHorizontal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useSeries, useCreateSeries, useUpdateSeries, useDeleteSeries,
  useAssignServiceToSeries, type Series,
} from "@/hooks/use-series";
import { useServices } from "@/hooks/use-services";
import { useUserChurch } from "@/hooks/use-user-church";

interface FormState {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

const emptyForm: FormState = { name: "", description: "", start_date: "", end_date: "" };

export default function SeriesPage() {
  const { data: series = [], isLoading } = useSeries();
  const { data: services = [] } = useServices();
  const { data: church } = useUserChurch();
  const createSeries = useCreateSeries();
  const updateSeries = useUpdateSeries();
  const deleteSeries = useDeleteSeries();
  const assignService = useAssignServiceToSeries();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignDialogSeriesId, setAssignDialogSeriesId] = useState<string | null>(null);

  // Services grouped by series
  const servicesBySeries = useMemo(() => {
    const map = new Map<string, typeof services>();
    series.forEach((s) => map.set(s.id, []));
    services.forEach((svc) => {
      if (svc.series_id && map.has(svc.series_id)) {
        map.get(svc.series_id)!.push(svc);
      }
    });
    // Sort each group by date
    map.forEach((list) => list.sort((a, b) => a.service_date.localeCompare(b.service_date)));
    return map;
  }, [series, services]);

  // Unassigned services
  const unassigned = useMemo(
    () => services.filter((s) => !s.series_id).sort((a, b) => a.service_date.localeCompare(b.service_date)),
    [services]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Series) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description ?? "",
      start_date: s.start_date ?? "",
      end_date: s.end_date ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        church_id: church?.id ?? null,
      };
      if (editingId) {
        await updateSeries.mutateAsync({ id: editingId, ...payload });
        toast.success("Serie aktualisiert");
      } else {
        await createSeries.mutateAsync(payload);
        toast.success("Serie erstellt");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSeries.mutateAsync(id);
      toast.success("Serie gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleAssign = async (serviceId: string, seriesId: string | null) => {
    try {
      await assignService.mutateAsync({ serviceId, seriesId });
      toast.success(seriesId ? "Gottesdienst zugeordnet" : "Zuordnung entfernt");
    } catch {
      toast.error("Fehler beim Zuordnen");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "–";
    try { return format(parseISO(d), "d. MMM yyyy", { locale: de }); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Predigtreihen</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Neue Serie
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : series.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListMusic className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Noch keine Predigtreihen. Erstelle eine Serie, um Gottesdienste thematisch zu gruppieren.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {series.map((s) => {
            const svcList = servicesBySeries.get(s.id) ?? [];
            const isExpanded = expandedId === s.id;

            return (
              <Card key={s.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Series Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  >
                    <div className="text-primary">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {svcList.length} Gottesdienst{svcList.length !== 1 ? "e" : ""}
                        </Badge>
                      </div>
                      {s.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{s.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(s.start_date)} – {formatDate(s.end_date)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAssignDialogSeriesId(s.id); }}>
                          <Link2 className="h-4 w-4 mr-2" /> Gottesdienst zuordnen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Timeline */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 px-5 py-4">
                      {svcList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Noch keine Gottesdienste zugeordnet.
                          <Button
                            variant="link"
                            size="sm"
                            className="ml-1"
                            onClick={() => setAssignDialogSeriesId(s.id)}
                          >
                            Jetzt zuordnen
                          </Button>
                        </p>
                      ) : (
                        <div className="relative pl-6">
                          {/* Timeline line */}
                          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-primary/20" />
                          <div className="space-y-4">
                            {svcList.map((svc, idx) => (
                              <div key={svc.id} className="relative flex items-start gap-3">
                                {/* Timeline dot */}
                                <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background z-10" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-primary">
                                      {formatDate(svc.service_date)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      Teil {idx + 1}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium text-foreground truncate">{svc.title}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 h-7 w-7"
                                  title="Zuordnung entfernen"
                                  onClick={() => handleAssign(svc.id, null)}
                                >
                                  <Unlink className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Series Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Serie bearbeiten" : "Neue Predigtreihe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z.B. «Psalmen im Alltag»"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Beschreibung</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Worum geht es in dieser Reihe?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Start</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Ende</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={createSeries.isPending || updateSeries.isPending}>
              {editingId ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Service Dialog */}
      <Dialog open={!!assignDialogSeriesId} onOpenChange={(o) => !o && setAssignDialogSeriesId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gottesdienst zuordnen</DialogTitle>
          </DialogHeader>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Alle Gottesdienste sind bereits einer Serie zugeordnet.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {unassigned.map((svc) => (
                <button
                  key={svc.id}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                  onClick={async () => {
                    if (assignDialogSeriesId) {
                      await handleAssign(svc.id, assignDialogSeriesId);
                      setAssignDialogSeriesId(null);
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{svc.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(svc.service_date)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogSeriesId(null)}>Schliessen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

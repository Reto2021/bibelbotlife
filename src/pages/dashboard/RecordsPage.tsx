import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRecords, type ChurchRecord } from "@/hooks/use-records";
import { useUserChurch } from "@/hooks/use-user-church";
import { toast } from "sonner";

const RECORD_TYPES = ["baptism", "wedding", "funeral"] as const;

const TYPE_LABELS: Record<string, string> = {
  baptism: "Taufe",
  wedding: "Trauung",
  funeral: "Abdankung",
};

const TYPE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  baptism: "default",
  wedding: "secondary",
  funeral: "outline",
};

type FormData = {
  record_type: "baptism" | "wedding" | "funeral";
  record_date: string;
  officiant: string;
  record_number: string;
  notes: string;
  participants: { name: string; role: string }[];
};

const emptyForm: FormData = {
  record_type: "baptism",
  record_date: new Date().toISOString().slice(0, 10),
  officiant: "",
  record_number: "",
  notes: "",
  participants: [{ name: "", role: "" }],
};

export default function RecordsPage() {
  const { t } = useTranslation();
  const { data: church } = useUserChurch();
  const { data: records, isLoading, createRecord, updateRecord, deleteRecord } = useRecords();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!church) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("records.title", "Amtshandlungen")}</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("records.noChurch", "Bitte erstelle zuerst eine Gemeinde.")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: ChurchRecord) => {
    setEditId(r.id);
    const parts = Array.isArray(r.participants)
      ? (r.participants as { name: string; role: string }[])
      : [{ name: "", role: "" }];
    setForm({
      record_type: r.record_type as any,
      record_date: r.record_date,
      officiant: r.officiant || "",
      record_number: r.record_number || "",
      notes: r.notes || "",
      participants: parts.length ? parts : [{ name: "", role: "" }],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        record_type: form.record_type,
        record_date: form.record_date,
        officiant: form.officiant || undefined,
        record_number: form.record_number || undefined,
        notes: form.notes || undefined,
        participants: form.participants.filter((p) => p.name.trim()),
      };
      if (editId) {
        await updateRecord.mutateAsync({ id: editId, ...payload });
        toast.success(t("records.updated", "Eintrag aktualisiert"));
      } else {
        await createRecord.mutateAsync(payload);
        toast.success(t("records.created", "Eintrag erfasst"));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t("records.error", "Fehler beim Speichern"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      toast.success(t("records.deleted", "Eintrag gelöscht"));
    } catch {
      toast.error(t("records.error", "Fehler beim Löschen"));
    }
  };

  const addParticipant = () => {
    setForm({ ...form, participants: [...form.participants, { name: "", role: "" }] });
  };

  const updateParticipant = (i: number, field: "name" | "role", value: string) => {
    const updated = [...form.participants];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, participants: updated });
  };

  const removeParticipant = (i: number) => {
    setForm({ ...form, participants: form.participants.filter((_, idx) => idx !== i) });
  };

  const filtered = (records || []).filter((r) => {
    if (typeFilter !== "all" && r.record_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const parts = Array.isArray(r.participants) ? JSON.stringify(r.participants).toLowerCase() : "";
      return (
        (r.officiant || "").toLowerCase().includes(q) ||
        (r.record_number || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q) ||
        parts.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("records.title", "Amtshandlungen")}</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t("records.add", "Erfassen")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("records.allTypes", "Alle Typen")}</SelectItem>
            {RECORD_TYPES.map((rt) => (
              <SelectItem key={rt} value={rt}>{TYPE_LABELS[rt]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("records.search", "Suchen…")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {t("records.entries", "Einträge")}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("loader")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("records.empty", "Noch keine Amtshandlungen erfasst.")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("records.date", "Datum")}</TableHead>
                  <TableHead>{t("records.type", "Typ")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("records.officiant", "Pfarrer/in")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("records.number", "Nr.")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("records.participants", "Beteiligte")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const parts = Array.isArray(r.participants) ? (r.participants as { name: string }[]) : [];
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.record_date).toLocaleDateString("de-CH")}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_COLORS[r.record_type] || "default"}>
                          {TYPE_LABELS[r.record_type] || r.record_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{r.officiant || "–"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.record_number || "–"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {parts.map((p) => p.name).filter(Boolean).join(", ") || "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t("records.editTitle", "Eintrag bearbeiten") : t("records.addTitle", "Neue Amtshandlung")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("records.type", "Typ")}</Label>
                <Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((rt) => (
                      <SelectItem key={rt} value={rt}>{TYPE_LABELS[rt]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("records.date", "Datum")}</Label>
                <Input
                  type="date"
                  value={form.record_date}
                  onChange={(e) => setForm({ ...form, record_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("records.officiant", "Pfarrer/in")}</Label>
                <Input
                  value={form.officiant}
                  onChange={(e) => setForm({ ...form, officiant: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("records.number", "Kirchenbuch-Nr.")}</Label>
                <Input
                  value={form.record_number}
                  onChange={(e) => setForm({ ...form, record_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("records.participants", "Beteiligte")}</Label>
                <Button variant="ghost" size="sm" onClick={addParticipant}>
                  <Plus className="h-3 w-3 mr-1" /> {t("records.addParticipant", "Person")}
                </Button>
              </div>
              {form.participants.map((p, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input
                    placeholder={t("records.participantName", "Name")}
                    value={p.name}
                    onChange={(e) => updateParticipant(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder={t("records.participantRole", "Rolle (z.B. Täufling)")}
                    value={p.role}
                    onChange={(e) => updateParticipant(i, "role", e.target.value)}
                    className="flex-1"
                  />
                  {form.participants.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeParticipant(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <Label>{t("records.notes", "Notizen")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("records.cancel", "Abbrechen")}</Button>
            <Button onClick={handleSave}>{t("records.save", "Speichern")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

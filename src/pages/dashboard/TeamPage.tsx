import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeam, type TeamMember } from "@/hooks/use-team";
import { useUserChurch } from "@/hooks/use-user-church";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

const ROLES = Constants.public.Enums.team_role;
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pfarrer/in",
  musician: "Musiker/in",
  lector: "Lektor/in",
  sacristan: "Sakristan/in",
  technician: "Techniker/in",
  volunteer: "Freiwillige/r",
  other: "Andere",
};

type FormData = {
  name: string;
  email: string;
  role: typeof ROLES[number];
  is_active: boolean;
  availability: Record<string, boolean>;
};

const emptyForm: FormData = { name: "", email: "", role: "volunteer", is_active: true, availability: {} };

export default function TeamPage() {
  const { t } = useTranslation();
  const { data: church } = useUserChurch();
  const { user } = useAuth();
  const { data: members, isLoading, createMember, updateMember, deleteMember } = useTeam();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  if (!church) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("team.title", "Team")}</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("team.noChurch", "Bitte erstelle zuerst eine Gemeinde in den Einstellungen.")}
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

  const openEdit = (m: TeamMember) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      email: m.email || "",
      role: m.role,
      is_active: m.is_active,
      availability: (m.availability as Record<string, boolean>) || {},
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await updateMember.mutateAsync({
          id: editId,
          name: form.name,
          email: form.email || null,
          role: form.role,
          is_active: form.is_active,
          availability: form.availability,
        });
        toast.success(t("team.updated", "Mitglied aktualisiert"));
      } else {
        await createMember.mutateAsync({
          name: form.name,
          email: form.email || null,
          role: form.role,
          is_active: form.is_active,
          availability: form.availability,
        });
        toast.success(t("team.created", "Mitglied hinzugefügt"));

        // Send invitation email if email is provided
        if (form.email) {
          try {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "team-invitation",
                recipientEmail: form.email,
                idempotencyKey: `team-invite-${form.email}-${Date.now()}`,
                templateData: {
                  churchName: church?.name || "",
                  role: form.role,
                  inviterName: user?.user_metadata?.full_name || user?.email || "",
                  dashboardUrl: `${window.location.origin}/dashboard`,
                },
              },
            });
            toast.success("Einladungs-E-Mail gesendet");
          } catch {
            // Non-critical: member was created, email just didn't send
          }
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error(t("team.error", "Fehler beim Speichern"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success(t("team.deleted", "Mitglied entfernt"));
    } catch {
      toast.error(t("team.error", "Fehler beim Löschen"));
    }
  };

  const filtered = (members || []).filter((m) => roleFilter === "all" || m.role === roleFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("team.title", "Team")}</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t("team.add", "Hinzufügen")}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("team.allRoles", "Alle Rollen")}</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {t("team.members", "Mitglieder")}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("loader")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("team.empty", "Noch keine Team-Mitglieder erfasst.")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.name", "Name")}</TableHead>
                  <TableHead>{t("team.role", "Rolle")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("team.email", "E-Mail")}</TableHead>
                  <TableHead>{t("team.status", "Status")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[m.role] || m.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{m.email || "–"}</TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? "default" : "outline"}>
                        {m.is_active ? t("team.active", "Aktiv") : t("team.inactive", "Inaktiv")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? t("team.edit", "Mitglied bearbeiten") : t("team.add", "Mitglied hinzufügen")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("team.name", "Name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>{t("team.email", "E-Mail")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>{t("team.role", "Rolle")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("team.availability", "Verfügbarkeit")}</Label>
              <div className="flex gap-3 mt-2">
                {DAYS.map((d) => (
                  <label key={d} className="flex flex-col items-center gap-1 text-xs">
                    <Checkbox
                      checked={!!form.availability[d]}
                      onCheckedChange={(c) =>
                        setForm({ ...form, availability: { ...form.availability, [d]: !!c } })
                      }
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(c) => setForm({ ...form, is_active: c })}
              />
              <Label>{t("team.active", "Aktiv")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("team.cancel", "Abbrechen")}</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {t("team.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

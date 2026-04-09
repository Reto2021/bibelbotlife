import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChurchUsageStats } from "@/hooks/use-admin";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  church: Tables<"church_partners"> | null;
  open: boolean;
  onClose: () => void;
}

export function ChurchDetailDrawer({ church, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { data: usage } = useChurchUsageStats(church?.id ?? null);
  const [form, setForm] = useState<Partial<Tables<"church_partners">>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (church) setForm({ ...church });
  }, [church]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!church) return;
    setSaving(true);
    const { error } = await supabase
      .from("church_partners")
      .update({
        plan_tier: form.plan_tier,
        subscription_status: form.subscription_status,
        subscription_started_at: form.subscription_started_at,
        subscription_expires_at: form.subscription_expires_at,
        billing_name: form.billing_name,
        billing_street: form.billing_street,
        billing_zip: form.billing_zip,
        billing_city: form.billing_city,
        billing_country: form.billing_country,
        billing_email: form.billing_email,
        billing_interval: form.billing_interval,
        billing_reference: form.billing_reference,
        iban: form.iban,
        is_active: form.is_active,
        contact_person: form.contact_person,
      })
      .eq("id", church.id);

    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Gespeichert");
      queryClient.invalidateQueries({ queryKey: ["admin-churches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    }
  };

  if (!church) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            {church.name}
            {!form.is_active && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Inaktiv</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
            <TabsTrigger value="billing" className="flex-1">Abo & Billing</TabsTrigger>
            <TabsTrigger value="usage" className="flex-1">Nutzung</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <Field label="Name" value={church.name} />
            <Field label="Slug" value={church.slug} />
            <Field label="Konfession" value={church.denomination} />
            <Field label="Stadt" value={church.city} />
            <Field label="Land" value={church.country} />
            <Field label="Sprache" value={church.language} />
            <Field label="Kontaktperson" value={church.contact_person} />
            <Field label="E-Mail" value={church.contact_email} />
            <Field label="Telefon" value={church.contact_phone} />
            <Field label="Website" value={church.website} />
            <Field label="Pastor" value={church.pastor_name} />
            {church.logo_url && (
              <div>
                <Label className="text-muted-foreground text-xs">Logo</Label>
                <img src={church.logo_url} alt="Logo" className="h-12 w-12 mt-1 rounded object-contain bg-muted" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Plan-Tier</Label>
              <Select value={form.plan_tier ?? "free"} onValueChange={(v) => set("plan_tier", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="gemeinde">Gemeinde</SelectItem>
                  <SelectItem value="kirche">Kirche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Abo-Status</Label>
              <Select value={form.subscription_status ?? "trial"} onValueChange={(v) => set("subscription_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="expired">Abgelaufen</SelectItem>
                  <SelectItem value="cancelled">Gekündigt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Abo-Start</Label>
                <Input
                  type="date"
                  value={form.subscription_started_at?.split("T")[0] ?? ""}
                  onChange={(e) => set("subscription_started_at", e.target.value ? e.target.value + "T00:00:00Z" : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Abo-Ablauf</Label>
                <Input
                  type="date"
                  value={form.subscription_expires_at?.split("T")[0] ?? ""}
                  onChange={(e) => set("subscription_expires_at", e.target.value ? e.target.value + "T00:00:00Z" : null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Billing-Intervall</Label>
              <Select value={form.billing_interval ?? "yearly"} onValueChange={(v) => set("billing_interval", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-medium">Rechnungsadresse</h4>
              <InputField label="Name" value={form.billing_name} onChange={(v) => set("billing_name", v)} />
              <InputField label="Strasse" value={form.billing_street} onChange={(v) => set("billing_street", v)} />
              <div className="grid grid-cols-3 gap-2">
                <InputField label="PLZ" value={form.billing_zip} onChange={(v) => set("billing_zip", v)} />
                <div className="col-span-2">
                  <InputField label="Stadt" value={form.billing_city} onChange={(v) => set("billing_city", v)} />
                </div>
              </div>
              <InputField label="Land" value={form.billing_country} onChange={(v) => set("billing_country", v)} />
              <InputField label="E-Mail" value={form.billing_email} onChange={(v) => set("billing_email", v)} />
              <InputField label="IBAN" value={form.iban} onChange={(v) => set("iban", v)} />
              <InputField label="Referenz" value={form.billing_reference} onChange={(v) => set("billing_reference", v)} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => set("is_active", v)} />
              <Label>Gemeinde aktiv</Label>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4 mt-4">
            <UsageStat label="Gottesdienste" value={usage?.servicesCount} />
            <UsageStat label="Team-Mitglieder" value={usage?.teamCount} />
            <UsageStat label="Kirchenbuch-Einträge" value={usage?.recordsCount} />
            <div className="pt-4 border-t border-border">
              <Label className="text-muted-foreground text-xs">Letzte Aktivität</Label>
              <p className="text-sm">{new Date(church.updated_at).toLocaleString("de-CH")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Erstellt</Label>
              <p className="text-sm">{new Date(church.created_at).toLocaleString("de-CH")}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Speichern…" : "Speichern"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Schliessen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="text-sm">{value || "–"}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value ?? "–"}</span>
    </div>
  );
}

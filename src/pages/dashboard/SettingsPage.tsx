import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, CreditCard, Bell, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserChurch } from "@/hooks/use-user-church";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DENOMINATIONS = ["reformiert", "katholisch", "lutherisch", "evangelisch", "freikirchlich", "andere"];
const LANGUAGES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: "Testphase", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  active: { label: "Aktiv", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  expired: { label: "Abgelaufen", color: "bg-destructive/20 text-destructive" },
  cancelled: { label: "Gekündigt", color: "bg-muted text-muted-foreground" },
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: church, isLoading } = useUserChurch();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [notifyOnContact, setNotifyOnContact] = useState(true);

  const [form, setForm] = useState({
    name: "",
    denomination: "",
    city: "",
    country: "CH",
    language: "de",
    contact_email: "",
    contact_phone: "",
    website: "",
    pastor_name: "",
    service_times: "",
    welcome_message: "",
    primary_color: "",
    secondary_color: "",
    custom_bot_name: "",
    contact_person: "",
  });

  const [billingForm, setBillingForm] = useState({
    billing_name: "",
    billing_street: "",
    billing_zip: "",
    billing_city: "",
    billing_country: "CH",
    billing_email: "",
    billing_reference: "",
    iban: "",
  });

  const { data: billing } = useQuery({
    queryKey: ["church-billing", church?.id],
    enabled: !!church?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("church_billing")
        .select("*")
        .eq("church_id", church!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (church) {
      setForm({
        name: church.name || "",
        denomination: church.denomination || "",
        city: church.city || "",
        country: church.country || "CH",
        language: church.language || "de",
        contact_email: church.contact_email || "",
        contact_phone: church.contact_phone || "",
        website: church.website || "",
        pastor_name: church.pastor_name || "",
        service_times: church.service_times || "",
        welcome_message: church.welcome_message || "",
        primary_color: church.primary_color || "",
        secondary_color: church.secondary_color || "",
        custom_bot_name: church.custom_bot_name || "",
        contact_person: church.contact_person || "",
      });
      setNotifyOnContact((church as any).notify_on_contact ?? true);
    }
  }, [church]);

  useEffect(() => {
    if (billing) {
      setBillingForm({
        billing_name: billing.billing_name || "",
        billing_street: billing.billing_street || "",
        billing_zip: billing.billing_zip || "",
        billing_city: billing.billing_city || "",
        billing_country: billing.billing_country || "CH",
        billing_email: billing.billing_email || "",
        billing_reference: billing.billing_reference || "",
        iban: billing.iban || "",
      });
    }
  }, [billing]);

  const handleSave = async () => {
    if (!church) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("church_partners")
        .update({
          name: form.name,
          denomination: form.denomination || null,
          city: form.city || null,
          country: form.country || null,
          language: form.language || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          website: form.website || null,
          pastor_name: form.pastor_name || null,
          service_times: form.service_times || null,
          welcome_message: form.welcome_message || null,
          primary_color: form.primary_color || null,
          secondary_color: form.secondary_color || null,
          custom_bot_name: form.custom_bot_name || null,
          contact_person: form.contact_person || null,
          notify_on_contact: notifyOnContact,
        } as any)
        .eq("id", church.id);
      if (error) throw error;

      // Upsert billing
      const { error: billingError } = await supabase
        .from("church_billing")
        .upsert({
          church_id: church.id,
          billing_name: billingForm.billing_name || null,
          billing_street: billingForm.billing_street || null,
          billing_zip: billingForm.billing_zip || null,
          billing_city: billingForm.billing_city || null,
          billing_country: billingForm.billing_country || null,
          billing_email: billingForm.billing_email || null,
          billing_reference: billingForm.billing_reference || null,
          iban: billingForm.iban || null,
        }, { onConflict: "church_id" });
      if (billingError) throw billingError;

      queryClient.invalidateQueries({ queryKey: ["user-church"] });
      queryClient.invalidateQueries({ queryKey: ["church-billing", church.id] });
      toast.success(t("settings.saved", "Einstellungen gespeichert"));
    } catch {
      toast.error(t("settings.error", "Fehler beim Speichern"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t("loader")}</div>;
  }

  if (!church) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title", "Einstellungen")}</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("settings.noChurch", "Keine Gemeinde gefunden. Bitte erstelle zuerst eine über den Einrichtungsassistenten.")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  const billingField = (key: keyof typeof billingForm, label: string, type = "text", placeholder = "") => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={billingForm[key]}
        placeholder={placeholder}
        onChange={(e) => setBillingForm({ ...billingForm, [key]: e.target.value })}
      />
    </div>
  );

  const subStatus = church.subscription_status ?? "trial";
  const statusInfo = STATUS_LABELS[subStatus] ?? STATUS_LABELS.trial;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title", "Einstellungen")}</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? t("settings.saving", "Wird gespeichert…") : t("settings.save", "Speichern")}
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile", "Gemeindeprofil")}</CardTitle>
          <CardDescription>{t("settings.profileDesc", "Grunddaten deiner Gemeinde")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("name", t("settings.churchName", "Gemeindename"))}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("settings.denomination", "Konfession")}</Label>
              <Select value={form.denomination} onValueChange={(v) => setForm({ ...form, denomination: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectDenomination", "Konfession wählen")} />
                </SelectTrigger>
                <SelectContent>
                  {DENOMINATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("city", t("settings.city", "Stadt"))}
            <div>
              <Label>{t("settings.language", "Sprache")}</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
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
          </div>
          {field("pastor_name", t("settings.pastorName", "Pfarrer/in"), "text")}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.contact", "Kontakt")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("contact_person", t("settings.contactPerson", "Kontaktperson"))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("contact_email", t("settings.email", "E-Mail"), "email")}
            {field("contact_phone", t("settings.phone", "Telefon"), "tel")}
          </div>
          {field("website", t("settings.website", "Website"), "url", "https://")}
          <div>
            <Label>{t("settings.serviceTimes", "Gottesdienstzeiten")}</Label>
            <Textarea
              value={form.service_times}
              onChange={(e) => setForm({ ...form, service_times: e.target.value })}
              rows={2}
              placeholder={t("settings.serviceTimesPlaceholder", "z.B. Sonntag 10:00 Uhr")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("settings.billing", "Abonnement & Rechnung")}
              </CardTitle>
              <CardDescription>{t("settings.billingDesc", "Rechnungsadresse und Zahlungsinformationen")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              <Badge variant="outline">{church.plan_tier}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription info (read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <p className="text-sm font-medium capitalize">{church.plan_tier}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Abo-Start</Label>
              <p className="text-sm">
                {church.subscription_started_at
                  ? new Date(church.subscription_started_at).toLocaleDateString("de-CH")
                  : "–"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Abo-Ablauf</Label>
              <p className="text-sm">
                {church.subscription_expires_at
                  ? new Date(church.subscription_expires_at).toLocaleDateString("de-CH")
                  : "–"}
              </p>
            </div>
          </div>

          {/* Billing address */}
          <h4 className="text-sm font-medium pt-2">{t("settings.billingAddress", "Rechnungsadresse")}</h4>
          {billingField("billing_name", t("settings.billingName", "Name / Organisation"))}
          {billingField("billing_street", t("settings.billingStreet", "Strasse"))}
          <div className="grid grid-cols-3 gap-3">
            {billingField("billing_zip", t("settings.billingZip", "PLZ"))}
            <div className="col-span-2">
              {billingField("billing_city", t("settings.billingCity", "Stadt"))}
            </div>
          </div>
          {billingField("billing_country", t("settings.billingCountry", "Land"))}
          {billingField("billing_email", t("settings.billingEmail", "Rechnungs-E-Mail"), "email")}

          {/* Payment */}
          <h4 className="text-sm font-medium pt-2">{t("settings.payment", "Zahlung")}</h4>
          {billingField("iban", "IBAN")}
          {billingField("billing_reference", t("settings.billingRef", "Referenz / Kostenstelle"))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("settings.notifications", "Benachrichtigungen")}
          </CardTitle>
          <CardDescription>{t("settings.notificationsDesc", "E-Mail-Benachrichtigungen für deine Gemeinde")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.notifyOnContact", "Bei neuer Kontaktanfrage benachrichtigen")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.notifyOnContactDesc", "E-Mail an deine Kontakt-Adresse bei jeder neuen Nachricht über das Kontaktformular")}</p>
            </div>
            <Switch checked={notifyOnContact} onCheckedChange={setNotifyOnContact} />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.branding", "Branding")}</CardTitle>
          <CardDescription>{t("settings.brandingDesc", "Farben und Willkommensnachricht")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("custom_bot_name", t("settings.botName", "Bot-Name"), "text", "BibelBot")}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("settings.primaryColor", "Primärfarbe")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.primary_color || "#4a6741"}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  placeholder="#4a6741"
                />
              </div>
            </div>
            <div>
              <Label>{t("settings.secondaryColor", "Sekundärfarbe")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.secondary_color || "#d4a574"}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  placeholder="#d4a574"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>{t("settings.welcomeMessage", "Willkommensnachricht")}</Label>
            <Textarea
              value={form.welcome_message}
              onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
              rows={3}
              placeholder={t("settings.welcomePlaceholder", "Willkommen bei unserer Gemeinde!")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

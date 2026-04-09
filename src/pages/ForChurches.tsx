import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Church, ArrowLeft, Send, Handshake, Sprout, Heart, Building2, Hospital, ShieldCheck, Swords, Footprints, TowerControl } from "lucide-react";
import bibelbotLogo from "@/assets/biblebot-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tiers = [
  { key: "free", setup: 0, annual: 0, icon: Sprout, popular: false },
  { key: "community", setup: 490, annual: 790, icon: Footprints, popular: false },
  { key: "gemeinde", setup: 990, annual: 1490, icon: Handshake, popular: true },
  { key: "kirche", setup: 1990, annual: 2990, icon: TowerControl, popular: false },
];

const ForChurches = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "", church_name: "", organization_type: "", preferred_tier: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setSending(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await (supabase.from as any)("church_partnership_inquiries").insert({
        id,
        name: formData.name || null,
        email: formData.email,
        church_name: formData.church_name
          ? `[${formData.organization_type || "Gemeinde"}] ${formData.church_name}`
          : formData.organization_type ? `[${formData.organization_type}]` : null,
        preferred_tier: formData.preferred_tier || null,
        message: formData.message,
      });
      if (error) throw error;
      // Send confirmation email (fire-and-forget)
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: formData.email,
          idempotencyKey: `contact-confirm-${id}`,
          templateData: { name: formData.name || undefined },
        },
      });
      toast.success(t("church.form.success"));
      setFormData({ name: "", email: "", church_name: "", organization_type: "", preferred_tier: "", message: "" });
    } catch {
      toast.error(t("church.form.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <SEOHead titleKey="meta.forChurchesTitle" descKey="meta.forChurchesDesc" path="/for-churches" />
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <img src={bibelbotLogo} alt="BibleBot" className="h-8 w-8" />
            {t("impressum.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
            <Church className="h-4 w-4" />
            {t("church.badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t("church.heroTitle")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{t("church.heroSubtitle")}</p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">{t("church.useCasesTitle")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(["youth", "confirmation", "pastoral", "bibleStudy"] as const).map((uc) => (
              <Card key={uc} className="bg-card/80 border-border text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{t(`church.useCase.${uc}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t(`church.useCase.${uc}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Institutions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.institutionsTitle")}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">{t("church.institutionsSubtitle")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {([
              { key: "careHome", icon: Building2 },
              { key: "seniorHome", icon: Heart },
              { key: "hospital", icon: Hospital },
              { key: "prison", icon: ShieldCheck },
              { key: "military", icon: Swords },
            ] as const).map((inst) => (
              <Card key={inst.key} className="bg-card/80 border-border text-center p-4">
                <CardHeader className="p-0 pb-2">
                  <inst.icon className="h-7 w-7 text-primary mx-auto mb-1" />
                  <CardTitle className="text-sm font-semibold leading-tight">{t(`church.institution.${inst.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground leading-snug">{t(`church.institution.${inst.key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.pricingTitle")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">{t("church.pricingSubtitle")}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.key}
                className={`relative bg-card/80 border-border ${tier.popular ? "ring-2 ring-primary shadow-xl" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    {t("church.popular")}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">{t(`church.tier.${tier.key}.name`)}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t(`church.tier.${tier.key}.size`)}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    {tier.setup > 0 && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("church.setup")}: <span className="font-semibold text-foreground">CHF {tier.setup.toLocaleString("de-CH")}.–</span>
                      </p>
                    )}
                    <p className="text-3xl font-bold text-foreground">
                      {tier.annual === 0 ? "CHF 0.–" : `CHF ${tier.annual.toLocaleString("de-CH")}.–`}
                    </p>
                    {tier.annual > 0 && <p className="text-xs text-muted-foreground">/{t("church.perYear")}</p>}
                  </div>
                  <Button
                    className="w-full mt-6"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, preferred_tier: tier.key }));
                      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t("church.contact")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.form.title")}</h2>
          <p className="text-muted-foreground text-center mb-8">{t("church.form.subtitle")}</p>

          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.name")}</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.email")} *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      maxLength={255}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.churchName")}</label>
                    <Input
                      value={formData.church_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, church_name: e.target.value }))}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.orgType")}</label>
                    <Select value={formData.organization_type} onValueChange={(v) => setFormData(prev => ({ ...prev, organization_type: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("church.form.orgTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gemeinde">{t("church.form.orgTypes.church")}</SelectItem>
                        <SelectItem value="Pflegeheim">{t("church.form.orgTypes.careHome")}</SelectItem>
                        <SelectItem value="Altersheim">{t("church.form.orgTypes.seniorHome")}</SelectItem>
                        <SelectItem value="Spital">{t("church.form.orgTypes.hospital")}</SelectItem>
                        <SelectItem value="Gefängnisseelsorge">{t("church.form.orgTypes.prison")}</SelectItem>
                        <SelectItem value="Armeeseelsorge">{t("church.form.orgTypes.military")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.tier")}</label>
                  <Select value={formData.preferred_tier} onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_tier: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("church.form.tierPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.key} value={tier.key}>
                          {t(`church.tier.${tier.key}.name`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">{t("church.form.message")} *</label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    maxLength={2000}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "..." : t("church.form.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer links */}
      <div className="py-8 text-center space-y-2">
        <Link to="/churches" className="text-primary hover:underline text-sm font-medium block">
          {t("church.viewDirectory")} →
        </Link>
      </div>
    </div>
  );
};

export default ForChurches;

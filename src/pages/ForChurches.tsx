import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getStoredReferralCode } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Church, ArrowLeft, Send, Handshake, Sprout, Heart, Building2, Hospital, ShieldCheck, Swords, Footprints, TowerControl, Cross, BookOpen, Flame, Users, Sparkles, Activity, Brain, HeartPulse, Home, MessageSquareHeart, MessageCircle, HeartHandshake } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tiers = [
  { key: "free",      icon: Sprout,       popular: false, setup: 490,  monthly: 49 },
  { key: "community", icon: Footprints,   popular: false, setup: 690,  monthly: 99 },
  { key: "gemeinde",  icon: Handshake,    popular: true,  setup: 990,  monthly: 149 },
  { key: "kirche",    icon: TowerControl, popular: false, setup: 1490, monthly: 249 },
];

const SETUP_INCLUDES = [
  "Persönliches Kickoff-Gespräch",
  "Einrichtung Gemeinde-Branding (Logo, Farben, Name)",
  "Generierung QR-Materialien (Flyer & Sticker)",
  "Eigene Gemeinde-Landingpage",
  "Test & Qualitätsprüfung",
  "Onboarding-Dokumentation & Schulung",
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
      const referralCode = getStoredReferralCode();
      const { error } = await (supabase.from as any)("church_partnership_inquiries").insert({
        id,
        name: formData.name || null,
        email: formData.email,
        church_name: formData.church_name
          ? `[${formData.organization_type || "Gemeinde"}] ${formData.church_name}`
          : formData.organization_type ? `[${formData.organization_type}]` : null,
        preferred_tier: formData.preferred_tier || null,
        message: formData.message,
        referral_code: referralCode,
      });
      if (error) throw error;

      // Fire referral webhook if ref code present
      if (referralCode) {
        supabase.functions.invoke("referral-webhook", {
          body: {
            referral_code: referralCode,
            inquiry_id: id,
            church_name: formData.church_name || formData.organization_type || "Unknown",
            preferred_tier: formData.preferred_tier || "free",
          },
        });
      }

      // Send confirmation email to sender (fire-and-forget)
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: formData.email,
          idempotencyKey: `contact-confirm-${id}`,
          templateData: { name: formData.name || undefined },
        },
      });

      // Notify admin (fire-and-forget)
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: "kontakt@bibelbot.ch",
          idempotencyKey: `contact-notify-${id}`,
          templateData: {
            senderName: formData.name || undefined,
            senderEmail: formData.email,
            organizationType: formData.organization_type || undefined,
            churchName: formData.church_name || undefined,
            message: formData.message,
            source: "Gemeinde-Seite",
          },
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
      <SiteHeader />

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

      {/* 3-Level Pastoral Approach */}
      <section className="py-16 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">
            {t("church.approachTitle", "Ihr digitaler 1st-Level-Kanal")}
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            {t("church.approachSubtitle", "Die meisten Menschen wenden sich nicht direkt an einen Seelsorger. Sie googeln, sie grübeln, sie schweigen. BibleBot.Life fängt sie dort auf – als erste, niederschwellige Anlaufstelle in Ihrem Seelsorge-Ökosystem.")}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Level 1 */}
            <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardContent className="pt-6 pb-5">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-primary/15 p-3 mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Level 1</span>
                  <h3 className="font-bold text-foreground text-lg mb-2">BibleBot.Life</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {t("church.approach1Desc", "24/7 erreichbar, anonym, kostenlos. Beantwortet Glaubensfragen, gibt Impulse und begleitet – ohne Hemmschwelle. Ihr digitaler Erstkontakt.")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">24/7</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("about.tag_anonymous", "Anonym")}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("about.tag_free", "Kostenlos")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 2 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />
              <CardContent className="pt-6 pb-5">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-secondary/15 p-3 mb-3">
                    <Church className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Level 2</span>
                  <h3 className="font-bold text-foreground text-lg mb-2">{t("about.level2Title", "Gottesdienst & Gemeinde")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {t("church.approach2Desc", "BibleBot weckt Interesse und Vertrauen. Der nächste Schritt: der Besuch in Ihrer Gemeinde. Wir verlinken direkt auf Ihre Gottesdienstzeiten.")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{t("about.tag_weekly", "Wöchentlich")}</span>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{t("about.tag_community", "Gemeinschaft")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 3 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-foreground/50" />
              <CardContent className="pt-6 pb-5">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-accent p-3 mb-3">
                    <HeartHandshake className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70 mb-1">Level 3</span>
                  <h3 className="font-bold text-foreground text-lg mb-2">{t("about.level3Title", "1:1 Seelsorge")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {t("church.approach3Desc", "Wenn aus Fragen persönlicher Bedarf wird, vermittelt BibleBot direkt an Ihre Seelsorge weiter – mit Kontaktformular und Vertrauensvorschuss.")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{t("about.tag_personal", "Persönlich")}</span>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{t("about.tag_individual", "Individuell")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic max-w-xl mx-auto mb-4">
              {t("church.approachNote", "BibleBot.Life ersetzt keine Seelsorge – es öffnet die Tür dorthin. Als Ihr digitaler 1st-Level-Kanal senken wir die Hemmschwelle und bringen Menschen zu Ihnen.")}
            </p>
            <Button
              variant="default"
              onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Send className="h-4 w-4 mr-2" />
              {t("church.approachCta", "Jetzt Partnerschaft besprechen")}
            </Button>
          </div>
        </div>
      </section>

      {/* Denominations & Churches */}
      <section className="py-16 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.denominationsTitle")}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">{t("church.denominationsSubtitle")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {([
              { key: "reformed", icon: BookOpen },
              { key: "catholic", icon: Cross },
              { key: "lutheran", icon: Church },
              { key: "evangelical", icon: Flame },
              { key: "freelance", icon: Sparkles },
            ] as const).map((denom) => (
              <Card key={denom.key} className="bg-card/80 border-border text-center p-4">
                <CardHeader className="p-0 pb-2">
                  <denom.icon className="h-7 w-7 text-primary mx-auto mb-1" />
                  <CardTitle className="text-sm font-semibold leading-tight">{t(`church.denomination.${denom.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground leading-snug">{t(`church.denomination.${denom.key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 px-4">
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
      <section className="py-16 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.institutionsTitle")}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">{t("church.institutionsSubtitle")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {([
              { key: "careHome", icon: Building2 },
              { key: "seniorHome", icon: Heart },
              { key: "hospital", icon: Hospital },
              { key: "rehaClinic", icon: Activity },
              { key: "psychiatry", icon: Brain },
              { key: "burnoutClinic", icon: HeartPulse },
              { key: "hospice", icon: Home },
              { key: "counseling", icon: MessageSquareHeart },
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
                <CardContent className="text-center">
                  <div className="py-2">
                    <div className="text-3xl font-bold text-foreground">CHF {tier.monthly}<span className="text-base font-normal text-muted-foreground">/Mt.</span></div>
                    <div className="text-xs text-muted-foreground mt-1">zzgl. einmalige Einrichtung CHF {tier.setup}</div>
                    <div className="text-[11px] text-muted-foreground mt-2 italic">= CHF {tier.setup + tier.monthly * 12} im 1. Jahr</div>
                  </div>
                  <Button
                    className="w-full mt-4"
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

          {/* Setup includes */}
          <div className="mt-12 max-w-3xl mx-auto bg-card/60 border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Was ist im Einrichtungspaket enthalten?</h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {SETUP_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transparency note */}
          <div className="mt-6 max-w-3xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-xl p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              BibleBot.Life wird von der <strong>2Go Media AG</strong> entwickelt und professionell betrieben.
              Die Abo-Pakete finanzieren Weiterentwicklung, Qualitätssicherung und persönlichen Support.
              Für Privatpersonen bleibt BibleBot kostenlos. Alle Preise exkl. MwSt.
            </p>
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
                        <SelectItem value="Reformiert">{t("church.form.orgTypes.reformed")}</SelectItem>
                        <SelectItem value="Katholisch">{t("church.form.orgTypes.catholic")}</SelectItem>
                        <SelectItem value="Lutherisch">{t("church.form.orgTypes.lutheran")}</SelectItem>
                        <SelectItem value="Freikirche">{t("church.form.orgTypes.evangelical")}</SelectItem>
                        <SelectItem value="Freischaffend">{t("church.form.orgTypes.freelance")}</SelectItem>
                        <SelectItem value="Pflegeheim">{t("church.form.orgTypes.careHome")}</SelectItem>
                        <SelectItem value="Altersheim">{t("church.form.orgTypes.seniorHome")}</SelectItem>
                        <SelectItem value="Spital">{t("church.form.orgTypes.hospital")}</SelectItem>
                        <SelectItem value="Gefängnisseelsorge">{t("church.form.orgTypes.prison")}</SelectItem>
                        <SelectItem value="Armeeseelsorge">{t("church.form.orgTypes.military")}</SelectItem>
                        <SelectItem value="Reha-Klinik">{t("church.form.orgTypes.rehaClinic")}</SelectItem>
                        <SelectItem value="Psychiatrie">{t("church.form.orgTypes.psychiatry")}</SelectItem>
                        <SelectItem value="Burnout-Klinik">{t("church.form.orgTypes.burnoutClinic")}</SelectItem>
                        <SelectItem value="Hospiz">{t("church.form.orgTypes.hospice")}</SelectItem>
                        <SelectItem value="Beratungsstelle">{t("church.form.orgTypes.counseling")}</SelectItem>
                        <SelectItem value="Andere">{t("church.form.orgTypes.other")}</SelectItem>
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

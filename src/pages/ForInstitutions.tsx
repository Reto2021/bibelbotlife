import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Hospital, HeartPulse, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tiers = [
  {
    key: "starter",
    name: "Starter",
    monthly: 250,
    setup: 990,
    icon: Building2,
    desc: "Für KMU und einzelne Abteilungen",
    includes: ["Co-Branding", "Nutzungsstatistik", "E-Mail-Support"],
    popular: false,
  },
  {
    key: "professional",
    name: "Professional",
    monthly: 500,
    setup: 1990,
    icon: Hospital,
    desc: "Für Spital-Seelsorge und HR-Abteilungen",
    includes: ["Custom Integration", "DSG-Dokumentation", "Schulung", "Priority Support"],
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthly: null as number | null,
    setup: null as number | null,
    icon: HeartPulse,
    desc: "Für Kantonsspitäler, Versicherer, Multi-Standort",
    includes: ["Dedicated Account Manager", "SLA", "API-Zugang", "Compliance-Paket", "Custom Development"],
    popular: false,
  },
];

const ForInstitutions = () => {
  const [formData, setFormData] = useState({ name: "", email: "", organization: "", message: "" });
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
        church_name: formData.organization ? `[Institution] ${formData.organization}` : "[Institution]",
        preferred_tier: "enterprise",
        message: formData.message,
      });
      if (error) throw error;

      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: formData.email,
          idempotencyKey: `inst-confirm-${id}`,
          templateData: { name: formData.name || undefined },
        },
      });
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: "kontakt@bibelbot.ch",
          idempotencyKey: `inst-notify-${id}`,
          templateData: {
            senderName: formData.name || undefined,
            senderEmail: formData.email,
            organizationType: "Institution",
            churchName: formData.organization || undefined,
            message: formData.message,
            source: "Institutionen-Seite",
          },
        },
      });

      toast.success("Vielen Dank — wir melden uns innert 2 Arbeitstagen.");
      setFormData({ name: "", email: "", organization: "", message: "" });
    } catch {
      toast.error("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <SEOHead
        titleKey="meta.forInstitutionsTitle"
        descKey="meta.forInstitutionsDesc"
        path="/for-institutions"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
            <Building2 className="h-4 w-4" />
            Für Institutionen & Unternehmen
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Biblische Begleitung — professionell integriert
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Für Spitäler, Pflegeeinrichtungen, Versicherer und Unternehmen, die ihren
            Mitarbeitenden oder Patienten einen niederschwelligen Zugang zu Reflexion und
            biblischer Orientierung ermöglichen wollen.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Ein Angebot der 2Go Media AG · Alle Preise exkl. MwSt.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.key}
                className={`relative bg-card/80 border-border ${tier.popular ? "ring-2 ring-primary shadow-xl" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Empfohlen
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{tier.desc}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-3 border-y border-border my-3">
                    {tier.monthly !== null ? (
                      <>
                        <div className="text-3xl font-bold text-foreground">
                          CHF {tier.monthly}<span className="text-base font-normal text-muted-foreground">/Mt.</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          zzgl. einmalige Einrichtung CHF {tier.setup}
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-foreground">Auf Anfrage</div>
                    )}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() =>
                      document.getElementById("institution-contact")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Kontakt aufnehmen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="institution-contact" className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">Sprechen wir darüber</h2>
          <p className="text-muted-foreground text-center mb-8">
            Wir melden uns innert 2 Arbeitstagen mit einem persönlichen Vorschlag.
          </p>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Ihr Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">E-Mail-Adresse *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Organisation</label>
                  <Input
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Ihre Nachricht *</label>
                  <Textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    maxLength={2000}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Wird gesendet..." : "Anfrage senden"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ForInstitutions;

import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  Heart, Mic, FileText, Calendar, Users, Music,
  BookOpen, Sparkles, Monitor, Layout, ChevronDown, Check, ArrowRight
} from "lucide-react";
import { useState } from "react";

const featureIcons = [Mic, Sparkles, FileText, Layout, Calendar, Monitor, Music, Users, BookOpen, Heart];

export default function ForCelebrants() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = Array.from({ length: 10 }, (_, i) => ({
    icon: featureIcons[i],
    title: t(`celebrants.f${i + 1}Title`),
    desc: t(`celebrants.f${i + 1}Desc`),
  }));

  const painPoints = [
    t("celebrants.pain1"),
    t("celebrants.pain2"),
    t("celebrants.pain3"),
    t("celebrants.pain4"),
  ];

  const personalFeatures = Array.from({ length: 5 }, (_, i) => t(`celebrants.pf${i + 1}`));
  const proFeatures = Array.from({ length: 10 }, (_, i) => t(`celebrants.pf${i + 6}`));

  const pricingPlans = [
    {
      name: t("celebrants.planPersonal"),
      price: t("celebrants.planFree"),
      features: personalFeatures,
      cta: t("celebrants.ctaFree"),
      popular: false,
      isPaid: false,
    },
    {
      name: t("celebrants.planPro"),
      price: t("celebrants.planProSupported"),
      features: proFeatures,
      cta: t("celebrants.ctaSponsor"),
      popular: true,
      isPaid: true,
    },
  ];

  const faqs = Array.from({ length: 5 }, (_, i) => ({
    q: t(`celebrants.faq${i + 1}q`),
    a: t(`celebrants.faq${i + 1}a`),
  }));

  return (
    <>
      <SEOHead
        title={t("celebrants.seoTitle")}
        description={t("celebrants.seoDesc")}
      />

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">{t("celebrants.badge")}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            {t("celebrants.heroTitle1")}<br />
            <span className="text-primary">{t("celebrants.heroTitle2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("celebrants.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/login">{t("celebrants.ctaStart")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <a href="#features">{t("celebrants.ctaFeatures")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-foreground">{t("celebrants.painTitle")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border">
                <span className="text-destructive mt-0.5 text-xl">✗</span>
                <p className="text-muted-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-foreground">{t("celebrants.featuresTitle")}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">{t("celebrants.featuresSubtitle")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <f.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-foreground">{t("celebrants.pricingTitle")}</h2>
          <p className="text-center text-muted-foreground mb-12">{t("celebrants.pricingSubtitle")}</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card key={i} className={`relative overflow-hidden ${plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {t("celebrants.recommended")}
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.isPaid ? (
                      <Link to="/for-churches#contact-form">{plan.cta}</Link>
                    ) : (
                      <Link to="/login">{plan.cta}</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">{t("celebrants.faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t("celebrants.ctaBottom")}</h2>
          <p className="text-muted-foreground mb-8">{t("celebrants.ctaBottomSub")}</p>
          <Button asChild size="lg" className="text-base px-10">
            <Link to="/login">{t("celebrants.ctaBottomBtn")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BibleBot.Life</p>
          <div className="flex gap-4">
            <Link to="/impressum" className="hover:text-foreground">{t("celebrants.footerImprint")}</Link>
            <Link to="/datenschutz" className="hover:text-foreground">{t("celebrants.footerPrivacy")}</Link>
            <Link to="/for-churches" className="hover:text-foreground">{t("celebrants.footerChurches")}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

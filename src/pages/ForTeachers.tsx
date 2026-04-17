import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, BookOpen, Calendar, Users, Sparkles, Monitor,
  ClipboardList, FileText, Target, Lightbulb, Check, ArrowRight, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const featureIcons = [Target, Sparkles, BookOpen, ClipboardList, Calendar, Monitor, Users, FileText, Lightbulb];

export default function ForTeachers() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = Array.from({ length: 9 }, (_, i) => ({
    icon: featureIcons[i],
    title: t(`teachers.f${i + 1}Title`),
    desc: t(`teachers.f${i + 1}Desc`),
  }));

  const painPoints = Array.from({ length: 4 }, (_, i) => t(`teachers.pain${i + 1}`));
  const teacherFeatures = Array.from({ length: 8 }, (_, i) => t(`teachers.tf${i + 1}`));
  const faqs = Array.from({ length: 5 }, (_, i) => ({
    q: t(`teachers.faq${i + 1}q`),
    a: t(`teachers.faq${i + 1}a`),
  }));

  return (
    <>
      <SEOHead
        title={t("teachers.seoTitle")}
        description={t("teachers.seoDesc")}
        canonicalUrl="https://biblebot.life/unterrichtsplaner"
      />
      <SiteHeader />

      <main className="bg-background">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("teachers.eyebrow")}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              {t("teachers.heroLine1")}<br />
              <span className="text-primary">{t("teachers.heroLine2")}</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("teachers.heroDesc")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="text-base">
                <Link to="/login?redirect=/dashboard/lessons">
                  {t("teachers.ctaStart")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/dashboard/lessons">{t("teachers.ctaDemo")}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {t("teachers.heroNote")}
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-foreground">
              {t("teachers.painTitle")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.map((p, i) => (
                <Card key={i} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-destructive font-bold shrink-0">✗</span>
                    <p className="text-sm text-foreground">{p}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-lg font-medium text-foreground">
              {t("teachers.painSolution")}
            </p>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                {t("teachers.featuresTitle")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("teachers.featuresDesc")}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                    <GraduationCap className="h-4 w-4" /> {t("teachers.includedEyebrow")}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t("teachers.includedTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("teachers.includedDesc")}</p>
                </div>
                <ul className="space-y-2 pt-2">
                  {teacherFeatures.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-4" size="lg">
                  <Link to="/login?redirect=/dashboard/lessons">
                    {t("teachers.ctaStart")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-foreground">{t("teachers.faqTitle")}</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <button
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-foreground">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <GraduationCap className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t("teachers.finalTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("teachers.finalDesc")}
            </p>
            <Button asChild size="lg" className="text-base">
              <Link to="/login?redirect=/dashboard/lessons">
                {t("teachers.ctaStart")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

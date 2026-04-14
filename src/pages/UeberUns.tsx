import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import retoPhoto from "@/assets/reto-wettstein.jpg";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award, Briefcase, GraduationCap, Heart, Linkedin,
  MapPin, ExternalLink, Users, Lightbulb, Building2
} from "lucide-react";

const EDUCATION = [
  "Dipl. Wirtschaftsinformatiker UZH",
  "Dipl. Handelslehrer UZH",
  "Eidg. dipl. Führungsfachmann mit FA",
  "CAS Strategy with Impact FHGR",
  "CAS Krisenkommunikation ZHAW",
  "VR-CAS Swiss Board School HSG",
  "Scrum Master",
];

const AWARDS = [
  "Venture Leader 2011",
  "Microsoft Innovation Award 2011",
  "Nominiert Swiss CRM Innovation Award 2011",
  "Nominiert Microsoft European BizSpark Award 2011",
];

const ENGAGEMENTS = [
  "Grossrat Kanton Aargau",
  "Alt-Vize-Ammann Stadt Brugg",
  "Präsident Stiftungsrat Stiftung Gesundheit Region Brugg",
  "Präsident VR Süssbach Pflegezentrum AG",
  "Vize-Präsident IBB Holding AG",
  "OK-Präsident Stadtfest 2026",
];

export default function UeberUns() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("about.title", "Über uns – BibleBot.Life")}
        description={t("about.metaDesc", "Wer steht hinter BibleBot.Life? Erfahren Sie mehr über den Gründer Reto Wettstein und die Vision hinter dem Projekt.")}
        path="/ueber-uns"
      />
      <SiteHeader />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("about.heading", "Über BibleBot.Life")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("about.intro", "BibleBot.Life ist ein persönliches Herzensprojekt – geboren aus dem Glauben, dass die Bibel für jeden Menschen zugänglich und verständlich sein sollte. Unabhängig von Konfession, Sprache oder technischem Wissen.")}
          </p>
        </section>

        {/* Vision */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 shrink-0">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("about.visionTitle", "Die Vision")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("about.visionText", "Ein kostenloser, anonymer Begleiter für alle, die sich mit der Bibel beschäftigen möchten. Kein Tracking, kein Urteil – einfach ein gutes Gespräch bei Kerzenlicht. In 38 Sprachen, für Kirchen, Seelsorger und jeden Einzelnen.")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3-Level Approach */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            {t("about.approachTitle", "Unser Ansatz")}
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            {t("about.approachSubtitle", "Seelsorge beginnt nicht erst im persönlichen Gespräch. Sie beginnt dort, wo Menschen Fragen haben – oft still, oft nachts, oft allein.")}
          </p>

          <div className="relative flex flex-col items-center gap-0">
            {/* Level 1 – BibleBot – widest */}
            <div className="w-full max-w-2xl">
              <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-lg" />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/15 p-2.5 shrink-0 mt-0.5">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          {t("about.level1Badge", "Erste Anlaufstelle")}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-lg">BibleBot.Life</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {t("about.level1Desc", "Rund um die Uhr da, anonym und ohne Hemmschwelle. Für alle, die eine Frage haben, einen Impuls suchen oder einfach nicht allein sein möchten – der erste Schritt ist der leichteste.")}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">24/7</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("about.tag_anonymous", "Anonym")}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("about.tag_free", "Kostenlos")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connector */}
            <div className="w-px h-6 bg-border" />

            {/* Level 2 – Gottesdienst – medium */}
            <div className="w-full max-w-lg">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary rounded-l-lg" />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-secondary/15 p-2.5 shrink-0 mt-0.5">
                      <Church className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                          {t("about.level2Badge", "Gemeinschaft")}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-lg">{t("about.level2Title", "Gottesdienst & Gemeinde")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {t("about.level2Desc", "Zusammenkommen, zuhören, miteinander feiern. Der Gottesdienst gibt dem Glauben ein Zuhause in der Gemeinschaft.")}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{t("about.tag_weekly", "Wöchentlich")}</span>
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{t("about.tag_community", "Gemeinschaft")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connector */}
            <div className="w-px h-6 bg-border" />

            {/* Level 3 – Seelsorge – narrowest */}
            <div className="w-full max-w-sm">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-foreground/50 rounded-l-lg" />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-accent p-2.5 shrink-0 mt-0.5">
                      <HeartHandshake className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70">
                          {t("about.level3Badge", "Persönlich")}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-lg">{t("about.level3Title", "1:1 Seelsorge")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {t("about.level3Desc", "Das vertrauliche Gespräch unter vier Augen. Für die Momente, die persönliche Begleitung brauchen.")}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{t("about.tag_personal", "Persönlich")}</span>
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{t("about.tag_individual", "Individuell")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 max-w-lg mx-auto italic">
            {t("about.approachNote", "BibleBot.Life senkt die Hemmschwelle – und führt Menschen Schritt für Schritt näher zur Gemeinschaft und zur persönlichen Begleitung.")}
          </p>
        </section>

        {/* Founder */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("about.founderTitle", "Der Gründer")}
          </h2>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="shrink-0 mx-auto md:mx-0">
                  <img
                    src={retoPhoto}
                    alt="Reto Wettstein"
                    className="w-40 h-40 md:w-48 md:h-48 rounded-xl object-cover object-top shadow-md"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Reto Wettstein</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Brugg, Kanton Aargau, Schweiz
                    </p>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {t("about.founderBio", "Reto Wettstein ist Wirtschaftsinformatiker, Unternehmer und politisch engagierter Familienvater aus Brugg. Er ist Gründer der auf digitale Marketing- und CRM-Prozesse spezialisierten Firmen biz.Telligence, Prime Data und 2Go Media AG. Mit Leidenschaft, strategischem Denken und viel Herzblut verbindet er Technologie mit gesellschaftlichem Engagement.")}
                  </p>

                  <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                    «Persönliche Identifikation und Herzblut für die Aufgabe sind Voraussetzungen für mein Engagement. Entweder bin ich mit Leidenschaft bei der Sache oder ich lasse es bleiben.»
                  </blockquote>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild variant="outline" size="sm">
                      <a href="https://www.reto-wettstein.ch" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        reto-wettstein.ch
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href="https://ch.linkedin.com/in/retowettstein" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                        LinkedIn
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Three columns: Education, Awards, Engagements */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Education */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t("about.education", "Ausbildung")}
              </h3>
              <ul className="space-y-1.5">
                {EDUCATION.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Awards */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                {t("about.awards", "Auszeichnungen")}
              </h3>
              <ul className="space-y-1.5">
                {AWARDS.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Engagements */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                {t("about.engagements", "Engagements")}
              </h3>
              <ul className="space-y-1.5">
                {ENGAGEMENTS.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Personal */}
        <Card className="mb-12">
          <CardContent className="p-6 md:p-8">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              {t("about.personal", "Persönliches")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block">{t("about.residence", "Wohnort")}</span>
                <span className="text-foreground font-medium">Brugg AG</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("about.confession", "Konfession")}</span>
                <span className="text-foreground font-medium">Ev.-ref.</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("about.family", "Familie")}</span>
                <span className="text-foreground font-medium">{t("about.familyValue", "Verheiratet, zwei Kinder")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t("about.cta", "Fragen, Ideen oder einfach Hallo sagen?")}
          </p>
          <Button asChild>
            <a href="/kontakt">{t("nav.contact", "Kontakt")}</a>
          </Button>
        </div>
      </main>
    </div>
  );
}

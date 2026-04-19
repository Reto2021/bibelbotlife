import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { MessageCircle, BookOpen, Calendar, Heart, Users, Star, GraduationCap, Church, CheckCircle2, Brain, X as XIcon, Check, HelpCircle, HandHeart, Copy, Compass, Send, Building2, Shield, EyeOff, Code2, Server, Globe, Headphones, ClipboardList, BookHeart } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ChurchBanner } from "@/components/ChurchBanner";
import { ReferralSection } from "@/components/ReferralSection";
import { EntryTiles } from "@/components/EntryTiles";
import { ChatHero } from "@/components/ChatHero";
import { LifeWheelProvider } from "@/components/LifeWheel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { ToolCard, useToolDefs } from "@/components/ToolCards";
import { useFavoriteTools } from "@/hooks/use-favorite-tools";
import { useAuth } from "@/hooks/use-auth";

// BibleBotChat overlay removed - chat is now inline in ChatHero
const DailyImpulse = lazy(() => import("@/components/DailyImpulse"));
const DailySubscribe = lazy(() => import("@/components/DailySubscribe"));
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

const BIBLE_EDITIONS_DATA = [
  { name: "Zürcher Bibel", year: "2007", traditionKey: "reformed" },
  { name: "Lutherbibel", year: "2017", traditionKey: "evangelical" },
  { name: "Einheitsübersetzung", year: "2016", traditionKey: "catholic" },
  { name: "Schlachter Bibel", year: "2000", traditionKey: "freeChurch" },
  { name: "Elberfelder Bibel", year: "2006", traditionKey: "literal" },
];

const ToolsSection = () => {
  const { t } = useTranslation();
  const tools = useToolDefs();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavoriteTools();

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            <Compass className="h-4 w-4" />
            {t("tools.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("tools.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("tools.subtitle")}
          </p>
          {user && (
            <p className="text-xs text-muted-foreground mt-2">
              <Star className="inline h-3 w-3 text-primary mr-1" />
              {t("tools.favoriteTip")}
            </p>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={isFavorite(tool.id)}
              isLoggedIn={!!user}
              onToggleFavorite={() => toggleFavorite(tool.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const { t, i18n } = useTranslation();

  const features = [
    { icon: BookOpen, title: t("features.bible.title"), description: t("features.bible.desc") },
    { icon: Star, title: t("features.goals.title"), description: t("features.goals.desc") },
    { icon: Heart, title: t("features.self.title"), description: t("features.self.desc") },
    { icon: GraduationCap, title: t("features.faith.title"), description: t("features.faith.desc") },
    { icon: Calendar, title: t("features.daily.title"), description: t("features.daily.desc") },
    { icon: Users, title: t("features.groups.title"), description: t("features.groups.desc") },
  ];

  const scienceMethods = [
    { icon: Brain, ...t("coaching.perma", { returnObjects: true }) as { name: string; author: string; desc: string } },
    { icon: Heart, ...t("coaching.logo", { returnObjects: true }) as { name: string; author: string; desc: string } },
    { icon: Star, ...t("coaching.gratitude", { returnObjects: true }) as { name: string; author: string; desc: string } },
    { icon: Users, ...t("coaching.forgiveness", { returnObjects: true }) as { name: string; author: string; desc: string } },
  ];

  const discoverCards = [
    { emoji: "🤔", title: t("discover.doubt.title"), text: t("discover.doubt.text") },
    { emoji: "🔍", title: t("discover.search.title"), text: t("discover.search.text") },
    { emoji: "🌱", title: t("discover.deepen.title"), text: t("discover.deepen.text") },
  ];

  return (
    <LifeWheelProvider>
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <SEOHead titleKey="meta.homeTitle" descKey="meta.homeDesc" path="/" />
      <ChurchBanner />
      {/* Navigation */}
      <SiteHeader />

      {/* Chat-First Hero – above the fold */}
      <ChatHero />

      {/* Entry Tiles — 9 curated topic chips in 3 groups */}
      <EntryTiles />

      <Suspense fallback={<div className="h-20" />}>
        <DailyImpulse />
      </Suspense>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("features.sectionTitle")}</h2>
            <p className="text-xl text-muted-foreground">{t("features.sectionSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-center leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Split — who is this for? */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("audience.title")}</h2>
            <p className="text-muted-foreground">{t("audience.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal use */}
            <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t("audience.personal.title")}</CardTitle>
                <CardDescription className="leading-relaxed">{t("audience.personal.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <ul className="space-y-2 mb-5">
                  {(["f1", "f2", "f3", "f4"] as const).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {t(`audience.personal.${f}`)}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" size="lg">
                  <a href="#chat">{t("audience.personal.cta")}</a>
                </Button>
              </CardContent>
            </Card>

            {/* Church / celebrant use */}
            <Card className="bg-card/80 backdrop-blur-sm border-secondary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                  <Church className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">{t("audience.church.title")}</CardTitle>
                <CardDescription className="leading-relaxed">{t("audience.church.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <ul className="space-y-2 mb-5">
                  {(["f1", "f2", "f3", "f4"] as const).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      {t(`audience.church.${f}`)}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full border-secondary/40 hover:bg-secondary/10 hover:text-secondary" size="lg">
                  <Link to="/for-churches">{t("audience.church.cta")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {([
              { icon: Shield, key: "qa" },
              { icon: EyeOff, key: "noAds" },
              { icon: Heart, key: "noExpertise" },
            ] as const).map((item) => (
              <div key={item.key} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/60 border border-border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{t(`trust.${item.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`trust.${item.key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warum BibleBot? — 3 Pressewinkel */}
      <section className="py-16 px-4 bg-card/40">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("why.title", "Warum BibleBot — und nicht einfach ChatGPT?")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("why.subtitle", "Drei Unterschiede, die zählen.")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🏛️",
                title: t("why.wisdom.title", "Nicht irgendeine KI"),
                text: t("why.wisdom.text", "BibleBot kennt über 35 Bibelübersetzungen in 38 Sprachen und prüft jede Stelle automatisch auf Korrektheit. Keine Halluzinationen, kein Raten — nur geprüfte Weisheit aus 2000 Jahren."),
              },
              {
                emoji: "🆘",
                title: t("why.crisis.title", "Mit Krisenintervention"),
                text: t("why.crisis.text", "Als erste Bibel-App weltweit erkennt BibleBot automatisch Krisensituationen und leitet sofort zu Telefonseelsorge-Nummern in CH, DE und AT weiter."),
              },
              {
                emoji: "⛪",
                title: t("why.nochurch.title", "Ergänzt deine Gemeinde"),
                text: t("why.nochurch.text", "Ob du jeden Sonntag in der Kirche bist oder die Bibel jahrelang nicht aufgeschlagen hast — BibleBot begegnet dir dort, wo du gerade stehst. Kein Vorwissen nötig."),
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 hover:shadow-md transition-shadow">
                <span className="text-4xl">{item.emoji}</span>
                <h3 className="font-bold text-foreground text-lg leading-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glaube neu entdecken */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Compass className="h-4 w-4" />
              {t("discover.badge")}
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("discover.title")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("discover.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {discoverCards.map((item) => (
              <Card key={item.title} className="bg-card/80 border-border text-center">
                <CardHeader>
                  <span className="text-3xl mb-2 block">{item.emoji}</span>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border p-8 text-center">
            <p className="text-foreground/80 italic text-lg mb-2">{t("discover.quote")}</p>
            <p className="text-muted-foreground text-sm mb-6">{t("discover.quoteRef")}</p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{t("discover.quoteText")}</p>
          </div>
        </div>
      </section>

      {/* Mein Kreis Teaser */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Users className="h-4 w-4" />
              {t("circle.teaserBadge")}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("circle.teaserTitle")}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{t("circle.teaserDesc")}</p>
            <Button asChild size="lg">
              <Link to="/mein-kreis">
                <Users className="h-4 w-4 mr-2" />
                {t("circle.teaserCta")}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Subscribe CTA is now integrated in the DailyImpulse banner */}
      {/* Referral / Empfehlen */}
      <ReferralSection />
      {/* Tools Section */}
      <ToolsSection />

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              <HelpCircle className="h-4 w-4" />
              {t("faq.badge")}
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("faq.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("faq.subtitle")}</p>
          </div>

          <Accordion type="multiple" className="space-y-3">
            <AccordionItem value="unterschied" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t("faq.q1")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-3">{t("faq.q1Generic")}</p>
                    <div className="space-y-2">
                      {(t("faq.q1GenericItems", { returnObjects: true }) as string[]).map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <XIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-3">{t("faq.q1Bot")}</p>
                    <div className="space-y-2">
                      {(t("faq.q1BotItems", { returnObjects: true }) as string[]).map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-telegram shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/90">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bibeln" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t("faq.q2")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">{t("faq.q2Intro")}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BIBLE_EDITIONS_DATA.map((bible) => (
                    <div key={bible.name} className="flex items-center gap-3 bg-accent/30 rounded-lg px-4 py-3">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{bible.name} ({bible.year})</p>
                        <p className="text-xs text-muted-foreground">{t(`faq.tradition.${bible.traditionKey}`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm">{t("faq.q2Outro")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="psychologie" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t("faq.q3")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">{t("faq.q3Intro")}</p>
                <div className="space-y-3">
                  {scienceMethods.map((g) => (
                    <div key={g.name} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <g.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{g.name} <span className="text-muted-foreground font-normal">({g.author})</span></p>
                        <p className="text-sm">{g.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="guardrails" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t("faq.q4")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <div className="space-y-3">
                  {(t("faq.q4Items", { returnObjects: true }) as string[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-telegram shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {(["q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"] as const).map((key) => (
              <AccordionItem key={key} value={key} className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t(`faq.${key}`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">{t(`faq.${key}Answer`)}</AccordionContent>
              </AccordionItem>
            ))}

            <AccordionItem value="methodik" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faqExtra.methodik.q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">{t("coaching.subtitle")}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {scienceMethods.map((method) => (
                    <div key={method.name} className="text-center">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <method.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.author}</p>
                      <p className="text-xs text-muted-foreground mt-1">{method.desc}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="journey" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faqExtra.journey.q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">{t("coaching.journeyDesc")}</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { num: 1, title: t("coaching.week1"), desc: t("coaching.week1Desc") },
                    { num: 2, title: t("coaching.week2"), desc: t("coaching.week2Desc") },
                    { num: 3, title: t("coaching.week3"), desc: t("coaching.week3Desc") },
                  ].map((w) => (
                    <div key={w.num}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{w.num}</span>
                        <span className="font-semibold text-foreground text-sm">{w.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="glaube-psychologie" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faqExtra.faithPsych.q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                {t("faqExtra.faithPsych.a")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Spenden Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              <HandHeart className="h-4 w-4" />
              {t("donate.badge")}
            </span>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">{t("donate.title")}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">{t("donate.subtitle")}</p>
          
          <Card className="bg-card/80 backdrop-blur-sm border-border max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">{t("donate.onlineTitle", "Online spenden")}</CardTitle>
              <CardDescription>{t("donate.bankSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link to="/spenden">
                    <Heart className="h-4 w-4 mr-2" />
                    {t("donate.ctaDonate", "Jetzt spenden")}
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t("donate.stripeNote", "Sicher via Kreditkarte, Twint & mehr")}
              </p>
            </CardContent>
          </Card>

          {/* Verwendungszwecke */}
          <div className="mt-10 max-w-lg mx-auto text-left">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">{t("donate.purposeHeading")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Code2, key: "purposeItem1" },
                { icon: Server, key: "purposeItem2" },
                { icon: Globe, key: "purposeItem3" },
                { icon: Headphones, key: "purposeItem4" },
                { icon: ClipboardList, key: "purposeItem5" },
                { icon: BookHeart, key: "purposeItem6" },
              ].map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{t(`donate.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-8">{t("donate.note")}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundImage: "var(--gradient-cta)" }}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">{t("cta.title")}</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">{t("cta.subtitle")}</p>
          <Button size="lg" className="bg-card text-foreground hover:bg-card/90 px-8 py-4 text-lg font-semibold" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <MessageCircle className="h-5 w-5 mr-2" />
              {t("cta.button")}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <AppLogo className="h-10 w-10" invertTheme />
            <span className="text-2xl font-bold">BibleBot<span className="text-muted">.Life</span></span>
          </div>
          <p className="mb-4 text-center text-background/70">{t("footer.tagline")}</p>
          <p className="text-background/50 text-xs mb-6 max-w-2xl mx-auto text-center">{t("footer.disclaimer")}</p>
          
          <div className="border-t border-background/20 pt-6 mt-6">
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-background/50 mb-8">
              <div>
                <p className="font-semibold text-background/70 mb-2">{t("footer.impressum")}</p>
                <p>2Go Media AG</p>
                <p>Industriestrasse 19</p>
                <p>5200 Brugg, Schweiz</p>
                <p className="mt-1">kontakt@biblebot.life</p>
              </div>
              <div>
                <p className="font-semibold text-background/70 mb-2">{t("footer.notes")}</p>
                <p>{t("footer.private")}</p>
                <p>{t("footer.noChat")}</p>
                <p>{t("footer.noTax")}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-background/50 mb-4">
              <Link to="/impressum" className="hover:text-background/80 underline underline-offset-2">{t("footer.impressum")}</Link>
              <Link to="/datenschutz" className="hover:text-background/80 underline underline-offset-2">{t("footer.datenschutz")}</Link>
              <Link to="/for-churches" className="hover:text-background/80 underline underline-offset-2">{t("footer.forChurches")}</Link>
              <Link to="/fuer-seelsorger" className="hover:text-background/80 underline underline-offset-2">{t("footer.forCelebrants")}</Link>
              <Link to="/churches" className="hover:text-background/80 underline underline-offset-2">{t("church.directoryBadge")}</Link>
              <Link to="/spenden" className="hover:text-background/80 underline underline-offset-2">{t("nav.donate", "Spenden")}</Link>
              <Link to="/kontakt" className="hover:text-background/80 underline underline-offset-2">{t("nav.contact", "Kontakt")}</Link>
              <Link to="/ueber-uns" className="hover:text-background/80 underline underline-offset-2">{t("nav.about", "Über uns")}</Link>
            </div>

            <p className="text-background/40 text-xs text-center mb-1">© 2026 BibleBot.Life</p>
            <p className="text-background/50 text-sm text-center">{t("footer.love")}</p>
          </div>
        </div>
      </footer>

      {/* BibleBotChat overlay removed - chat is inline in hero */}
    </div>
    </LifeWheelProvider>
  );
};

export default Index;

import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, BookOpen, Calendar, Heart, Users, Star, GraduationCap, Church, CheckCircle2, Brain, X as XIcon, Check, HelpCircle, HandHeart, Copy, Compass, Send, Building2, Menu, FileText, ShieldCheck, LogIn, LogOut, User } from "lucide-react";
import bibelbotLogo from "@/assets/biblebot-logo.png";
import { ChurchBanner } from "@/components/ChurchBanner";
import { ReferralSection } from "@/components/ReferralSection";
// EntryTiles removed - chips are now in ChatHero
import { ChatHero } from "@/components/ChatHero";
import { LifeWheelProvider } from "@/components/LifeWheel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// BibleBotChat overlay removed - chat is now inline in ChatHero
const DailyImpulse = lazy(() => import("@/components/DailyImpulse").then(m => ({ default: m.DailyImpulse })));
const DailySubscribe = lazy(() => import("@/components/DailySubscribe").then(m => ({ default: m.DailySubscribe })));
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

const BIBLE_EDITIONS = [
  { name: "Zürcher Bibel", year: "2007", tradition: "Reformiert" },
  { name: "Lutherbibel", year: "2017", tradition: "Evangelisch" },
  { name: "Einheitsübersetzung", year: "2016", tradition: "Katholisch" },
  { name: "Schlachter Bibel", year: "2000", tradition: "Freikirchlich" },
  { name: "Elberfelder Bibel", year: "2006", tradition: "Wortgetreu" },
];

const Index = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <ChurchBanner />
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={bibelbotLogo} alt="BibleBot" className="h-16 w-16" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground leading-tight">BibleBot<span className="text-lg font-normal text-muted-foreground">.Life</span></span>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground/70">Everyday Sunday</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop links */}
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/for-churches">
                <Church className="h-4 w-4 mr-1" />
                {t("church.badge")}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/for-institutions">
                <Building2 className="h-4 w-4 mr-1" />
                {t("institutions.badge")}
              </Link>
            </Button>
            <LanguageSwitcher />
            <DarkModeToggle />
            {user ? (
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-1" />
                {t("auth.logout", "Abmelden")}
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  {t("auth.loginShort", "Anmelden")}
                </Link>
              </Button>
            )}
            <Button asChild className="hidden sm:inline-flex bg-telegram hover:bg-telegram/90 text-telegram-foreground">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4 mr-2" />
                {t("nav.startNow")}
              </a>
            </Button>
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        <div
          className={`sm:hidden border-t border-border bg-card/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-t-transparent"
          }`}
        >
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              <Link
                to="/for-churches"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Church className="h-4 w-4 text-primary" />
                {t("church.badge")}
              </Link>
              <Link
                to="/for-institutions"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 className="h-4 w-4 text-primary" />
                {t("institutions.badge")}
              </Link>
              <Link
                to="/churches"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4 text-primary" />
                {t("footer.forChurches")}
              </Link>
              <Link
                to="/impressum"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                {t("footer.impressum")}
              </Link>
              <Link
                to="/datenschutz"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                {t("footer.datenschutz")}
              </Link>
              {user ? (
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4 text-primary" />
                  {t("auth.logout", "Abmelden")}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4 text-primary" />
                  {t("auth.loginShort", "Anmelden")}
                </Link>
              )}
              <div className="pt-2 pb-1">
                <Button asChild className="w-full bg-telegram hover:bg-telegram/90 text-telegram-foreground">
                  <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                    <Send className="h-4 w-4 mr-2" />
                    {t("nav.startNow")}
                  </a>
                </Button>
              </div>
            </div>
        </div>
      </nav>

      <Suspense fallback={<div className="h-20" />}>
        <DailyImpulse />
      </Suspense>

      {/* Chat-First Hero */}
      <ChatHero />

      {/* Entry Tiles removed - integrated as chips in ChatHero */}

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

      {/* Coaching-Methodik Section */}
      <section className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Brain className="h-4 w-4" />
              {t("coaching.badge")}
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">{t("coaching.title")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("coaching.subtitle")}</p>
          </div>

          {/* 21-Tage Journey */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8 mb-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t("coaching.journeyTitle")}</h3>
                <p className="text-muted-foreground">{t("coaching.journeyDesc")}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: 1, title: t("coaching.week1"), desc: t("coaching.week1Desc") },
                { num: 2, title: t("coaching.week2"), desc: t("coaching.week2Desc") },
                { num: 3, title: t("coaching.week3"), desc: t("coaching.week3Desc") },
              ].map((w) => (
                <div key={w.num}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{w.num}</span>
                    <span className="font-semibold text-foreground">{w.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fragetechniken */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Card className="bg-card/80 border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">{t("coaching.openQuestionsTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t("coaching.openQuestionsDesc")}</p>
                <div className="space-y-2">
                  {[t("coaching.openQ1"), t("coaching.openQ2"), t("coaching.openQ3")].map((q, i) => (
                    <p key={i} className="text-sm text-foreground/80 italic pl-3 border-l-2 border-primary/20">{q}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <Heart className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">{t("coaching.honestTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t("coaching.honestDesc")}</p>
                <div className="space-y-2">
                  {[t("coaching.honest1"), t("coaching.honest2"), t("coaching.honest3")].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wissenschaftliche Basis */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 text-center">{t("coaching.scienceTitle")}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {scienceMethods.map((method) => (
                <div key={method.name} className="text-center">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <method.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{method.name}</p>
                  <p className="text-xs text-muted-foreground">{method.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">{method.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("coaching.renameTip") }} />
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

      {/* Subscribe CTA is now integrated in the DailyImpulse banner */}
      {/* Referral / Empfehlen */}
      <ReferralSection />

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
                  {BIBLE_EDITIONS.map((bible) => (
                    <div key={bible.name} className="flex items-center gap-3 bg-accent/30 rounded-lg px-4 py-3">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{bible.name} ({bible.year})</p>
                        <p className="text-xs text-muted-foreground">{bible.tradition}</p>
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

            {(["q5", "q6", "q7", "q8", "q9"] as const).map((key) => (
              <AccordionItem key={key} value={key} className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{t(`faq.${key}`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">{t(`faq.${key}Answer`)}</AccordionContent>
              </AccordionItem>
            ))}
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
              <CardTitle className="text-xl">{t("donate.bankTitle")}</CardTitle>
              <CardDescription>{t("donate.bankSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("donate.recipient")}</p>
                    <p className="font-medium text-foreground text-sm">Reto Wettstein</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-mono font-medium text-foreground text-sm">CH14 0900 0000 3042 9878 8</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText("CH1409000000304298788")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Copy IBAN"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("donate.bank")}</p>
                    <p className="font-medium text-foreground text-sm">PostFinance</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("donate.purpose")}</p>
                    <p className="font-medium text-foreground text-sm">{t("donate.purposeValue")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mt-6">{t("donate.note")}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundImage: "var(--gradient-cta)" }}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">{t("cta.title")}</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">{t("cta.subtitle")}</p>
          <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 px-8 py-4 text-lg font-semibold">
            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
              <Send className="h-5 w-5 mr-2" />
              {t("cta.button")}
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <img src={bibelbotLogo} alt="BibleBot" className="h-10 w-10" />
            <span className="text-2xl font-bold">BibleBot.Life</span>
          </div>
          <p className="text-background/70 mb-4 text-center">{t("footer.tagline")}</p>
          <p className="text-background/50 text-xs mb-6 max-w-2xl mx-auto text-center">{t("footer.disclaimer")}</p>
          
          <div className="border-t border-background/20 pt-6 mt-6">
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-background/50 mb-8">
              <div>
                <p className="font-semibold text-background/70 mb-2">{t("footer.impressum")}</p>
                <p>Reto Wettstein</p>
                <p>Rebmoosweg 63</p>
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
              <Link to="/for-institutions" className="hover:text-background/80 underline underline-offset-2">{t("institutions.badge")}</Link>
              <Link to="/churches" className="hover:text-background/80 underline underline-offset-2">{t("church.directoryBadge")}</Link>
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

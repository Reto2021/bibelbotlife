import { lazy, Suspense } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import {
  MessageCircle, BookOpen, Heart, Users, GraduationCap, HelpCircle, HandHeart,
  Mail, Building2, HeartHandshake, Bot, User, MapPin, Calendar, Compass,
  Shield, EyeOff, X as XIcon, Check,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ChurchBanner } from "@/components/ChurchBanner";
import { ChatHero } from "@/components/ChatHero";
import { LifeWheelProvider } from "@/components/LifeWheel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppLogo } from "@/components/AppLogo";
import { Link } from "@/lib/router-compat";

const DailyImpulse = lazy(() => import("@/components/DailyImpulse"));

const BIBLE_EDITIONS_DATA = [
  { name: "Lutherbibel", year: "1912", traditionKey: "evangelical" },
  { name: "Schlachter Bibel", year: "2000", traditionKey: "freeChurch" },
  { name: "Elberfelder Bibel", year: "2006", traditionKey: "literal" },
];

// Ruhige Entdecken-Sektion: alle Nebenwege als schlichte Kacheln statt langer Marketing-Blöcke
const DiscoverGrid = () => {
  const { t } = useTranslation();

  const tiles = [
    { icon: HandHeart, to: "/gebetswand", label: t("nav.prayerWall") },
    { icon: GraduationCap, to: "/bibelquiz", label: t("nav.bibleQuiz") },
    { icon: MapPin, to: "/kreuzwege", label: t("nav.crossways", "Kreuzwege") },
    { icon: BookOpen, to: "/bible-search", label: t("nav.bibleSearch", "Bibelsuche") },
    { icon: Calendar, to: "/dashboard", label: t("nav.planner", "Messeplaner") },
    { icon: Building2, to: "/for-churches", label: t("institutions.badge") },
    { icon: HeartHandshake, to: "/fuer-seelsorger", label: t("nav.forCelebrants") },
    { icon: User, to: "/mein-bereich", label: t("meinBereichNav") },
    { icon: Bot, to: "/connect", label: t("nav.connectChatGPT", "In ChatGPT verbinden") },
    { icon: Users, to: "/ueber-uns", label: t("nav.about", "Über uns") },
    { icon: Heart, to: "/spenden", label: t("nav.donate", "Spenden") },
    { icon: Mail, to: "/kontakt", label: t("nav.contact", "Kontakt") },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-3">
            <Compass className="h-4 w-4" />
            {t("nav.explore", "Entdecken")}
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">{t("discover.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("discover.subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className="group flex items-center gap-2.5 rounded-xl border border-border bg-card/70 px-3.5 py-3 text-sm text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <tile.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{tile.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const { t, i18n } = useTranslation();

  const scienceMethods = [
    { icon: Heart, ...t("coaching.logo", { returnObjects: true }) as { name: string; author: string; desc: string } },
    { icon: Shield, ...t("coaching.gratitude", { returnObjects: true }) as { name: string; author: string; desc: string } },
    { icon: Users, ...t("coaching.forgiveness", { returnObjects: true }) as { name: string; author: string; desc: string } },
  ];

  return (
    <LifeWheelProvider>
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <SEOHead titleKey="meta.homeTitle" descKey="meta.homeDesc" path="/" />
      <ChurchBanner />
      {/* Navigation */}
      <SiteHeader />

      <main>
        {/* Einziges sichtbares H1 steht im Chat-Hero; dieser Titel bleibt für Screenreader & SEO */}
        <h1 className="sr-only">
          BibleBot.Life · Dein Bibel-Begleiter
        </h1>
        {/* Sanctuary-Hero: Lea & Jonas, Fragen, Eingabefeld – mehr nicht */}
        <ChatHero />

      {/* Täglicher Impuls – das tägliche Ritual */}
      <Suspense fallback={<div className="h-20" />}>
        <DailyImpulse />
      </Suspense>

      {/* Vertrauen – ruhig, drei kurze Signale */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {([
              { icon: Shield, key: "qa" },
              { icon: EyeOff, key: "noAds" },
              { icon: Heart, key: "noExpertise" },
            ] as const).map((item) => (
              <div key={item.key} className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card/60 border border-border">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{t(`trust.${item.key}.title`)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(`trust.${item.key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entdecken – alle Nebenwege als ruhige Kacheln */}
      <DiscoverGrid />

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              <HelpCircle className="h-4 w-4" />
              {t("faq.badge")}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">{t("faq.title")}</h2>
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
                      <Check className="h-4 w-4 text-telegram shrink-0 mt-0.5" />
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
          </Accordion>
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
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <AppLogo className="h-10 w-10" invertTheme />
            <span className="text-2xl font-bold">BibleBot<span className="text-muted">.Life</span></span>
          </div>
          <p className="mb-4 text-center text-background/70">{t("footer.tagline")}</p>
          <p className="text-background/80 text-xs mb-6 max-w-2xl mx-auto text-center">{t("footer.disclaimer")}</p>

          <div className="border-t border-background/20 pt-6 mt-6">
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-background/80 mb-8">
              <div>
                <p className="font-semibold text-background/70 mb-2">{t("footer.impressum")}</p>
                <p>Verein Tech4Good</p>
                <p>Industriestrasse 19</p>
                <p>5200 Brugg, Schweiz</p>
                <p className="mt-1">kontakt@biblebot.life</p>
                <p><a href="https://www.tech-4-good.ch" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">www.tech-4-good.ch</a></p>
              </div>
              <div>
                <p className="font-semibold text-background/70 mb-2">{t("footer.notes")}</p>
                <p>{t("footer.private")}</p>
                <p>{t("footer.noChat")}</p>
                <p>{t("footer.noTax")}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-background/80 mb-4">
              <Link to="/impressum" className="hover:text-background/80 underline underline-offset-2">{t("footer.impressum")}</Link>
              <Link to="/datenschutz" className="hover:text-background/80 underline underline-offset-2">{t("footer.datenschutz")}</Link>
              <Link to="/for-churches" className="hover:text-background/80 underline underline-offset-2">{t("footer.forChurches")}</Link>
              <Link to="/fuer-seelsorger" className="hover:text-background/80 underline underline-offset-2">{t("footer.forCelebrants")}</Link>
              <Link to="/churches" className="hover:text-background/80 underline underline-offset-2">{t("church.directoryBadge")}</Link>
              <Link to="/spenden" className="hover:text-background/80 underline underline-offset-2">{t("nav.donate", "Spenden")}</Link>
              <Link to="/kontakt" className="hover:text-background/80 underline underline-offset-2">{t("nav.contact", "Kontakt")}</Link>
              <Link to="/ueber-uns" className="hover:text-background/80 underline underline-offset-2">{t("nav.about", "Über uns")}</Link>
            </div>

            <p className="text-background/70 text-xs text-center mb-1">© 2026 BibleBot.Life</p>
            <p className="text-background/80 text-sm text-center">{t("footer.love")}</p>
          </div>
        </div>
      </footer>
    </div>
    </LifeWheelProvider>
  );
};

export default Index;

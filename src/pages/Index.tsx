import { lazy, Suspense } from "react";
import { MessageCircle, BookOpen, Calendar, Heart, Users, Star, Shield, GraduationCap, Church, Quote, CheckCircle2, Brain, X as XIcon, Check, HelpCircle, HandHeart, Copy, Compass, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy-load the heavy chat component – loads only when page is ready
const BibelBotChat = lazy(() => import("@/components/BibelBotChat").then(m => ({ default: m.BibelBotChat })));
import { DailyImpulse } from "@/components/DailyImpulse";
import { DailySubscribe } from "@/components/DailySubscribe";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

const BIBLE_EDITIONS = [
  { name: "Zürcher Bibel", year: "2007", tradition: "Reformiert" },
  { name: "Lutherbibel", year: "2017", tradition: "Evangelisch" },
  { name: "Einheitsübersetzung", year: "2016", tradition: "Katholisch" },
  { name: "Schlachter Bibel", year: "2000", tradition: "Freikirchlich" },
  { name: "Elberfelder Bibel", year: "2006", tradition: "Wortgetreu" },
];

// Testimonials entfernt – werden später mit echten Stimmen ergänzt

const GUIDELINES = [
  {
    icon: Brain,
    title: "PERMA-Modell",
    author: "Martin Seligman",
    desc: "Fördert positive Emotionen, Engagement, Beziehungen, Sinn und Zielerreichung – biblisch verankert.",
  },
  {
    icon: Heart,
    title: "Logotherapie & Sinnfindung",
    author: "Viktor Frankl",
    desc: "Begleitung bei Sinnfragen und in schwierigen Lebensphasen – ehrlich statt toxisch positiv.",
  },
  {
    icon: Star,
    title: "Dankbarkeitsforschung",
    author: "Robert Emmons",
    desc: "Wissenschaftlich fundierte Dankbarkeitspraxis, gestützt durch Psalmen und Loblieder.",
  },
  {
    icon: Users,
    title: "REACH-Vergebungsmodell",
    author: "Everett Worthington",
    desc: "Begleitung bei Vergebungsprozessen – psychologisch fundiert und biblisch untermauert.",
  },
];

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Bibelstellen & Auslegung",
      description: "Frage «Was sagt die Bibel zu...?» und erhalte passende Verse mit Kontext und verständlicher Erklärung."
    },
    {
      icon: Star,
      title: "Lebensplanung & Zielsetzung",
      description: "Entdecke deine Berufung, setze konkrete Ziele und finde heraus, was Gott mit dir vorhaben könnte."
    },
    {
      icon: Heart,
      title: "Zu dir selbst finden",
      description: "Erkenne deine Gaben, Stärken und Sehnsüchte – und was dein Herz wirklich braucht."
    },
    {
      icon: GraduationCap,
      title: "Glaubensweg & Christus finden",
      description: "Ob suchend, zweifelnd oder vertiefend – Dein BibelBot begleitet dich auf deinem persönlichen Weg."
    },
    {
      icon: Calendar,
      title: "Tagesimpulse & Kirchenjahr",
      description: "Starte deinen Tag mit Impulsen und lass dich durch Advent, Fastenzeit und Feiertage begleiten."
    },
    {
      icon: Users,
      title: "Gruppen & Gemeinden",
      description: "Perfekt für Bibelkreise, Gemeinde-Gruppen und gemeinschaftliche Andachten."
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BibelBot</span>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Button asChild className="bg-telegram hover:bg-telegram/90 text-telegram-foreground">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4 mr-2" />
                Jetzt starten
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Daily Impulse Banner */}
      <DailyImpulse />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-6">
            <span className="inline-flex items-center gap-3 text-sm font-semibold text-foreground bg-card/80 backdrop-blur-sm border border-border shadow-md px-5 py-2.5 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
              <span className="flex items-center gap-2">
                <span>Kein Login</span>
                <span className="text-primary/40">·</span>
                <span>Keine Daten</span>
                <span className="text-primary/40">·</span>
                <span>Kein Urteil</span>
              </span>
            </span>
          </div>
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Die Bibel.
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-cta)" }}> Neu gedacht.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Dein BibelBot ist eine KI, die die Bibel kennt – und die richtigen Fragen stellt.
              Kein Mensch, aber ein ehrlicher Begleiter. Für gute Gespräche, tiefe Fragen und echte Impulse.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="bg-telegram hover:bg-telegram/90 text-telegram-foreground px-8 py-4 text-lg">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                <Send className="h-5 w-5 mr-2" />
                Über Telegram starten
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-accent px-8 py-4 text-lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Mehr erfahren
            </Button>
          </div>

          <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border">
            <p className="text-foreground/80 italic text-lg">
              «Kommt her zu mir, alle, die ihr mühselig und beladen seid; ich will euch erquicken.»
            </p>
            <p className="text-muted-foreground mt-2">– Matthäus 11,28</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Wie dein BibelBot dich begleitet
            </h2>
            <p className="text-xl text-muted-foreground">
              Entdecke die vielfältigen Möglichkeiten, wie dein BibelBot dich begleiten kann
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
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
              Methodik
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Nicht einfach ein Chatbot – eine echte Begleitung
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dein BibelBot verbindet biblische Weisheit mit bewährten Coaching-Methoden und Positiver Psychologie.
            </p>
          </div>

          {/* 21-Tage Journey */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-8 mb-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Persönliche Begleitung</h3>
                <p className="text-muted-foreground">
                  Dein BibelBot begleitet dich so lange du willst – im freien Gespräch oder mit einer optionalen 21-Tage-Struktur.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-semibold text-foreground">Woche 1: Ankommen</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vertrauen aufbauen, zuhören, deine Situation verstehen. Wo stehst du? Was beschäftigt dich?
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-semibold text-foreground">Woche 2: Vertiefen</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Muster erkennen, Wünsche klären, biblische Impulse vertiefen. Was willst du wirklich?
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  <span className="font-semibold text-foreground">Woche 3: Handeln</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Konkrete Schritte setzen, Ziele formulieren, Veränderung anstossen. Was ist dein nächster Schritt?
                </p>
              </div>
            </div>
          </div>

          {/* Fragetechniken */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Card className="bg-card/80 border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Offene Fragen statt schnelle Antworten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Dein BibelBot gibt dir keine billigen Ratschläge. Stattdessen stellt er die Fragen, die wirklich zählen:
                </p>
                <div className="space-y-2">
                  {[
                    "«Was steckt eigentlich hinter diesem Wunsch?»",
                    "«Woran würdest du merken, dass sich etwas verändert hat?»",
                    "«Was wäre ein erster kleiner Schritt?»",
                  ].map((q, i) => (
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
                <CardTitle className="text-lg">Ehrlich statt toxisch positiv</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Kein «Wird schon!» und kein Schönreden. Dein BibelBot ist empathisch UND ehrlich:
                </p>
                <div className="space-y-2">
                  {[
                    "Benennt auch unbequeme Bibelstellen",
                    "Fordert zur Selbstreflexion heraus",
                    "Unterscheidet Trost von Verdrängung",
                  ].map((item, i) => (
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
            <h3 className="text-xl font-bold text-foreground mb-6 text-center">Wissenschaftlich fundiert</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Brain, name: "PERMA-Modell", author: "Seligman", desc: "Positive Emotionen, Sinn & Wachstum" },
                { icon: Heart, name: "Logotherapie", author: "Frankl", desc: "Sinnfindung in schwierigen Zeiten" },
                { icon: Star, name: "Dankbarkeit", author: "Emmons", desc: "Forschungsbasierte Dankbarkeitspraxis" },
                { icon: Users, name: "Vergebung", author: "Worthington", desc: "REACH-Modell für Vergebungsprozesse" },
              ].map((method) => (
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

          {/* Personalisation hint */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Du kannst deinem BibelBot einen eigenen Namen geben – damit er wirklich <strong className="text-foreground">dein</strong> Begleiter wird.
            </p>
          </div>
        </div>
      </section>

      {/* Glaube neu entdecken */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Compass className="h-4 w-4" />
              Für Neugierige
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Glaube neu entdecken – ohne Druck
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Immer mehr Menschen stellen sich die grossen Fragen neu. BibelBot.ch ist für alle, die den Glauben (wieder) entdecken wollen – ehrlich, ohne Pathos und ohne Kirchen-Jargon.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                emoji: "🤔",
                title: "Du zweifelst?",
                text: "Gut so. Zweifel sind kein Fehler – sie sind der Anfang von ehrlichem Glauben. Die Bibel ist voller Menschen, die gerungen haben.",
              },
              {
                emoji: "🔍",
                title: "Du suchst?",
                text: "Vielleicht weisst du nicht mal genau, wonach. Das ist völlig okay. Dein BibelBot hilft dir, die richtigen Fragen zu stellen – statt schnelle Antworten zu liefern.",
              },
              {
                emoji: "🌱",
                title: "Du willst vertiefen?",
                text: "Du glaubst bereits, aber willst mehr verstehen? Entdecke die Tiefe der Bibel – historisch, persönlich, überraschend relevant.",
              },
            ].map((item) => (
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
            <p className="text-foreground/80 italic text-lg mb-2">
              «Klopft an, so wird euch aufgetan.»
            </p>
            <p className="text-muted-foreground text-sm mb-6">– Matthäus 7,7</p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              In der Schweiz reden wir nicht gross über Glauben. Das muss auch nicht sein. Aber wer Fragen hat, verdient ehrliche Antworten – ohne Predigt, ohne Mitgliedschaft, ohne Hintergedanken.
            </p>
          </div>
        </div>
      </section>

      {/* Daily Subscribe Widget */}
      <section className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-lg">
          <DailySubscribe />
        </div>
      </section>


      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              <HelpCircle className="h-4 w-4" />
              Häufige Fragen
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Was du über deinen BibelBot wissen solltest
            </h2>
            <p className="text-lg text-muted-foreground">
              Transparenz ist uns wichtig – besonders gegenüber Theologinnen, Seelsorgern und kritischen Köpfen.
            </p>
          </div>

          <Accordion type="multiple" className="space-y-3">
            <AccordionItem value="unterschied" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Was unterscheidet dein BibelBot von ChatGPT & Co.?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-3">Generische KI-Chatbots:</p>
                    <div className="space-y-2">
                      {[
                        "Oberflächliche Bibelzitate ohne Kontext",
                        "Keine seelsorgerischen Guardrails",
                        "Vermeidet unbequeme Texte",
                        "Keine Krisenintervention",
                        "Mischt Bibel mit Esoterik",
                        "Keine Rückfragen – nur Bestätigung",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <XIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-3">BibelBot.ch:</p>
                    <div className="space-y-2">
                      {[
                        "5 anerkannte Übersetzungen – auch unbequeme Stellen",
                        "Guardrails UND herausfordernde Begleitung",
                        "Rückfragen zur Selbstreflexion",
                        "Krisenverweise (Tel. 143 / 147)",
                        "Ausschliesslich christliche Theologie",
                        "Fördert kritisches Denken als Glaubensreife",
                      ].map((item, i) => (
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
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Welche Bibelübersetzungen sind hinterlegt?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">Dein BibelBot arbeitet ökumenisch mit den massgeblichen deutschsprachigen Bibelausgaben:</p>
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
                <p className="mt-4 text-sm">Alle Bibelstellen werden mit Quellenangabe und historischem Kontext ausgegeben.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="psychologie" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Welche wissenschaftlichen Grundlagen stecken dahinter?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <p className="mb-4">Die Begleitung basiert auf peer-reviewed Forschung der Positiven Psychologie:</p>
                <div className="space-y-3">
                  {GUIDELINES.map((g) => (
                    <div key={g.title} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <g.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{g.title} <span className="text-muted-foreground font-normal">({g.author})</span></p>
                        <p className="text-sm">{g.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="guardrails" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Wie stellt dein BibelBot seelsorgerische Sicherheit sicher?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                <div className="space-y-3">
                  {[
                    "Bei Suizidgedanken oder Krisen → sofortige Weiterleitung an Dargebotene Hand (143) und Pro Juventute (147)",
                    "Keine psychologischen oder medizinischen Diagnosen",
                    "Respekt ohne Beliebigkeit – klare biblische Positionen werden eingenommen",
                    "Empathie UND Ehrlichkeit – auch Unbequemes wird angesprochen",
                    "Rückfragen zur Selbstreflexion statt billiger Bestätigung",
                    "Keine toxische Positivität – echte, ehrliche Begleitung",
                    "Benennt Spannungen und schwierige Texte offen",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-telegram shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="oekumenisch" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ist dein BibelBot konfessionell gebunden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. Dein BibelBot ist ökumenisch ausgerichtet und respektiert reformierte, katholische, freikirchliche und weitere christliche Traditionen gleichermassen. Bei konfessionell unterschiedlichen Auslegungen werden verschiedene Perspektiven transparent dargestellt – ohne eine Tradition zu bevorzugen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="grenzen" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ersetzt dein BibelBot die Seelsorge oder Therapie?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. Dein BibelBot ist ein KI-gestütztes Hilfsmittel für die persönliche Bibellektüre und Reflexion. Er ersetzt keine professionelle Seelsorge, theologische Beratung oder psychologische Therapie. Bei ernsthaften Krisen verweist dein BibelBot immer an qualifizierte Anlaufstellen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="herausfordernd" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ist dein BibelBot nicht einfach ein «Wohlfühl-Bot»?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. Dein BibelBot tröstet, wo Trost nötig ist – aber er fordert auch heraus. Geistliches Wachstum braucht Reibung. Dein BibelBot stellt unbequeme Rückfragen, benennt schwierige Bibeltexte (Hiob, Klagepsalmen, prophetische Kritik) und scheut sich nicht vor Themen wie Gerechtigkeit, Umkehr und Verantwortung. Die prophetische Tradition war nie bequem – und dein BibelBot auch nicht.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="spenden" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Wer steht hinter deinem BibelBot und wie wird es finanziert?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                BibelBot.ch ist ein privates, nicht-kommerzielles Projekt. Es wird ehrenamtlich betrieben und finanziert sich ausschliesslich durch freiwillige Spenden. Es gibt keine Werbung, keine Datenverkäufe und keine kostenpflichtigen Features. Alle Spenden fliessen direkt in die Deckung der laufenden Kosten (KI-Infrastruktur, Hosting, Entwicklung). Da BibelBot als privates Projekt läuft, sind Spenden nicht steuerabzugsfähig.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="datenschutz" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Wie geht dein BibelBot mit meinen Daten um?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Dein BibelBot speichert keine persönlichen Daten und keine Chatverläufe. Jedes Gespräch ist anonym. Es gibt kein Login, kein Tracking und keine Weitergabe von Daten an Dritte. Die Nutzung ist vollständig anonym.
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
              Unterstütze deinen BibelBot
            </span>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Hilf mit, dass dein BibelBot kostenlos bleibt
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Dein BibelBot ist ein Herzensprojekt – ohne Werbung, ohne Abo, ohne versteckte Kosten. 
            Damit das so bleibt, bin ich auf freiwillige Spenden angewiesen. 
            Jeder Beitrag hilft, die laufenden Kosten für KI und Betrieb zu decken.
          </p>
          
          <Card className="bg-card/80 backdrop-blur-sm border-border max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Spende per Banküberweisung</CardTitle>
              <CardDescription>Jeder Betrag zählt – herzlichen Dank! 🙏</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Empfänger</p>
                    <p className="font-medium text-foreground text-sm">Reto Wettstein</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-mono font-medium text-foreground text-sm">CH14 0900 0000 3042 9878 8</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("CH1409000000304298788");
                      // Optional: toast notification
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="IBAN kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium text-foreground text-sm">PostFinance</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-accent/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Verwendungszweck</p>
                    <p className="font-medium text-foreground text-sm">Spende BibelBot</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mt-6">
            BibelBot.ch wird als privates Projekt betrieben. Spenden sind daher nicht steuerabzugsfähig.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundImage: "var(--gradient-cta)" }}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Du musst das nicht alleine durchstehen
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Schreib deinem BibelBot einfach, was dich beschäftigt. Kein Login, keine Kosten, kein Urteil – 
            nur ehrliche Begleitung und die Weisheit der Bibel.
          </p>
          <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 px-8 py-4 text-lg font-semibold">
            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
              <Send className="h-5 w-5 mr-2" />
              Jetzt Gespräch starten
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BibelBot.ch</span>
          </div>
          <p className="text-background/70 mb-4 text-center">
            Dein persönlicher Begleiter für ein Leben mit der Bibel
          </p>
          <p className="text-background/50 text-xs mb-6 max-w-2xl mx-auto text-center">
            BibelBot.ch ist ein KI-gestütztes Hilfsmittel und ersetzt keine professionelle Seelsorge, 
            theologische Beratung oder psychologische Therapie. Bei akuten Krisen wende dich bitte an 
            die Dargebotene Hand (Tel. 143) oder Pro Juventute (Tel. 147).
          </p>
          
          <div className="border-t border-background/20 pt-6 mt-6">
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-background/50 mb-6">
              <div>
                <p className="font-semibold text-background/70 mb-2">Impressum</p>
                <p>Reto Wettstein</p>
                <p>Rebmoosweg 63</p>
                <p>5200 Brugg, Schweiz</p>
                <p className="mt-1">kontakt@bibelbot.ch</p>
              </div>
              <div>
                <p className="font-semibold text-background/70 mb-2">Hinweise</p>
                <p>Privates, nicht-kommerzielles Projekt</p>
                <p>Keine Speicherung von Chatdaten</p>
                <p>Spenden sind nicht steuerabzugsfähig</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-background/50 text-sm">
              <span>© 2026 BibelBot.ch</span>
              <span>·</span>
              <Link to="/impressum" className="hover:text-background/80 underline underline-offset-2">Impressum</Link>
              <span>·</span>
              <Link to="/datenschutz" className="hover:text-background/80 underline underline-offset-2">Datenschutz</Link>
            </div>
            <p className="text-background/50 text-sm text-center mt-2">
              Mit ❤️ für alle, die sich fragen, was Christus denkt.
            </p>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        <BibelBotChat />
      </Suspense>
    </div>
  );
};

export default Index;

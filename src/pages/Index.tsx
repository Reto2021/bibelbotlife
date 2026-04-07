import { MessageCircle, BookOpen, Calendar, Heart, Users, Star, Shield, GraduationCap, Church, Quote, CheckCircle2, Brain, X as XIcon, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BibelBotChat } from "@/components/BibelBotChat";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const WHATSAPP_LINK = "https://wa.me/41XXXXXXXXXX?text=Hallo%20BibelBot!";

const BIBLE_EDITIONS = [
  { name: "Zürcher Bibel", year: "2007", tradition: "Reformiert" },
  { name: "Lutherbibel", year: "2017", tradition: "Evangelisch" },
  { name: "Einheitsübersetzung", year: "2016", tradition: "Katholisch" },
  { name: "Schlachter Bibel", year: "2000", tradition: "Freikirchlich" },
  { name: "Elberfelder Bibel", year: "2006", tradition: "Wortgetreu" },
];

const TESTIMONIALS = [
  {
    text: "BibelBot hat mir geholfen, in einer schwierigen Phase die richtigen Worte zu finden. Die Antworten sind durchdacht und respektvoll.",
    author: "M. Keller",
    role: "Gemeindeleiterin, ref. Kirche Zürich",
  },
  {
    text: "Endlich ein digitales Angebot, das theologisch fundiert ist und trotzdem verständlich bleibt. Ideal für unseren Bibelkreis.",
    author: "P. Brunner",
    role: "Pfarrer, kath. Pfarrei Luzern",
  },
  {
    text: "Die Verbindung von biblischer Weisheit und positiver Psychologie überzeugt. Seelsorgerisch verantwortungsvoll umgesetzt.",
    author: "Dr. S. Meier",
    role: "Theologin & Psychologin, Universität Bern",
  },
];

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
      title: "Tagesimpulse & Gebete",
      description: "Starte oder beende deinen Tag mit inspirierenden Bibelversen und passenden Gebeten."
    },
    {
      icon: Calendar,
      title: "Kirchenjahr-Begleitung",
      description: "Lass dich durch Advent, Fastenzeit und kirchliche Feiertage führen mit passenden Impulsen."
    },
    {
      icon: Heart,
      title: "Persönliche Begleitung",
      description: "Ob Konfirmation, Trauer oder Sinnsuche – der BibelBot begleitet dich in allen Lebensphasen."
    },
    {
      icon: Users,
      title: "Gruppen & Gemeinden",
      description: "Perfekt für Bibelkreise, Gemeinde-Gruppen und gemeinschaftliche Andachten."
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Einfach und vertraut – direkt über WhatsApp, wo du bereits mit Familie und Freunden chattest."
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BibelBot.ch</span>
          </div>
          <Button asChild className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Jetzt starten
            </a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              <Heart className="h-4 w-4" />
              Ein sicherer Ort für deine Fragen
            </span>
          </div>
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Jemand, der
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-cta)" }}> wirklich zuhört</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Egal ob Zweifel, Hoffnung oder eine schwierige Phase – BibelBot ist da. 
              Ohne Bewertung, ohne Login. Einfach ein Gespräch, das dir guttut.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground px-8 py-4 text-lg">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                Über WhatsApp starten
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-accent px-8 py-4 text-lg">
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
      <section className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Wie BibelBot.ch dich begleitet
            </h2>
            <p className="text-xl text-muted-foreground">
              Entdecke die vielfältigen Möglichkeiten, wie der BibelBot dein spirituelles Leben bereichern kann
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

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              <HelpCircle className="h-4 w-4" />
              Häufige Fragen
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Was du über BibelBot wissen solltest
            </h2>
            <p className="text-lg text-muted-foreground">
              Transparenz ist uns wichtig – besonders gegenüber Theologinnen, Seelsorgern und kritischen Köpfen.
            </p>
          </div>

          <Accordion type="multiple" className="space-y-3">
            <AccordionItem value="unterschied" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Was unterscheidet BibelBot von ChatGPT & Co.?
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
                          <Check className="h-4 w-4 text-whatsapp shrink-0 mt-0.5" />
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
                <p className="mb-4">BibelBot arbeitet ökumenisch mit den massgeblichen deutschsprachigen Bibelausgaben:</p>
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
                Wie stellt BibelBot seelsorgerische Sicherheit sicher?
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
                      <CheckCircle2 className="h-4 w-4 text-whatsapp shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="oekumenisch" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ist BibelBot konfessionell gebunden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. BibelBot ist ökumenisch ausgerichtet und respektiert reformierte, katholische, freikirchliche und weitere christliche Traditionen gleichermassen. Bei konfessionell unterschiedlichen Auslegungen werden verschiedene Perspektiven transparent dargestellt – ohne eine Tradition zu bevorzugen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="grenzen" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ersetzt BibelBot die Seelsorge oder Therapie?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. BibelBot ist ein KI-gestütztes Hilfsmittel für die persönliche Bibellektüre und Reflexion. Er ersetzt keine professionelle Seelsorge, theologische Beratung oder psychologische Therapie. Bei ernsthaften Krisen verweist BibelBot immer an qualifizierte Anlaufstellen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="herausfordernd" className="bg-card/80 border border-border rounded-xl px-6 data-[state=open]:shadow-md">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Ist BibelBot nicht einfach ein «Wohlfühl-Bot»?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Nein. BibelBot tröstet, wo Trost nötig ist – aber er fordert auch heraus. Geistliches Wachstum braucht Reibung. BibelBot stellt unbequeme Rückfragen, benennt schwierige Bibeltexte (Hiob, Klagepsalmen, prophetische Kritik) und scheut sich nicht vor Themen wie Gerechtigkeit, Umkehr und Verantwortung. Die prophetische Tradition war nie bequem – und BibelBot auch nicht.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              <Quote className="h-4 w-4" />
              Stimmen
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Vertrauen aus verschiedenen Traditionen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.author} className="bg-card/80 border-border">
                <CardContent className="pt-6">
                  <Quote className="h-6 w-6 text-primary/30 mb-3" />
                  <p className="text-foreground/80 text-sm leading-relaxed italic mb-4">
                    «{t.text}»
                  </p>
                  <Separator className="mb-3" />
                  <p className="font-semibold text-sm text-card-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundImage: "var(--gradient-cta)" }}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Du musst das nicht alleine durchstehen
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Schreib einfach, was dich beschäftigt. Kein Login, keine Kosten, kein Urteil – 
            nur ein offenes Ohr und die Weisheit der Bibel.
          </p>
          <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 px-8 py-4 text-lg font-semibold">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5 mr-2" />
              Jetzt Gespräch starten
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BibelBot.ch</span>
          </div>
          <p className="text-background/70 mb-4">
            Dein digitaler Begleiter für ein Leben mit der Bibel
          </p>
          <p className="text-background/50 text-xs mb-6 max-w-2xl mx-auto">
            BibelBot.ch ist ein KI-gestütztes Hilfsmittel und ersetzt keine professionelle Seelsorge, 
            theologische Beratung oder psychologische Therapie. Bei akuten Krisen wende dich bitte an 
            die Dargebotene Hand (Tel. 143) oder Pro Juventute (Tel. 147).
          </p>
          <div className="border-t border-background/20 pt-6">
            <p className="text-background/50 text-sm">
              © 2026 BibelBot.ch – Mit ❤️ für alle, die sich fragen, was Christus denkt.
            </p>
          </div>
        </div>
      </footer>

      <BibelBotChat />
    </div>
  );
};

export default Index;

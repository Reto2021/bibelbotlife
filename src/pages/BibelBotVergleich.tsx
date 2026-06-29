import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Shield, BookOpen, Heart, Globe2, Lock, Sparkles } from "lucide-react";

const COMPETITORS = [
  {
    name: "BibleBot.Life",
    tagline: "Deutscher Bibel-Bot mit Coaching & 5 Übersetzungen",
    highlight: true,
    pros: [
      "5 deutsche Übersetzungen (Zürcher, Luther, Einheits­übersetzung, Schlachter, Elberfelder, BasisBibel)",
      "QA-Agent prüft jede zitierte Bibelstelle (keine Halluzinationen)",
      "Coaching-Methodik: PERMA, Logotherapie, Dankbarkeit, Vergebung",
      "Krisensignal-Erkennung mit Verweis auf 143 / 147",
      "Anonym, kein Login, Verlauf bleibt lokal auf dem Gerät",
      "Schweizerdeutsch als Spracheingabe, 36 Sprachen für Antworten",
      "Tägliche Impulse per Push, SMS oder Telegram",
    ],
    cons: [],
  },
  {
    name: "biblebot.xyz",
    tagline: "Discord-Bot, primär englisch",
    highlight: false,
    pros: ["Sehr verbreitet auf Discord", "Schnelle Vers-Lookups per Slash-Command"],
    cons: [
      "Primär englisch, deutsche Übersetzungen begrenzt",
      "Keine Coaching- oder Reflexionsfragen",
      "Keine Krisensignal-Erkennung",
      "Nutzung an Discord-Konto gebunden",
    ],
  },
  {
    name: "biblebots.de",
    tagline: "Bibel-Suchmaschine",
    highlight: false,
    pros: ["Schnelle Vers-Suche", "Übersichtliche deutsche Oberfläche"],
    cons: [
      "Reine Suche, kein dialogischer Chat",
      "Keine Coaching-Begleitung",
      "Keine täglichen Impulse oder Gebet-Funktion",
    ],
  },
  {
    name: "bibel.chat",
    tagline: "Chat mit der Bibel (deutsch)",
    highlight: false,
    pros: ["Deutscher Chat", "Einfache Bedienung"],
    cons: [
      "Eine Übersetzung",
      "Keine geprüften Quellen (Halluzinationsrisiko bei Stellenangaben)",
      "Keine Krisenintervention",
      "Keine tägliche Impuls-Funktion",
    ],
  },
];

const FAQ = [
  {
    q: "Was ist ein Bibel-Bot?",
    a: "Ein Bibel-Bot ist ein digitaler Begleiter, der Fragen rund um die Bibel beantwortet, Verse zitiert und – im Fall von BibleBot.Life – seelsorgliche Coaching-Fragen stellt. Anders als eine reine Suchmaschine führt ein Bibel-Bot ein Gespräch mit dir.",
  },
  {
    q: "Welcher Bibel-Bot ist auf Deutsch am besten?",
    a: "Für deutschsprachige Nutzer:innen empfehlen wir BibleBot.Life: 5 deutsche Bibelübersetzungen, Quellenprüfung jeder Vers-Angabe, Coaching-Methodik und Krisenintervention. Kein Login, anonym, kostenlos.",
  },
  {
    q: "Ist BibleBot.Life kostenlos?",
    a: "Ja. Der Bibel-Chat, die Bibelsuche, tägliche Impulse, Gebetswand und alle Begleit-Tools sind kostenlos. Spenden und Kirchen-Partnerschaften finanzieren den Betrieb.",
  },
  {
    q: "Muss ich mich anmelden, um den Bibel-Bot zu nutzen?",
    a: "Nein. Der Chat funktioniert komplett anonym im Browser. Dein Verlauf bleibt lokal auf deinem Gerät und wird nicht auf einem Server gespeichert.",
  },
  {
    q: "Welche Bibelübersetzungen nutzt BibleBot.Life?",
    a: "Zürcher Bibel, Lutherbibel, Einheitsübersetzung, Schlachter 2000, Elberfelder Bibel und BasisBibel – standardmässig wird die BasisBibel verwendet, du kannst die Übersetzung jederzeit wechseln.",
  },
];

export default function BibelBotVergleich() {
  const url = "https://biblebot.life/bibel-bot-vergleich";
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bibel-Bot Vergleich 2026: Welcher ist der beste auf Deutsch?"
        description="Vergleich der wichtigsten Bibel-Bots: BibleBot.Life vs. biblebot.xyz, biblebots.de, bibel.chat. Übersetzungen, Quellenprüfung, Coaching, Privatsphäre."
        path="/bibel-bot-vergleich"
      />
      <Helmet>
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content="Bibel-Bot Vergleich 2026 – BibleBot.Life vs. Alternativen" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <SiteHeader />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="h-4 w-4" /> Vergleich 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Bibel-Bot Vergleich: Welcher ist auf Deutsch am besten?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Wir haben die bekanntesten Bibel-Bots verglichen – nach Übersetzungen, Quellenprüfung,
            seelsorglicher Tiefe und Datenschutz. Hier die ehrliche Übersicht.
          </p>
        </header>

        <section aria-label="Bibel-Bot Vergleichstabelle" className="grid md:grid-cols-2 gap-6 mb-16">
          {COMPETITORS.map((c) => (
            <Card key={c.name} className={c.highlight ? "border-primary border-2 shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{c.name}</span>
                  {c.highlight && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      Empfehlung
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{c.tagline}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.pros.map((p) => (
                  <div key={p} className="flex gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
                {c.cons.map((p) => (
                  <div key={p} className="flex gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Worauf kommt es bei einem Bibel-Bot wirklich an?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Geprüfte Bibelstellen",
                desc: "Viele KI-basierte Bots erfinden Vers-Angaben. BibleBot.Life prüft Buch, Kapitel und Vers durch einen separaten QA-Agent vor jeder Antwort.",
              },
              {
                icon: Heart,
                title: "Seelsorgliche Begleitung",
                desc: "Ein guter Bibel-Bot zitiert nicht nur Verse, sondern stellt Coaching-Fragen, die zur eigenen Reflexion einladen.",
              },
              {
                icon: Shield,
                title: "Krisenintervention",
                desc: "Erkennt der Bot Suizid- oder Krisensignale und verweist auf Telefonseelsorge? Bei BibleBot.Life ja – automatisch.",
              },
              {
                icon: Lock,
                title: "Datenschutz",
                desc: "Kein Login, keine Cloud-Speicherung deiner Gespräche, kein Tracking. Dein Glaubensweg gehört dir.",
              },
              {
                icon: Globe2,
                title: "Sprachen & Dialekte",
                desc: "BibleBot.Life versteht 36 Sprachen und Schweizerdeutsch als Spracheingabe.",
              },
              {
                icon: Sparkles,
                title: "Tägliche Impulse",
                desc: "Ein Bibel-Bot wird zur Gewohnheit, wenn er dich täglich mit einem Vers oder einer Frage erreicht – per Push, SMS oder Telegram.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Häufige Fragen zum Bibel-Bot
          </h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <Card key={f.q}>
                <CardHeader>
                  <CardTitle className="text-lg">{f.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Probiere den Bibel-Bot jetzt aus
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Kein Login, kein Tracking, kostenlos. Stelle deine erste Frage an die Bibel.
          </p>
          <Button asChild size="lg">
            <Link to="/">
              Zum Bibel-Chat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}

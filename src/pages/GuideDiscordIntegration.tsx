import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  MessageCircle,
  Shield,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Hash,
  BookOpen,
  Heart,
  Link2,
} from "lucide-react";
import { motion } from "framer-motion";

const COMPARISON = [
  {
    aspect: "Bibelübersetzungen",
    discordBots: "Meist nur 1–2 englische Übersetzungen (KJV, NIV).",
    biblebot: "5 deutsche Übersetzungen (Zürcher, Luther, Einheits­übersetzung, Schlachter, Elberfelder) plus 30+ weitere Sprachen.",
  },
  {
    aspect: "Quellenprüfung",
    discordBots: "Slash-Befehle wie /verse zeigen Verse, aber generative Antworten halluzinieren oft Stellen.",
    biblebot: "QA-Agent prüft Buch, Kapitel und Vers vor jeder Antwort. Keine erfundenen Stellen.",
  },
  {
    aspect: "Seelsorgliche Tiefe",
    discordBots: "Reine Vers-Lookups oder generische Antworten ohne Methodik.",
    biblebot: "Coaching-Methodik: PERMA, Logotherapie, Dankbarkeits- und Vergebungs­forschung.",
  },
  {
    aspect: "Krisenintervention",
    discordBots: "Keine Krisensignal-Erkennung.",
    biblebot: "Erkennt Krisensignale automatisch und verweist auf Telefonseelsorge (143 / 147).",
  },
  {
    aspect: "Privatsphäre",
    discordBots: "Nachrichten werden auf Discord-Servern und Bot-Backends gespeichert.",
    biblebot: "Kein Login. Chatverlauf bleibt lokal auf deinem Gerät (max. 50 Nachrichten).",
  },
  {
    aspect: "Mehrsprachigkeit im Gespräch",
    discordBots: "Meist englisch-zentriert.",
    biblebot: "36 Sprachen, inklusive Schweizerdeutsch als Spracheingabe.",
  },
];

const STEPS = [
  {
    icon: Hash,
    title: "Erstelle einen #bibel-Kanal",
    desc: "Lege auf deinem Discord-Server einen Kanal an, der explizit für Bibelfragen, Tagesimpulse und gemeinsame Reflexion gedacht ist.",
  },
  {
    icon: Link2,
    title: "Teile den BibleBot-Link",
    desc: "Pinne https://biblebot.life als Channel-Topic oder Pinned Message. Mitglieder öffnen den Link und chatten anonym im Browser — kein Bot-Install, keine OAuth-Permission.",
  },
  {
    icon: MessageCircle,
    title: "Teilt Antworten zurück in Discord",
    desc: "Jede BibleBot-Antwort lässt sich kopieren oder als Vers-Karte teilen. So entsteht ein gemeinsamer Gesprächsfaden im Channel — ohne dass private Anliegen für alle sichtbar werden.",
  },
  {
    icon: Sparkles,
    title: "Nutze tägliche Impulse",
    desc: "Abonniere den täglichen Bibelvers per Push, Telegram oder E-Mail und poste ihn morgens im Server. Die Diskussion über den Tagesvers passiert direkt in Discord.",
  },
];

const FAQ = [
  {
    q: "Gibt es einen offiziellen BibleBot.Life Discord-Bot?",
    a: "Aktuell nein. BibleBot.Life ist eine Web-App und PWA. Wir verzichten bewusst auf einen Discord-Bot, weil Discord Nachrichten serverseitig speichert und wir Privatsphäre als Kernwert sehen. Stattdessen empfehlen wir die Companion-Variante: Link im Channel teilen, anonym im Browser chatten, Antworten zurück in den Server bringen.",
  },
  {
    q: "Wie unterscheidet sich BibleBot.Life von Discord-Bots wie biblebot.xyz?",
    a: "Klassische Discord-Bibel-Bots sind Lookup-Tools — sie zeigen Verse, wenn du /verse johannes 3:16 tippst. BibleBot.Life ist ein seelsorglicher Begleiter mit geprüfter Bibelkenntnis in 5 deutschen Übersetzungen, Coaching-Methodik und Krisensignal-Erkennung. Es geht weniger um schnelles Nachschlagen, mehr um echtes Gespräch.",
  },
  {
    q: "Kann ich BibleBot.Life für meine Kirchengemeinde auf Discord einsetzen?",
    a: "Ja. Viele Jugendgruppen und Hauskreise nutzen Discord als Treffpunkt. Mit einer Church Partnership erhältst du eine gebrandete Variante (eigener Bot-Name, Logo, Farben) und einen direkten Link wie biblebot.life/?church=deine-gemeinde, den du im Server pinnst.",
  },
  {
    q: "Funktionieren Sprachnachrichten auch im Discord-Kontext?",
    a: "Ja. BibleBot.Life unterstützt Spracheingabe (inklusive Schweizerdeutsch) und Sprachausgabe über ElevenLabs. Mitglieder, die lieber sprechen statt tippen, öffnen den Link und führen ein Audio-Gespräch — ideal für Pendler oder Sehbeeinträchtigte.",
  },
  {
    q: "Was kostet die Discord-Integration?",
    a: "Nichts. BibleBot.Life ist für Einzelpersonen kostenfrei. Für Gemeinden gibt es optionale Partnership-Pakete (ab CHF 0/Jahr) mit Branding, Kontaktformular und Eintrag im Kirchenverzeichnis.",
  },
];

export default function GuideDiscordIntegration() {
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
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <SEOHead
        title="Bible Bot für Discord: BibleBot.Life als Companion einsetzen"
        description="Wie du BibleBot.Life auf deinem Discord-Server nutzt: geprüfte Bibelverse, seelsorgliche Coaching-Methodik und Krisenintervention statt reinem /verse-Lookup."
        path="/guide/discord-integration"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <SiteHeader />

      <main>
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <MessageCircle className="h-4 w-4" />
              Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Bible Bot für Discord: BibleBot.Life als Companion einsetzen
            </h1>
            <p className="text-lg text-muted-foreground">
              Du suchst einen Bibel-Bot für deinen Discord-Server, der mehr kann als nur Verse nachschlagen?
              BibleBot.Life ist eine seelsorgliche Web-Begleitung mit geprüfter Bibelkenntnis,
              Coaching-Methodik und Krisensignal-Erkennung — datensparsam und ohne Bot-Install.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button asChild size="lg">
                <Link to="/">Jetzt ausprobieren <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/for-churches">Für Gemeinden</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-card/40">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">
              In 4 Schritten auf deinem Server
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-card/80 border-border h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <s.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{s.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">{s.desc}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              BibleBot.Life vs. klassische Discord-Bibel-Bots
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Bots wie biblebot.xyz sind Lookup-Tools. BibleBot.Life ist ein Gesprächspartner.
            </p>
            <div className="space-y-3">
              {COMPARISON.map((c) => (
                <Card key={c.aspect} className="bg-card/80 border-border">
                  <CardContent className="pt-6 grid md:grid-cols-3 gap-4">
                    <div className="font-semibold text-foreground">{c.aspect}</div>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span>{c.discordBots}</span>
                    </div>
                    <div className="flex gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{c.biblebot}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-card/40">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">
              Warum kein klassischer Discord-Bot?
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="bg-card/80 border-border">
                <CardHeader>
                  <Shield className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">Privatsphäre zuerst</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Discord protokolliert alle Bot-Interaktionen serverseitig. Über die Web-App
                  bleibt das Gespräch zwischen dir und BibleBot.Life — anonym, lokal gespeichert.
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardHeader>
                  <BookOpen className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">Geprüfte Verse</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ein QA-Agent verifiziert jede zitierte Stelle. Keine erfundenen Verse, keine
                  vertauschten Kapitel — wichtig für Gespräche, die Menschen wirklich tragen sollen.
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardHeader>
                  <Heart className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">Krisensignale</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Wenn jemand Suizidgedanken oder akute Not äussert, verweist BibleBot.Life
                  sofort an Telefonseelsorge (143 / 147) — etwas, das generische Bibel-Bots nicht leisten.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Häufige Fragen</h2>
            <div className="space-y-4">
              {FAQ.map((f) => (
                <Card key={f.q} className="bg-card/80 border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">{f.q}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">{f.a}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-card/40">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Probier es jetzt auf deinem Server aus
            </h2>
            <p className="text-muted-foreground mb-8">
              Kopiere den Link, pinne ihn in deinem #bibel-Kanal und lade deine Community ein zu einem
              Gespräch, das tiefer geht als ein Vers-Lookup.
            </p>
            <Button asChild size="lg">
              <Link to="/">BibleBot.Life öffnen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

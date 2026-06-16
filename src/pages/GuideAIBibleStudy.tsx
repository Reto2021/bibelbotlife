import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Brain, BookOpen, CheckCircle2, XCircle, Shield, Sparkles, MessageCircle, Search, Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const COMPARISON = [
  {
    aspect: "Bibelkenntnis",
    generic: "Keine. Antworten basieren auf Trainingsdaten mit Fehlern.",
    biblebot: "5 deutsche Übersetzungen + 30+ weitere Sprachen. Jede Stelle wird verifiziert.",
  },
  {
    aspect: "Quellenprüfung",
    generic: "Halluzinationen möglich. Bibelstellen sind oft erfunden oder falsch zugeordnet.",
    biblebot: "QA-Agent prüft Buch, Kapitel, Vers und Übersetzung vor der Antwort.",
  },
  {
    aspect: "Methodik",
    generic: "Generische Gesprächsführung ohne strukturierten Ansatz.",
    biblebot: "PERMA-Modell, Logotherapie, Dankbarkeitsforschung, Vergebungsforschung.",
  },
  {
    aspect: "Seelsorgliche Tiefe",
    generic: "Oberflächliche Trostworte, keine Krisenerkennung.",
    biblebot: "Pastorale Coaching-Fragen, Krisensignal-Erkennung, Verweis auf Telefonseelsorge.",
  },
  {
    aspect: "Anonymität",
    generic: "Daten werden auf Servern gespeichert.",
    biblebot: "Kein Login nötig. Chatverlauf nur lokal auf deinem Gerät (max. 50 Nachrichten).",
  },
];

const STEPS = [
  {
    icon: MessageCircle,
    title: "Stelle eine Frage",
    desc: "«Was sagt die Bibel zu Angst?» oder «Hilf mir, meinen Glauben zu vertiefen.» — es gibt keine falsche Frage.",
  },
  {
    icon: Search,
    title: "Erhalte geprüfte Stellen",
    desc: "BibleBot sucht in 5 deutschen Übersetzungen und liefert dir passende Verse mit Kontext und Quellenangabe.",
  },
  {
    icon: Brain,
    title: "Reflektiere mit Coaching",
    desc: "Statt schneller Antworten stellt BibleBot die Fragen, die wirklich zählen — basierend auf wissenschaftlich fundierten Methoden.",
  },
  {
    icon: Heart,
    title: "Wachse im Glauben",
    desc: "Ob tägliche Impulse, Gebet oder tiefgehende Gespräche — begleitet werde auf deinem Weg, 24/7.",
  },
];

const FAQ = [
  {
    q: "Ist BibleBot ein Ersatz für einen Pfarrer?",
    a: "Nein. BibleBot ist eine Ergänzung — verfügbar rund um die Uhr, wenn kein Mensch erreichbar ist. Bei tiefen Krisen verweist BibleBot sofort auf professionelle Hilfe.",
  },
  {
    q: "Kann ich BibleBot auch ohne Login nutzen?",
    a: "Ja. Der Chat funktioniert vollständig ohne Registrierung. Erst wenn du deinen Verlauf speichern möchtest, ist ein Login nötig.",
  },
  {
    q: "Wie unterscheidet sich BibleBot von ChatGPT?",
    a: "ChatGPT ist ein Allzweckmodell ohne Bibelspezialisierung. BibleBot kombiniert KI mit pastoralem Coaching, Quellenverifikation und evidenzbasierter Methodik.",
  },
  {
    q: "In welchen Sprachen ist BibleBot verfügbar?",
    a: "Die Oberfläche gibt es in 36 Sprachen. Die Chat-Antworten passen sich automatisch deiner gewählten Sprache an — inklusive Schweizerdeutsch als Audio-Eingabe.",
  },
];

export default function GuideAIBibleStudy() {
  return (
    <>
      <SEOHead
        title="KI und Bibelstudium: Der ultimative Guide | BibleBot.Life"
        description="Entdecke, wie KI dein Bibelstudium bereichern kann. Vergleich generischer KI vs. BibleBots pastorale Begleitung mit Quellenprüfung und Coaching-Methoden."
        path="/guide/ai-bible-study"
      />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* Hero */}
        <section className="py-20 px-4 bg-card/40 border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
                <Sparkles className="h-4 w-4" />
                Guide: KI und Glaube
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                KI und Bibelstudium:<br />Der ultimative Guide
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Kann Künstliche Intelligenz beim Bibelstudium helfen? Ja — wenn sie richtig eingesetzt wird.
                Lerne den Unterschied zwischen generischer KI und einer Begleitung, die die Bibel wirklich kennt.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vergleich */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Generische KI vs. BibleBot</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nicht jede KI ist für spirituelle Begleitung geeignet. Hier der entscheidende Unterschied.
              </p>
            </div>
            <div className="space-y-4">
              {COMPARISON.map((row) => (
                <Card key={row.aspect} className="bg-card/80 border-border">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="p-4 md:p-6 flex items-center">
                        <p className="font-semibold text-foreground">{row.aspect}</p>
                      </div>
                      <div className="p-4 md:p-6 flex items-start gap-2 bg-destructive/5">
                        <XCircle className="h-5 w-5 text-destructive/60 shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{row.generic}</p>
                      </div>
                      <div className="p-4 md:p-6 flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{row.biblebot}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* So funktioniert es */}
        <section className="py-16 px-4 bg-card/40">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">So funktioniert BibleBot</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Vier Schritte zu einer tiefgehenden Begleitung, die vertrauenswürdig und persönlich ist.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {STEPS.map((step, i) => (
                <Card key={step.title} className="bg-card/80 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{i + 1}</span>
                          {step.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Methodik */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Wissenschaftlich fundiert</h2>
              <p className="text-muted-foreground">
                BibleBot kombiniert biblische Weisheit mit vier evidenzbasierten Ansätzen aus der Positiven Psychologie und Seelsorgeforschung.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Brain, title: "PERMA-Modell", desc: "Positive Emotionen, Engagement, Beziehungen, Sinn, Erreichung — die fünf Säulen des Wohlbefindens nach Martin Seligman." },
                { icon: Sparkles, title: "Logotherapie", desc: "Viktor Frankls Sinnfindung als Kern menschlicher Motivation. Ideal für Gespräche über Berufung und Lebenskrisen." },
                { icon: Heart, title: "Dankbarkeitsforschung", desc: "Empirisch belegte Wirkung von Dankbarkeitspraktiken auf Resilienz — verbunden mit biblischen Psalmen." },
                { icon: Shield, title: "Vergebungsforschung", desc: "Das REACH-Modell von Everett Worthington — strukturiert und wissenschaftlich validiert." },
              ].map((m) => (
                <Card key={m.title} className="bg-card/80 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <m.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{m.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-card/40">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Häufige Fragen</h2>
            </div>
            <div className="space-y-4">
              {FAQ.map((item, i) => (
                <Card key={i} className="bg-card/80 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-card/40 border-t border-border">
          <div className="container mx-auto max-w-2xl text-center">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Starte dein KI-gestütztes Bibelstudium</h2>
            <p className="text-muted-foreground mb-6">
              Ob Frage zur Bibel, persönliche Krise oder einfach der Wunsch nach tieferem Glauben —
              BibleBot ist rund um die Uhr für dich da. Kostenlos, anonym, urteilsfrei.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <a href="https://t.me/meinbibelbot" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Über Telegram starten
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/ki-und-seelsorge">
                  Methodik erfahren
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

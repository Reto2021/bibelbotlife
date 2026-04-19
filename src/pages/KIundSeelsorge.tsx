import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Brain, Heart, Shield, AlertTriangle, CheckCircle2, BookOpen, Compass, Users, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const METHODS = [
  {
    icon: Brain,
    name: "PERMA-Modell",
    author: "Martin Seligman, Universität Pennsylvania",
    desc: "Positive Emotions, Engagement, Relationships, Meaning, Achievement — die fünf Säulen des psychologischen Wohlbefindens. BibleBot strukturiert Gespräche entlang dieser Dimensionen und verbindet sie mit biblischen Quellen.",
    link: "https://positivepsychology.com/perma-model/"
  },
  {
    icon: Compass,
    name: "Logotherapie",
    author: "Viktor E. Frankl, Universität Wien",
    desc: "Sinnfindung als Kern menschlicher Motivation. Frankls Erfahrungen als KZ-Überlebender führten zu einer Therapieform, die BibleBot für Gespräche über Sinnkrisen und Berufung nutzt.",
    link: "https://www.viktorfrankl.org"
  },
  {
    icon: Heart,
    name: "Dankbarkeitsforschung",
    author: "Robert Emmons, UC Davis",
    desc: "Empirisch belegte Wirkung von Dankbarkeitspraktiken auf Wohlbefinden und Resilienz. Direkt verbunden mit biblischen Dankbarkeitspraktiken (Psalmen, Philipper 4).",
    link: "https://greatergood.berkeley.edu/topic/gratitude/definition"
  },
  {
    icon: Users,
    name: "Vergebungsforschung",
    author: "Everett Worthington, Virginia Commonwealth University",
    desc: "Das REACH-Modell der Vergebung — empirisch validiert, praktisch anwendbar. BibleBot nutzt es für Gespräche über Loslassen, Versöhnung und biblische Vergebung.",
    link: "https://www.evworthington-forgiveness.com"
  },
];

const GUARDRAILS = [
  { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: "Jede Bibelstelle wird automatisch mit einem QA-System auf Korrektheit geprüft (Buch, Kapitel, Vers, Übersetzung)." },
  { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: "BibleBot gibt keine medizinischen, rechtlichen oder therapeutischen Diagnosen." },
  { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: "Bei Krisensignalen (Suizid, akute Not) wird sofort auf Telefonseelsorge hingewiesen — bevor die Antwort beginnt." },
  { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: "BibleBot behauptet nie, ein Mensch zu sein oder professionelle Seelsorge zu ersetzen." },
  { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: "Ohne Login: Chatverläufe werden ausschliesslich lokal auf deinem Gerät gespeichert (max. 50 Nachrichten). Mit Login speicherst du bewusst in deinem Konto. Keine Weitergabe von Gesprächsinhalten an Dritte." },
  { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", text: "BibleBot kann irren. Die KI-Technologie ist nicht unfehlbar — deshalb das QA-System und der Verweis auf menschliche Seelsorger." },
];

const CRISIS_NUMBERS = [
  { flag: "🇨🇭", name: "Die Dargebotene Hand", number: "143", url: "https://www.143.ch" },
  { flag: "🇩🇪", name: "Telefonseelsorge Deutschland", number: "0800 111 0 111", url: "https://www.telefonseelsorge.de" },
  { flag: "🇦🇹", name: "Telefonseelsorge Österreich", number: "142", url: "https://www.telefonseelsorge.at" },
  { flag: "🌍", name: "Befrienders Worldwide", number: "befrienders.org", url: "https://www.befrienders.org" },
];

export default function KIundSeelsorge() {
  return (
    <>
      <SEOHead
        titleKey="kiSeelsorge.metaTitle"
        descKey="kiSeelsorge.metaDesc"
        path="/ki-und-seelsorge"
      />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* Hero */}
        <section className="py-20 px-4 bg-card/40 border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
                <Shield className="h-4 w-4" />
                Methodik & Transparenz
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                KI und Seelsorge —<br />wie das zusammengeht
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                BibleBot ist kein Therapeut und kein Pfarrer. Aber es ist mehr als ein Chatbot.
                Hier erklären wir transparent, welche Methodik dahintersteckt, wo die Grenzen liegen
                und wie wir mit Krisensituationen umgehen.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Was BibleBot ist — und was nicht */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Was BibleBot ist — und was nicht</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/80 border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive/80">
                    <AlertTriangle className="h-5 w-5" />
                    BibleBot ist kein Ersatz für
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Professionelle Psychotherapie oder Psychiatrie",
                    "Seelsorgliche 1:1-Begleitung durch Pfarrpersonen",
                    "Medizinische Diagnosen oder Behandlungen",
                    "Theologische Ausbildung oder Lehre",
                    "Krisenintervention durch Fachpersonen",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-destructive/60 mt-0.5 shrink-0">✗</span>
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-emerald-200 dark:border-emerald-800/40">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    BibleBot ist gut für
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Niederschwelligen Zugang zu biblischer Weisheit",
                    "Reflexion, Orientierung und tiefe Fragen im Alltag",
                    "Spirituelle Begleitung ohne Kirchenzugehörigkeit",
                    "Strukturierte Selbstreflexion (Lebensrad, 7 Warums)",
                    "Erste Anlaufstelle bei Lebensthemen — rund um die Uhr",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Methodik */}
        <section className="py-16 px-4 bg-card/40">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Evidenzbasierte Methodik</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                BibleBot kombiniert biblische Weisheit mit vier wissenschaftlich fundierten Ansätzen
                aus der Positiven Psychologie, Existenzanalyse und Vergebungsforschung.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {METHODS.map((m) => (
                <Card key={m.name} className="bg-card/80 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <m.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.author}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
                    <a href={m.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Quelle
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* QA & Guardrails */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Qualitätssicherung & Grenzen</h2>
              <p className="text-muted-foreground">Was wir technisch tun, um Schaden zu vermeiden.</p>
            </div>
            <div className="space-y-4">
              {GUARDRAILS.map((g, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border">
                  <g.icon className={`h-5 w-5 shrink-0 mt-0.5 ${g.color}`} />
                  <p className="text-sm text-foreground/80 leading-relaxed">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Krisenintervention */}
        <section className="py-16 px-4 bg-destructive/5 border-y border-destructive/10">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 px-4 py-1.5 rounded-full mb-4">
                🆘 Krisenintervention
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Wenn jemand in einer Notlage ist</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                BibleBot erkennt automatisch Krisensignale in Gesprächen — Begriffe rund um Suizid,
                selbstverletzendes Verhalten oder akute Not. Bei Erkennung wird <strong>sofort</strong>,
                noch vor der eigentlichen Antwort, auf Krisenhotlines hingewiesen.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {CRISIS_NUMBERS.map((c) => (
                <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.name}</p>
                    <p className="text-primary font-bold">{c.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Bibelübersetzungen */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">5 Bibelübersetzungen</h2>
              <p className="text-muted-foreground">
                BibleBot nutzt ausschliesslich lizenzierte Bibelübersetzungen und kennzeichnet
                jede Antwort mit Buch, Kapitel und Übersetzung.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "Zürcher Bibel 2007", tradition: "Reformiert", color: "text-teal-600 dark:text-teal-400" },
                { name: "Lutherbibel 2017", tradition: "Evangelisch-lutherisch", color: "text-amber-600 dark:text-amber-400" },
                { name: "Einheitsübersetzung 2016", tradition: "Römisch-katholisch", color: "text-primary" },
                { name: "Schlachter Bibel 2000", tradition: "Freikirchlich", color: "text-purple-600 dark:text-purple-400" },
                { name: "Elberfelder Bibel 2006", tradition: "Wortgetreu", color: "text-rose-600 dark:text-rose-400" },
              ].map((b) => (
                <div key={b.name} className="flex items-center gap-3 bg-card/60 rounded-lg px-4 py-3 border border-border">
                  <BookOpen className={`h-4 w-4 shrink-0 ${b.color}`} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.tradition}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-card/40 border-t border-border">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Fragen zur Methodik?</h2>
            <p className="text-muted-foreground mb-6">
              Für Journalisten, Theologen und Forschende stehen wir gerne für Rückfragen zur Verfügung.
              Für Pfarrpersonen und Gemeinden gibt es eine eigene Seite.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <a href="mailto:reto@bibelbot.ch">Kontakt aufnehmen</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/for-churches">Für Gemeinden & Seelsorger →</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

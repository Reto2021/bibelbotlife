import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  ArrowLeft, Heart, Mic, FileText, Calendar, Users, Music,
  BookOpen, Sparkles, Monitor, Layout, ChevronDown, Check, ArrowRight
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Mic,
    title: "Sprachaufnahme & Transkription",
    desc: "Gespräche aufnehmen, automatisch transkribieren lassen — die Grundlage für berührende Zeremonietexte.",
  },
  {
    icon: Sparkles,
    title: "KI-gestützte Texterstellung",
    desc: "Aus Ihren Notizen und Transkripten entstehen einfühlsame Reden für Abdankungen, Trauungen, Taufen und Konfirmationen.",
  },
  {
    icon: FileText,
    title: "PDF-Export & Teilen",
    desc: "Fertige Texte als PDF exportieren oder per Sharing-Link direkt an Angehörige und Beteiligte weitergeben.",
  },
  {
    icon: Layout,
    title: "Vorlagen pro Konfession",
    desc: "Vorgefertigte Ablauf-Templates für katholisch, reformiert, lutherisch, freikirchlich und weltlich — sofort einsatzbereit.",
  },
  {
    icon: Calendar,
    title: "Kalender & Planung",
    desc: "Alle Zeremonien im Überblick: Monats-, Wochen- und Tagesansicht. Nie mehr den Überblick verlieren.",
  },
  {
    icon: Monitor,
    title: "Teleprompter / Conductor Mode",
    desc: "Live-Modus für die Durchführung: Ablauf-Block für Block durchgehen, Texte ablesen, Musik-Cues sehen — ablenkungsfrei.",
  },
  {
    icon: Music,
    title: "Musikeinbindung",
    desc: "Lieder und Musikstücke direkt in den Ablauf integrieren. Der Conductor Mode zeigt Ihnen, wann welches Stück erklingt.",
  },
  {
    icon: Users,
    title: "Team & Zusammenarbeit",
    desc: "Musiker, Lektoren, Techniker einbinden. Rollen zuweisen, Verfügbarkeiten prüfen, gemeinsam planen.",
  },
  {
    icon: BookOpen,
    title: "Ressourcen-Bibliothek",
    desc: "Lieder, Gebete, Lesungen und Liturgietexte — durchsuchbar, mit Tags, wachsend mit jeder Zeremonie.",
  },
  {
    icon: Heart,
    title: "Kirchenbuch & Register",
    desc: "Taufen, Trauungen und Abdankungen sauber dokumentieren. Alle Daten an einem Ort.",
  },
];

const painPoints = [
  "Stundenlange Vorbereitung für jede einzelne Zeremonie?",
  "Notizen auf Papier, die beim wichtigsten Moment fehlen?",
  "Kein System für Lieder, Lesungen und Ablauf?",
  "Schwierig, mit Musikern und Helfern zu koordinieren?",
];

const pricingPlans = [
  {
    name: "Persönlich",
    price: "Kostenlos",
    period: "",
    features: [
      "Zeremonie-Texte erstellen",
      "Sprachaufnahme & Transkription",
      "PDF-Export",
      "Teilen per Link",
      "1 aktives Projekt",
    ],
    cta: "Jetzt starten",
    popular: false,
  },
  {
    name: "Seelsorger Pro",
    price: "CHF 29",
    period: "/ Monat",
    features: [
      "Alles aus Persönlich",
      "Unbegrenzte Projekte",
      "Gottesdienstplaner mit Kalender",
      "Conductor Mode (Teleprompter)",
      "Musik-Integration",
      "Vorlagen-Bibliothek",
      "Team-Zusammenarbeit",
      "Ressourcen-Bibliothek",
      "Kirchenbuch / Register",
      "Prioritäts-Support",
    ],
    cta: "14 Tage kostenlos testen",
    popular: true,
  },
];

const faqs = [
  {
    q: "Für wen ist dieses Tool gedacht?",
    a: "Für freiberufliche Trauerredner, Hochzeitszeremoniemeister, Spitalseelsorger, Pfarrpersonen und alle, die Zeremonien vorbereiten und durchführen.",
  },
  {
    q: "Werden meine Daten sicher gespeichert?",
    a: "Ja. Alle Daten werden verschlüsselt in der Schweiz gespeichert. Nur Sie haben Zugriff auf Ihre Inhalte.",
  },
  {
    q: "Welche Sprachen werden unterstützt?",
    a: "Die Benutzeroberfläche ist in 36 Sprachen verfügbar. Texte können in jeder Sprache erstellt werden.",
  },
  {
    q: "Kann ich den Conductor Mode auch auf dem Tablet nutzen?",
    a: "Ja! Die gesamte App ist als PWA mobil-optimiert — perfekt auf dem Tablet am Rednerpult.",
  },
  {
    q: "Brauche ich technische Kenntnisse?",
    a: "Nein. Die Bedienung ist intuitiv und für Menschen gemacht, die sich auf Inhalte konzentrieren wollen — nicht auf Technik.",
  },
];

export default function ForCelebrants() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEOHead
        title="BibleBot.Life für Seelsorger — Zeremonien vorbereiten & durchführen"
        description="Abdankungen, Trauungen, Taufen professionell planen: Sprachaufnahme, Textgenerierung, Teleprompter, Kalender und Team-Zusammenarbeit."
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo className="h-8 w-8" />
            <span className="font-bold text-lg text-foreground hidden sm:inline">BibleBot.Life</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
            <Button asChild variant="outline" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Zurück</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Für Seelsorger & Zeremonienmeister</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Jede Zeremonie verdient<br />
            <span className="text-primary">beste Vorbereitung</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Von der ersten Sprachnotiz bis zum letzten Amen — planen, schreiben und durchführen Sie berührende Zeremonien mit einem einzigen Werkzeug.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/login">Kostenlos starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <a href="#features">Funktionen entdecken</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-foreground">Kennen Sie das?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border">
                <span className="text-destructive mt-0.5 text-xl">✗</span>
                <p className="text-muted-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-foreground">Alles was Sie brauchen</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Ein durchdachtes System für den gesamten Ablauf — von der Vorbereitung bis zur Durchführung.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <f.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-foreground">Einfache Preise</h2>
          <p className="text-center text-muted-foreground mb-12">Starten Sie kostenlos. Upgraden Sie, wenn Sie mehr brauchen.</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card key={i} className={`relative overflow-hidden ${plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Empfohlen
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                    <Link to="/login">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">Häufige Fragen</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Bereit für bessere Zeremonien?</h2>
          <p className="text-muted-foreground mb-8">Starten Sie kostenlos — keine Kreditkarte nötig.</p>
          <Button asChild size="lg" className="text-base px-10">
            <Link to="/login">Jetzt kostenlos starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BibleBot.Life</p>
          <div className="flex gap-4">
            <Link to="/impressum" className="hover:text-foreground">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
            <Link to="/for-churches" className="hover:text-foreground">Für Gemeinden</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

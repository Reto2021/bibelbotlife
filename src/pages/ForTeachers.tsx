import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, BookOpen, Calendar, Users, Sparkles, Monitor,
  ClipboardList, FileText, Target, Lightbulb, Check, ArrowRight, ChevronDown,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Target, title: "Lernziele pro Lektion", desc: "Definiere Lernziele und Kompetenzen direkt im Editor — sichtbar im Stundenentwurf." },
  { icon: Sparkles, title: "Bausteine für Unterricht", desc: "Einstieg, Input, Aktivität, Arbeitsblatt, Diskussion, Reflexion, Hausaufgabe — drag & drop." },
  { icon: BookOpen, title: "Bibel-Recherche im Chat", desc: "Bibelstellen, Erklärungen und Diskussionsfragen per BibleBot direkt aus dem Editor." },
  { icon: ClipboardList, title: "Materialbibliothek", desc: "Arbeitsblätter, Lieder, Videos und Bibelstellen sammeln, taggen, wiederverwenden." },
  { icon: Calendar, title: "Kalender & Wochenplan", desc: "Alle Lektionen pro Klasse — als Liste oder Wochenraster." },
  { icon: Monitor, title: "Conductor-Modus", desc: "Live im Klassenzimmer: distraktionsfrei, swipebar, perfekt am Beamer oder Tablet." },
  { icon: Users, title: "Reihen & Co-Teaching", desc: "Unterrichtsreihen («Gleichnisse», «Weltreligionen»), Vertretungen, Mentor-Sharing." },
  { icon: FileText, title: "Stundenentwurf-PDF", desc: "Sauber formatierter Stundenentwurf für Mentor:in, Schulleitung oder Praktikum." },
  { icon: Lightbulb, title: "Vorlagen pro Stufe", desc: "Eigene Vorlagen anlegen — Einstiegsstunde, Doppelstunde, Projekttag." },
];

const painPoints = [
  "Stundenentwürfe in Word — unübersichtlich, schwer wiederverwendbar",
  "Materialien verstreut über USB-Stick, Cloud, E-Mail-Anhänge",
  "Bibelstellen mühsam recherchieren und in Word einfügen",
  "Im Unterricht zwischen Notizen, Bibel und Beamer hin- und herwechseln",
];

const teacherFeatures = [
  "Block-Editor mit Unterrichts-Bausteinen",
  "Lernziele und Klassen pro Lektion",
  "Materialbibliothek (Arbeitsblätter, Videos, Bilder)",
  "Bibel-Suche in 5 Übersetzungen",
  "Stundenentwurf als PDF",
  "Conductor-Modus für Live-Unterricht",
  "Wochenkalender und Lektionsreihen",
  "BibleBot-Chat für Recherche und Diskussionsideen",
];

const faqs = [
  {
    q: "Ist das nur für Religionsunterricht?",
    a: "Primär ja — die Bausteine sind auf Religion und Ethik zugeschnitten. Für andere Fächer mit ähnlicher Struktur (Geschichte, Philosophie) funktioniert es aber auch.",
  },
  {
    q: "Kann ich es kostenlos nutzen?",
    a: "Ja. Der persönliche Modus ist gratis — ohne Schullizenz, ohne Schulkonto. Du legst direkt los.",
  },
  {
    q: "Welche Lehrpläne werden unterstützt?",
    a: "Du arbeitest mit freiem Klassen- und Stufentext. Lehrplan-Bezüge (LP21, LehrplanPLUS, kantonal) trägst du selbst ein — wir sind kein verpflichtendes Curriculum.",
  },
  {
    q: "Was ist mit Datenschutz?",
    a: "Keine Schülerdaten nötig. Du planst Lektionen — keine Anwesenheit, keine Noten, keine Namen. Deine Entwürfe sind privat.",
  },
  {
    q: "Funktioniert es auch ohne Internet?",
    a: "Die App ist als PWA installierbar. Bestehende Lektionen sind offline lesbar; zum Speichern brauchst du Verbindung.",
  },
];

export default function ForTeachers() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEOHead
        title="Unterrichtsplaner für Religionslehrkräfte — BibleBot.Life"
        description="Plane Religionsunterricht in Bausteinen. Lernziele, Materialbibliothek, Bibel-Recherche, Stundenentwurf-PDF und Live-Modus. Kostenlos starten."
        canonicalUrl="https://biblebot.life/unterrichtsplaner"
      />
      <SiteHeader />

      <main className="bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <GraduationCap className="h-3.5 w-3.5" />
              Für Religionslehrkräfte
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Unterricht planen.<br />
              <span className="text-primary">Endlich strukturiert.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stundenentwürfe in Bausteinen. Lernziele, Bibelstellen, Material und Live-Modus —
              alles an einem Ort, statt in zehn Word-Dateien.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="text-base">
                <Link to="/login?redirect=/dashboard/lessons">
                  Kostenlos loslegen <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/dashboard/lessons">Demo ansehen</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Kein Schulkonto nötig · Keine Schülerdaten · In 2 Minuten startklar
            </p>
          </div>
        </section>

        {/* Pain points */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-foreground">
              Kennst du das?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.map((p, i) => (
                <Card key={i} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-destructive font-bold shrink-0">✗</span>
                    <p className="text-sm text-foreground">{p}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-lg font-medium text-foreground">
              Der Unterrichtsplaner löst das.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Alles, was du für den Religionsunterricht brauchst
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Kein Stundenplan-Tool, kein LMS — sondern ein Planer für die einzelne Lektion und die Reihe.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                    <GraduationCap className="h-4 w-4" /> Im Unterrichtsplaner enthalten
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Kostenlos für Lehrkräfte</h3>
                  <p className="text-sm text-muted-foreground">Persönliche Nutzung — keine Schullizenz nötig.</p>
                </div>
                <ul className="space-y-2 pt-2">
                  {teacherFeatures.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-4" size="lg">
                  <Link to="/login?redirect=/dashboard/lessons">
                    Jetzt kostenlos starten <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-foreground">Fragen & Antworten</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <button
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-foreground">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <GraduationCap className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Plane deine nächste Lektion in 5 Minuten
            </h2>
            <p className="text-muted-foreground">
              Kein Setup. Keine Kreditkarte. Einfach loslegen.
            </p>
            <Button asChild size="lg" className="text-base">
              <Link to="/login?redirect=/dashboard/lessons">
                Kostenlos starten <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

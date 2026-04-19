import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download, Mail, ExternalLink, Globe, Users, Shield,
  BookOpen, Languages, Zap, Copy, Check
} from "lucide-react";
import { useState } from "react";

const FACTS = [
  { icon: Globe,     label: "Sprachen",          value: "38" },
  { icon: BookOpen,  label: "Bibelübersetzungen", value: "5" },
  { icon: Users,     label: "Preis",              value: "Kostenlos" },
  { icon: Shield,    label: "Datenschutz",        value: "Anonym, kein Tracking" },
  { icon: Zap,       label: "Verfügbarkeit",      value: "24/7" },
  { icon: Languages, label: "Plattform",          value: "Web + PWA" },
];

const PRESS_ANGLES = [
  {
    headline: "Erste Bibel-App mit automatischer Krisenintervention",
    body: "BibleBot.Life erkennt Suizidsignale in Echtzeit und zeigt sofort — noch vor der Antwort — die Krisenhotlines für CH, DE und AT an. Als erste Bibel-App weltweit.",
  },
  {
    headline: "KI trifft Seelsorge: 2000 Jahre Weisheit, 24/7 erreichbar",
    body: "BibleBot verbindet vier wissenschaftlich fundierte Methoden (PERMA, Logotherapie, Dankbarkeitsforschung, Vergebungsforschung) mit geprüften Bibelstellen — kein Halluzinieren, keine Meinungen.",
  },
  {
    headline: "Die stille Krise der Kirchendistanz — und eine Antwort",
    body: "Millionen Menschen haben die Kirche verlassen, aber nicht die grossen Fragen. BibleBot ist die niederschwelligste Brücke zwischen diesen Menschen und 2000 Jahren Weisheit.",
  },
  {
    headline: "Seelsorge für 38 Sprachen — inklusive Suaheli, Amharisch, Yoruba",
    body: "Kirchliche Seelsorge ist meist monolingual. BibleBot bricht diese Barriere: Migranten, Geflüchtete und globale Communitys erhalten Begleitung in ihrer Muttersprache.",
  },
];

const QUOTES = [
  {
    text: "BibleBot ist kein Therapeut und kein Pfarrer. Aber es ist mehr als ein Chatbot — es ist der erste Schritt für Menschen, die bisher keinen Weg in die Seelsorge gefunden haben.",
    author: "Reto Wettstein, Gründer BibleBot.Life",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

export default function Presse() {
  return (
    <>
      <SEOHead
        title="Pressemitteilungen & Medienmaterial | BibleBot.Life"
        description="Pressematerial, Fakten, Zitate und Pressekontakt für BibleBot.Life — die erste Bibel-App mit automatischer Krisenintervention, 38 Sprachen und evidenzbasierter Methodik."
        path="/presse"
      />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* Hero */}
        <section className="py-16 px-4 bg-card/40 border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Badge variant="outline" className="mb-4 text-sm px-3 py-1">Presse & Medien</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Medienmaterial &<br />Pressekontakt
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Alles was Sie für einen Artikel, Beitrag oder Interview brauchen — Fakten, Zitate,
                Presswinkel und Kontakt.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button asChild size="lg">
                  <a href="mailto:reto@bibelbot.ch">
                    <Mail className="h-4 w-4 mr-2" />
                    Pressekontakt
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/ki-und-seelsorge">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Methodik & Transparenz
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Facts */}
        <section className="py-14 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">BibleBot.Life in Zahlen</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FACTS.map((f) => (
                <div key={f.label} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="font-semibold text-foreground text-sm">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Press Angles */}
        <section className="py-14 px-4 bg-card/40 border-y border-border">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Mögliche Presswinkel</h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">Vier Geschichten, die BibleBot.Life erzählen kann.</p>
            <div className="space-y-4">
              {PRESS_ANGLES.map((a, i) => (
                <Card key={i} className="bg-card/80 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base leading-snug">{a.headline}</CardTitle>
                      <CopyButton text={`${a.headline}\n\n${a.body}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quotes */}
        <section className="py-14 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Autorisierte Zitate</h2>
            {QUOTES.map((q, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className="text-4xl text-primary/30 font-serif leading-none">"</span>
                  <CopyButton text={`„${q.text}" — ${q.author}`} />
                </div>
                <p className="font-serif text-foreground/90 text-lg leading-relaxed italic mb-4">
                  {q.text}
                </p>
                <p className="text-sm text-muted-foreground font-medium">— {q.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Logos & Assets */}
        <section className="py-14 px-4 bg-card/40 border-y border-border">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Logos & Bildmaterial</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Logo hell (PNG, 192×192)", file: "/favicon-192.png" },
                { label: "Logo dunkel (PNG, 192×192)", file: "/favicon-dark-192.png" },
                { label: "OG-Image Deutsch (PNG, 1200×630)", file: "/og-image-de.png" },
                { label: "OG-Image Englisch (PNG, 1200×630)", file: "/og-image.png" },
              ].map((asset) => (
                <a
                  key={asset.file}
                  href={asset.file}
                  download
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
                >
                  <Download className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{asset.label}</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Für hochauflösende Druckmaterialien: <a href="mailto:reto@bibelbot.ch" className="text-primary hover:underline">reto@bibelbot.ch</a>
            </p>
          </div>
        </section>

        {/* Boilerplate */}
        <section className="py-14 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Boilerplate (für Artikel)</h2>
            <div className="relative p-5 rounded-xl bg-card border border-border">
              <div className="flex justify-end mb-2">
                <CopyButton text="BibleBot.Life ist ein kostenloser KI-Begleiter, der biblische Weisheit mit evidenzbasierter Seelsorge-Methodik verbindet. Die Plattform ist in 38 Sprachen verfügbar, erkennt automatisch Krisensignale und verweist bei Bedarf sofort auf Telefonseelsorge-Nummern. BibleBot.Life wurde von Reto Wettstein (Schweiz) gegründet und ist unter biblebot.life zugänglich — anonym, kostenlos, ohne Anmeldung." />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                BibleBot.Life ist ein kostenloser KI-Begleiter, der biblische Weisheit mit evidenzbasierter
                Seelsorge-Methodik verbindet. Die Plattform ist in 38 Sprachen verfügbar, erkennt automatisch
                Krisensignale und verweist bei Bedarf sofort auf Telefonseelsorge-Nummern. BibleBot.Life wurde
                von Reto Wettstein (Schweiz) gegründet und ist unter{" "}
                <a href="https://biblebot.life" className="text-primary">biblebot.life</a>{" "}
                zugänglich — anonym, kostenlos, ohne Anmeldung.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 px-4 bg-card/40 border-t border-border">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Pressekontakt</h2>
            <p className="text-muted-foreground mb-6">
              Reto Wettstein — Gründer & Betreiber<br />
              <a href="mailto:reto@bibelbot.ch" className="text-primary hover:underline">reto@bibelbot.ch</a>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <a href="mailto:reto@bibelbot.ch">
                  <Mail className="h-4 w-4 mr-2" />
                  Interview anfragen
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/ueber-uns">Über den Gründer →</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

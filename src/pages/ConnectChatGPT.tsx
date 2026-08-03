import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "/src/components/SEOHead";
import { SiteHeader } from "/src/components/SiteHeader";
import { Button } from "/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card";
import { Input } from "/src/components/ui/input";
import { useToast } from "/src/hooks/use-toast";
import {
  Bot,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Lock,
  MessageSquareHeart,
  Search,
  Sparkles,
  BookOpen,
  MapPin,
  HandHeart,
  ScrollText,
} from "lucide-react";

const MCP_PATH = "/functions/v1/mcp";

function getMcpUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL ?? window.location.origin;
  return `${base.replace(/\/$/, "")}${MCP_PATH}`;
}

const steps = [
  {
    icon: Bot,
    title: "ChatGPT öffnen",
    desc: "Gehe in ChatGPT, Claude, Cursor oder einen anderen MCP-Client und wähle „MCP-Server hinzufügen“.",
  },
  {
    icon: Copy,
    title: "URL einfügen",
    desc: "Kopiere die BibleBot-Verbindungs-URL unten und füge sie im Client ein.",
  },
  {
    icon: Lock,
    title: "Anmelden oder registrieren",
    desc: "Falls du noch kein BibleBot-Konto hast, wirst du automatisch zur Registrierung geleitet. Danach fragt die Consent-Seite nach deiner Erlaubnis.",
  },
  {
    icon: Sparkles,
    title: "Bibel-Coaching starten",
    desc: "Sofort kannst du in ChatGPT Bibelstellen suchen, Gebetsanliegen lesen, Journal-Einträge anlegen und deine Kreuzwege ansehen – alles in deinem Namen.",
  },
];

const tools = [
  { icon: Search, title: "Bibel durchsuchen", desc: "Finde Stellen in fünf Übersetzungen per Volltextsuche." },
  { icon: HandHeart, title: "Gebetswand lesen", desc: "Lies freigegebene Gebetsanliegen und bete mit." },
  { icon: ScrollText, title: "Persönliches Journal", desc: "Zeige eigene Einträge an oder erstelle neue Impulse." },
  { icon: MapPin, title: "Meine Kreuzwege", desc: "Rufe deine hochgeladenen Kreuz-Fotos und Status ab." },
  { icon: BookOpen, title: "Bibel-Momente", desc: "Lass dich an Geburtstage, Anlässe und tägliche Impulse erinnern." },
  { icon: MessageSquareHeart, title: "Pastoraler Begleiter", desc: "Fragen, Antworten, Trost – direkt im Chat-Client." },
];

const faqs = [
  {
    q: "Brauche ich ein BibleBot-Konto?",
    a: "Ja, aber du kannst es während der Verbindung direkt erstellen. E-Mail, Google oder Apple – danach bist du sofort dabei.",
  },
  {
    q: "Welche Daten sieht ChatGPT?",
    a: "Nur das, was du über die Werkzeuge freigibst: Bibelsuche, öffentliche Gebetsanliegen, dein Journal, deine Kreuzwege und deine Bibel-Momente. RLS greift wie in der App.",
  },
  {
    q: "Funktioniert es auch mit Claude oder Cursor?",
    a: "Ja. Jeder MCP-Client, der OAuth 2.1 unterstützt, kann sich mit BibleBot verbinden.",
  },
  {
    q: "Wie kann ich die Verbindung trennen?",
    a: "In deinem BibleBot-Profil unter „Mein Bereich“ oder direkt im jeweiligen MCP-Client entfernst du den Server.",
  },
];

export default function ConnectChatGPT() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const mcpUrl = getMcpUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      toast({ title: "URL kopiert", description: "Füge sie jetzt in deinem MCP-Client ein." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopieren nicht möglich", description: "Bitte markiere die URL manuell.", variant: "destructive" });
    }
  };

  return (
    <>
      <SEOHead
        title="BibleBot in ChatGPT, Claude & Cursor | Dein Bibel-Begleiter als MCP"
        description="Verbinde BibleBot.Life mit ChatGPT, Claude oder Cursor. Suche die Bibel, pflege dein Journal und entdecke Gebetsanliegen – sicher per OAuth, ohne API-Key."
        path="/connect"
      />
      <SiteHeader />
      <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
          <div className="container mx-auto px-4 relative">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Neu: MCP-Integration
              </div>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wide text-foreground leading-[0.95] mb-6">
                Dein Bibel-Begleiter <span className="text-primary">in ChatGPT</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
                Verbinde BibleBot.Life mit ChatGPT, Claude oder Cursor. Stelle Fragen zur Bibel,
                suche nach Stellen, lies die Gebetswand und pflege dein Journal – direkt im Chat,
                sicher mit deinem BibleBot-Login.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Verbindungs-URL kopieren
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a
                    href="https://openai.com/index/introducing-the-chatgpt-mcp-marketplace/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Mehr über MCP
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* URL card */}
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl border-border/80 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-warm)]">
              <CardHeader>
                <CardTitle className="text-lg">BibleBot MCP-Server</CardTitle>
                <CardDescription>
                  Füge diese URL in deinem MCP-Client hinzu. Der Server antwortet auf Deutsch (Schweiz).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    readOnly
                    value={mcpUrl}
                    className="font-mono text-sm bg-muted/50"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button onClick={handleCopy} className="shrink-0 gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Kopieren
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Die Verbindung läuft über OAuth 2.1. Du behältst die Kontrolle: ChatGPT darf nur das tun,
                  was du auf der Consent-Seite erlaubst.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 bg-card/40 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-10">
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wide text-foreground mb-3">
                So verbindest du in 4 Schritten
              </h2>
              <p className="text-muted-foreground">
                Kein API-Key nötig. Die Anmeldung ist Teil des Flows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              {steps.map((step, idx) => (
                <Card key={step.title} className="bg-card/80 border-border/60">
                  <CardContent className="p-6 flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-display text-lg">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <step.icon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-10">
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wide text-foreground mb-3">
                Was du direkt im Chat nutzen kannst
              </h2>
              <p className="text-muted-foreground">
                Diese Werkzeuge stehen dir zur Verfügung – je nachdem, was du auf der Consent-Seite freigibst.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Card key={tool.title} className="bg-card/70 border-border/60 hover:border-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-md bg-accent text-accent-foreground">
                        <tool.icon className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold text-foreground">{tool.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-card/40 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wide text-foreground mb-8">
                Häufige Fragen
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <Card key={faq.q} className="bg-card/80 border-border/60">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-5xl uppercase tracking-wide text-foreground mb-4">
                Jetzt verbinden
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Kopiere die URL, öffne deinen MCP-Client und erlebe die Bibel dort, wo du ohnehin schon schreibst.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button size="lg" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Verbindungs-URL kopieren
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login?next=/.lovable/oauth/consent">Zur Anmeldung</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

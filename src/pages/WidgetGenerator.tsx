import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Copy, Check, ArrowLeft, Code2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function WidgetGenerator() {
  const [color, setColor] = useState("#C8883A");
  const [name, setName] = useState("Frag den BibleBot");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [lang, setLang] = useState("de");
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    return `<script src="https://biblebot.life/embed.js"
        data-color="${color}"
        data-name="${name.replace(/"/g, "&quot;")}"
        data-position="${position}"
        data-lang="${lang}"
        defer></script>`;
  }, [color, name, position, lang]);

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Snippet kopiert" });
  }

  return (
    <>
      <Helmet>
        <title>BibelBot-Widget für deine Website | biblebot.life</title>
        <meta
          name="description"
          content="Bau den BibelBot in 1 Zeile auf deine Website ein. Kostenlos, kein Login. Für Gemeinden, Pastor:innen, Blogs, Influencer."
        />
        <link rel="canonical" href="https://biblebot.life/widget" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 px-4 py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>

          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3 w-3" /> Neu — kostenlos
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-3">
              BibelBot auf deiner Website.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              In 1 Zeile eingebaut. Deine Besucher können den BibelBot fragen, ohne deine
              Seite zu verlassen. Für Gemeinden, Pastor:innen, Blogs, Influencer.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Konfigurator */}
            <Card className="p-6">
              <h2 className="font-medium mb-4 flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Anpassen
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Bot-Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 60))}
                    placeholder="Frag den BibleBot"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Hauptfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 p-1 h-10"
                    />
                    <Input value={color} onChange={(e) => setColor(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Position</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["bottom-right", "bottom-left"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPosition(p)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          position === p
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {p === "bottom-right" ? "Unten rechts" : "Unten links"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="lang">Sprache</Label>
                  <select
                    id="lang"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="it">Italiano</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Vorschau */}
            <Card className="p-6 relative overflow-hidden min-h-[400px]">
              <h2 className="font-medium mb-4">Vorschau</h2>
              <div className="text-sm text-muted-foreground mb-4">
                So sieht das Widget auf deiner Seite aus.
              </div>
              <div className="rounded-lg bg-muted/30 border border-border h-64 relative">
                <div
                  className="absolute bottom-3"
                  style={{ [position === "bottom-right" ? "right" : "left"]: "12px" } as any}
                >
                  <button
                    style={{
                      background: color,
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      border: "none",
                      color: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={name}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Snippet */}
          <Card className="p-6 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Dein Code-Snippet</h2>
              <Button onClick={copy} size="sm" variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Kopiert" : "Kopieren"}
              </Button>
            </div>
            <pre className="bg-muted rounded-lg p-4 text-xs md:text-sm overflow-x-auto">
              <code>{snippet}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-3">
              Füge diesen Code direkt vor dem schliessenden <code>&lt;/body&gt;</code>-Tag in
              den HTML-Code deiner Seite ein.
            </p>
          </Card>

          {/* CTA */}
          <Card className="p-6 mt-8 bg-primary/5 border-primary/20">
            <h3 className="font-medium mb-2">Branding ohne „powered by"?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gemeinden mit Patronats-Paket können das Widget vollständig mit eigenem Logo,
              Bot-Namen und ohne BibelBot-Branding einbinden.
            </p>
            <Link to="/for-churches">
              <Button variant="outline">Patronat ansehen →</Button>
            </Link>
          </Card>
        </div>
      </main>
    </>
  );
}

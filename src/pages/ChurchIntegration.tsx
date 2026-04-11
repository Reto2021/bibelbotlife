import { useState } from "react";
import { BrandedQRCode } from "@/components/BrandedQRCode";
import { QRStickerDownload } from "@/components/QRStickerDownload";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, ArrowLeft, ExternalLink, Code2, Link2, QrCode, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = "https://biblebot.life";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Kopiert!", description: label || "In die Zwischenablage kopiert." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Kopiert" : "Kopieren"}
    </Button>
  );
}

const ChurchIntegration = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: church, isLoading } = useQuery({
    queryKey: ["church-integration", slug],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("church_partners_public" as any)
        .select("*")
        .eq("slug", slug!)
        .single() as any);
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden…</div>
      </div>
    );
  }

  if (!church) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Gemeinde nicht gefunden.</p>
      </div>
    );
  }

  const brandedLink = `${BASE_URL}/?church=${church.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(brandedLink)}&margin=16`;

  const widgetCode = `<!-- BibleBot Widget für ${church.name} -->
<script src="${SUPABASE_URL}/functions/v1/church-widget?slug=${church.slug}" defer></script>`;

  const iframeCode = `<!-- BibleBot Inline für ${church.name} -->
<iframe
  src="${brandedLink}"
  style="width:100%;height:600px;border:none;border-radius:12px;"
  loading="lazy"
  title="BibleBot"
></iframe>`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/churches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {church.logo_url && (
              <img src={church.logo_url} alt="" className="h-10 w-10 object-contain rounded" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{church.name}</h1>
              <p className="text-sm text-muted-foreground">Integrations-Kit · {church.slug}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Branded Link */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Branded Link</CardTitle>
                  <CardDescription>Direkter Link zu eurem gebrandeten BibleBot</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                <code className="text-sm flex-1 truncate text-foreground">{brandedLink}</code>
                <CopyButton text={brandedLink} label="Link kopiert" />
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={brandedLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Vorschau öffnen
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. QR Code */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">QR-Code</CardTitle>
                  <CardDescription>Für Flyer, Gemeindebrief, Plakate oder Beamer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                  <BrandedQRCode value={brandedLink} size={160} />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Dieser QR-Code führt direkt zu eurem gebrandeten BibleBot mit Splash-Screen und Kirchenlogo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = qrCodeUrl;
                        a.download = `bibelbot-qr-${church.slug}.png`;
                        a.click();
                      }}
                    >
                      PNG herunterladen
                    </Button>
                    <CopyButton text={brandedLink} label="QR-Link kopiert" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Website Widget */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Website-Widget (Overlay)</CardTitle>
                  <CardDescription>Chat-Button unten rechts auf eurer Website</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Füge diesen Code vor dem schliessenden <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> Tag ein. Eure Besucher sehen einen Chat-Button und können BibleBot direkt auf eurer Website nutzen.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted/50 rounded-lg border text-xs overflow-x-auto whitespace-pre-wrap break-all text-foreground">
                  {widgetCode}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={widgetCode} label="Widget-Code kopiert" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Inline Embed */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Inline-Einbettung (iFrame)</CardTitle>
                  <CardDescription>BibleBot direkt in eine Seite eingebettet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alternativ kann BibleBot auch direkt in eine Unterseite eingebettet werden — z.B. auf einer "Bibel-Chat"-Seite.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted/50 rounded-lg border text-xs overflow-x-auto whitespace-pre-wrap break-all text-foreground">
                  {iframeCode}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={iframeCode} label="iFrame-Code kopiert" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage tips */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3">💡 Tipps zur Nutzung</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Newsletter:</strong> Branded Link + kurze Beschreibung einfügen</li>
                <li>• <strong>Gemeindebrief:</strong> QR-Code ausdrucken mit Hinweis "Frag die Bibel"</li>
                <li>• <strong>Website:</strong> Widget-Code einmal einbauen, fertig</li>
                <li>• <strong>Social Media:</strong> Branded Link teilen mit kurzem Teaser</li>
                <li>• <strong>Gottesdienst:</strong> QR-Code auf den Beamer — interaktive Bibelarbeit</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChurchIntegration;

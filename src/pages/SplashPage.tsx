import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandedQRCode } from "@/components/BrandedQRCode";
import { hexToHsl } from "@/hooks/use-church-branding";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SplashPage() {
  const { churchSlug } = useParams<{ churchSlug: string }>();

  // Try church_partners_public first, then fall back to outreach_leads by ID
  const { data: church, isLoading: loadingChurch } = useQuery({
    queryKey: ["splash-church", churchSlug],
    queryFn: async () => {
      // 1. Try church_partners_public by slug
      const { data } = await (supabase
        .from("church_partners_public" as any)
        .select("name, slug, logo_url, custom_bot_name, primary_color, secondary_color")
        .eq("slug", churchSlug!)
        .maybeSingle() as any);
      if (data) return { ...data, source: "partner" };

      // 2. Try outreach_leads by ID (for prospect splash pages)
      const { data: lead } = await supabase
        .from("outreach_leads")
        .select("id, church_name, logo_url, primary_color, secondary_color, screenshot_url, website_score")
        .eq("id", churchSlug!)
        .maybeSingle();
      if (lead) {
        return {
          name: lead.church_name,
          slug: lead.id,
          logo_url: lead.logo_url,
          custom_bot_name: null,
          primary_color: lead.primary_color,
          secondary_color: lead.secondary_color,
          screenshot_url: lead.screenshot_url,
          website_score: lead.website_score,
          source: "lead",
        };
      }

      return null;
    },
    enabled: !!churchSlug,
  });

  if (loadingChurch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Lade…</div>
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

  const primaryColor = church.primary_color || "#C8883A";
  const secondaryColor = church.secondary_color || "#1a5c5c";
  const botName = church.custom_bot_name || "BibleBot";
  const appUrl = church.source === "partner"
    ? `https://biblebot.life?church=${church.slug}&utm_source=splash&utm_medium=qr`
    : `https://biblebot.life/widget-preview/${church.slug}?utm_source=splash&utm_medium=prospect`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 print:p-4"
      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
    >
      {/* Church Logo */}
      {church.logo_url && (
        <img
          src={church.logo_url}
          alt={church.name}
          className="h-20 w-20 rounded-full object-cover ring-4 ring-white/20 mb-6 print:h-24 print:w-24"
        />
      )}

      {/* Bot Name */}
      <h1 className="text-3xl font-bold text-white mb-1 text-center print:text-4xl">
        {botName}
      </h1>
      <p className="text-white/70 text-sm mb-1">{church.name}</p>
      <p className="text-white/80 mb-8 text-center">
        Dein persönlicher Bibel-Begleiter
      </p>

      {/* Interactive Demo Preview for Leads */}
      {church.source === "lead" && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-8 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Live-Vorschau</span>
          </div>
          <div className="bg-white rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <div className="px-3 py-1.5 rounded-2xl rounded-br-sm text-white text-sm" style={{ background: primaryColor }}>
                Was sagt die Bibel über Hoffnung?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded-2xl rounded-bl-sm bg-slate-100 text-slate-800 text-sm max-w-[85%]">
                «Der Gott der Hoffnung erfülle euch mit aller Freude und Frieden…» – Römer 15,13
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button
              size="lg"
              className="rounded-full text-white shadow-lg w-full"
              style={{ background: primaryColor }}
              onClick={() => window.open(appUrl, "_blank")}
            >
              {botName} jetzt ausprobieren
            </Button>
          </div>
        </div>
      )}

      {/* QR Code for Partners */}
      {church.source === "partner" && (
        <>
          <div className="bg-white p-5 rounded-2xl shadow-xl mb-6">
            <BrandedQRCode value={appUrl} size={200} logoUrl={church.logo_url || undefined} />
          </div>
          <p className="text-white/60 text-sm text-center max-w-xs">
            Scanne den Code oder besuche
            <br />
            <strong className="text-white/90">{appUrl}</strong>
          </p>
        </>
      )}

      {/* Website Score Badge for Leads */}
      {church.source === "lead" && church.website_score != null && (
        <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm">
          Aktueller Website-Score: <strong>{church.website_score}/10</strong> — wir können das verbessern!
        </div>
      )}

      <p className="mt-10 text-white/30 text-xs print:hidden">
        Diese Seite kann als Flyer/Print-Material gedruckt werden (Ctrl+P)
      </p>
    </div>
  );
}

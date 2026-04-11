import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandedQRCode } from "@/components/BrandedQRCode";

export default function SplashPage() {
  const { churchSlug } = useParams<{ churchSlug: string }>();

  const { data: church, isLoading } = useQuery({
    queryKey: ["splash-church", churchSlug],
    queryFn: async () => {
      const { data } = await (supabase
        .from("church_partners_public" as any)
        .select("name, slug, logo_url, custom_bot_name, primary_color, secondary_color")
        .eq("slug", churchSlug!)
        .maybeSingle() as any);
      return data;
    },
    enabled: !!churchSlug,
  });

  if (isLoading) {
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
  const appUrl = `https://biblebot.life?church=${church.slug}`;

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

      {/* QR Code */}
      <div className="bg-white p-5 rounded-2xl shadow-xl mb-6">
        <BrandedQRCode value={appUrl} size={200} logoUrl={church.logo_url || undefined} />
      </div>

      <p className="text-white/60 text-sm text-center max-w-xs">
        Scanne den Code oder besuche
        <br />
        <strong className="text-white/90">{appUrl}</strong>
      </p>

      {/* Print hint */}
      <p className="mt-10 text-white/30 text-xs print:hidden">
        Diese Seite kann als Flyer/Print-Material gedruckt werden (Ctrl+P)
      </p>
    </div>
  );
}

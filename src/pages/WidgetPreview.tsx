import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hexToHsl } from "@/hooks/use-church-branding";
import { useState, useEffect } from "react";
import { MessageCircle, Send, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_MESSAGES = [
  { role: "user", text: "Was sagt die Bibel über Hoffnung?" },
  { role: "bot", text: "Die Bibel spricht an vielen Stellen von Hoffnung. In Römer 15,13 heisst es: «Der Gott der Hoffnung aber erfülle euch mit aller Freude und mit Frieden im Glauben, damit ihr überreich seid in der Hoffnung durch die Kraft des Heiligen Geistes.»" },
  { role: "user", text: "Danke! Gibt es noch mehr?" },
  { role: "bot", text: "Natürlich! Jeremia 29,11: «Denn ich kenne die Pläne, die ich für euch habe – Pläne des Heils und nicht des Unheils, euch eine Zukunft und eine Hoffnung zu geben.» 🙏" },
];

function trackEvent(leadId: string, variant: string, eventType: string) {
  supabase.from("ab_test_events" as any).insert({
    lead_id: leadId,
    variant,
    event_type: eventType,
  } as any).then(() => {});
}

export default function WidgetPreview() {
  const { leadId } = useParams<{ leadId: string }>();
  const [variant, setVariant] = useState<"original" | "alternative">("original");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["widget-preview-lead", leadId],
    queryFn: async () => {
      const { data } = await (supabase
        .from("outreach_leads")
        .select("church_name, primary_color, secondary_color, text_color, logo_url, screenshot_url, ab_variant_color, scraped_branding, website_score")
        .eq("id", leadId!)
        .maybeSingle() as any);
      return data;
    },
    enabled: !!leadId,
  });

  useEffect(() => {
    if (leadId) {
      trackEvent(leadId, variant, "view");
    }
  }, [leadId, variant]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Lade Vorschau…</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Vorschau nicht gefunden.</p>
      </div>
    );
  }

  const primaryColor = variant === "original"
    ? (lead.primary_color || "#C8883A")
    : (lead.ab_variant_color || lead.primary_color || "#C8883A");
  const secondaryColor = lead.secondary_color || "#1a5c5c";
  const textColor = lead.text_color || "#1a1a1a";
  const primaryHsl = hexToHsl(primaryColor);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {lead.logo_url && (
              <img src={lead.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: textColor }}>
                {lead.church_name}
              </h1>
              <p className="text-sm text-muted-foreground">Widget-Vorschau für BibleBot</p>
            </div>
          </div>
          {lead.website_score != null && (
            <div className="text-sm px-3 py-1 rounded-full font-medium"
              style={{
                background: lead.website_score >= 7 ? "#dcfce7" : lead.website_score >= 5 ? "#fef9c3" : "#fee2e2",
                color: lead.website_score >= 7 ? "#166534" : lead.website_score >= 5 ? "#854d0e" : "#991b1b",
              }}>
              Design-Score: {lead.website_score}/10
            </div>
          )}
        </div>

        {/* A/B Toggle */}
        {lead.ab_variant_color && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Farbvariante:</span>
            <Button
              variant={variant === "original" ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant("original")}
              style={variant === "original" ? { background: lead.primary_color || undefined } : {}}
            >
              Original
            </Button>
            <Button
              variant={variant === "alternative" ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant("alternative")}
              style={variant === "alternative" ? { background: lead.ab_variant_color || undefined } : {}}
            >
              Alternative
            </Button>
            <div className="flex gap-2 ml-auto">
              <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: lead.primary_color || "#ccc" }} title="Original" />
              <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: lead.ab_variant_color || "#ccc" }} title="Alternative" />
            </div>
          </div>
        )}
      </div>

      {/* Widget Preview */}
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Widget Header */}
          <div className="p-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            {lead.logo_url && (
              <img src={lead.logo_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30" />
            )}
            <div>
              <h2 className="text-white font-semibold text-sm">BibleBot</h2>
              <p className="text-white/70 text-xs">Dein Bibel-Begleiter</p>
            </div>
            <MessageCircle className="ml-auto text-white/70 h-5 w-5" />
          </div>

          {/* Chat Messages */}
          <div className="bg-white dark:bg-slate-800 p-4 space-y-3 min-h-[300px]">
            {DEMO_MESSAGES.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                  }`}
                  style={msg.role === "user" ? { background: primaryColor } : {}}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="Frage zur Bibel stellen…"
              className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-full px-4 py-2 text-sm outline-none"
              readOnly
            />
            <button
              className="p-2 rounded-full text-white"
              style={{ background: primaryColor }}
              onClick={() => leadId && trackEvent(leadId, variant, "cta_click")}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Button
            size="lg"
            className="rounded-full text-white shadow-lg"
            style={{ background: primaryColor }}
            onClick={() => leadId && trackEvent(leadId, variant, "cta_click")}
          >
            BibleBot für {lead.church_name} aktivieren
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Kostenlos starten · Keine Kreditkarte nötig</p>
        </div>
      </div>

      {/* Screenshot */}
      {lead.screenshot_url && (
        <div className="max-w-2xl mx-auto mt-10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Aktuelle Website</h3>
          <img src={lead.screenshot_url} alt="Website Screenshot" className="rounded-lg shadow-md w-full" />
        </div>
      )}
    </div>
  );
}

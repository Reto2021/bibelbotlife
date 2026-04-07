import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist BibelBot – ein einfühlsamer, weiser und ermutigender Begleiter für Menschen, die in der Bibel nach Orientierung, Trost und Inspiration suchen.

## Deine Identität
- Du sprichst Deutsch (Schweiz). Verwende nie "ß", immer "ss".
- Du zitierst bevorzugt aus der Zürcher Bibel, Lutherbibel (2017) oder Einheitsübersetzung.
- Du bist ökumenisch orientiert und respektierst alle christlichen Traditionen.
- Du bist kein Ersatz für seelsorgerische Beratung oder Therapie.

## Biblisches Wissen
- Du kennst die Bibel umfassend: Altes und Neues Testament, Psalmen, Weisheitsliteratur, Evangelien, Briefe.
- Du ordnest Verse in ihren historischen und theologischen Kontext ein.
- Du erklärst verständlich, ohne zu vereinfachen.
- Bei kontroversen Auslegungen zeigst du verschiedene Perspektiven auf.

## Positive Psychology Guardrails
Du integrierst wissenschaftlich fundierte Erkenntnisse der Positiven Psychologie:

### PERMA-Modell (Martin Seligman)
- **P**ositive Emotionen: Fördere Dankbarkeit, Hoffnung und Freude durch passende Bibelstellen.
- **E**ngagement: Ermutige zur aktiven Auseinandersetzung mit dem Glauben.
- **R**elationships: Betone den Wert von Gemeinschaft und Nächstenliebe.
- **M**eaning: Hilf bei der Sinnfindung durch biblische Weisheit.
- **A**ccomplishment: Feiere Fortschritte im Glauben, egal wie klein.

### Resilienz & Sinnfindung (Viktor Frankl)
- In schwierigen Zeiten: Validiere Gefühle zuerst, dann biete biblische Perspektive.
- Vermeide toxische Positivität ("Das wird schon!"). Stattdessen: ehrliche Begleitung.

### Dankbarkeitsforschung (Robert Emmons)
- Rege regelmässige Dankbarkeitspraxis an, gestützt durch Psalmen und Loblieder.

### Vergebungspsychologie (Everett Worthington)
- Bei Themen wie Vergebung: REACH-Modell als Rahmen, biblisch untermauert.

## Seelsorgerische Leitlinien
1. **Sicherheit zuerst**: Bei Suizidgedanken, Gewalt oder akuten Krisen → sofort an professionelle Hilfe verweisen (Dargebotene Hand 143, Pro Juventute 147).
2. **Keine Diagnosen**: Stelle keine psychologischen oder medizinischen Diagnosen.
3. **Kein Urteil**: Verurteile nie. Begegne jedem Menschen mit Würde und Respekt.
4. **Grenzen kennen**: Sage offen, wenn eine Frage professionelle Beratung erfordert.
5. **Empathie vor Antwort**: Höre zu, bevor du antwortest. Zeige Verständnis.

## Antwortformat
- Beginne mit Empathie oder Bezug zur Frage.
- Nenne relevante Bibelstellen mit Quellenangabe.
- Gib eine verständliche Einordnung.
- Schliesse mit einem ermutigenden Impuls oder Gebet.
- Halte Antworten fokussiert (ca. 200-400 Wörter).
- Verwende Markdown für Struktur.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte später erneut versuchen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "KI-Fehler aufgetreten" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("bibelbot-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

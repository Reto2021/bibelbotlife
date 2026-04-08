import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Fix common AI spelling mistakes: wrong umlaut substitutions, sz→ss, etc.
function fixSpelling(text: string): string {
  const wordFixes: [RegExp, string][] = [
    [/\b([Ff])uell/g, '$1üll'], [/\b([Ee])rfuell/g, '$1rfüll'],
    [/\b([Gg])efuehl/g, '$1efühl'], [/\b([Ff])uehr/g, '$1ühr'],
    [/\b([Ww])uerdig/g, '$1ürdig'], [/\b([Ww])uensch/g, '$1ünsch'],
    [/\b([Gg])lueck/g, '$1lück'], [/\b([Zz])urueck/g, '$1urück'],
    [/\b([Ss])tueck/g, '$1tück'], [/\b([Uu])ebung/g, '$1bung'],
    [/\b([Uu])eber(?!all)/g, '$1ber'], [/\b([Gg])uet/g, '$1üt'],
    [/\b([Mm])uede/g, '$1üde'], [/\b([Mm])uess/g, '$1üss'],
    [/\b([Ss])uend/g, '$1ünd'], [/\b([Tt])uer(?!k)/g, '$1ür'],
    [/\b([Nn])uetz/g, '$1ütz'], [/\b([Pp])ruef/g, '$1rüf'],
    [/\b([Ww])uerd/g, '$1ürd'], [/\b([Ss])pueren/g, '$1püren'],
    [/\b([Ff])uer\b/g, '$1ür'], [/\b([Nn])atuerlich/g, '$1atürlich'],
    [/\b([Ee])rzaehl/g, '$1rzähl'], [/\b([Gg])espraech/g, '$1espräch'],
    [/\b([Nn])aechst/g, '$1ächst'], [/\b([Tt])aeglich/g, '$1äglich'],
    [/\b([Ss])paet/g, '$1pät'], [/\b([Ss])taerk/g, '$1tärk'],
    [/\b([Gg])naed/g, '$1näd'], [/\b([Ww])aer/g, '$1är'],
    [/\b([Hh])oer/g, '$1ör'], [/\b([Ss])choepf/g, '$1chöpf'],
    [/\b([Ss])choen/g, '$1chön'], [/\b([Gg])roess/g, '$1röss'],
    [/\b([Tt])roest/g, '$1röst'], [/\b([Vv])erheisz/g, '$1erheiss'],
    [/sz(?=[uo]ng)/g, 'ss'], [/ß/g, 'ss'],
  ];
  let result = text;
  for (const [pattern, replacement] of wordFixes) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du generierst einen täglichen biblischen Impuls. Antworte AUSSCHLIESSLICH im JSON-Format (ohne Markdown-Codeblöcke):

{
  "topic": "Kurzes Thema (2-4 Wörter)",
  "verse": "Exaktes Bibelzitat in Anführungszeichen",
  "reference": "Buch Kapitel,Vers (Übersetzung)",
  "teaser": "Ein packender Satz (max 15 Wörter), der neugierig macht und zum Klicken einlädt",
  "context": "Warum ist das heute relevant? (1-2 Sätze, alltagsnah)"
}

Regeln:
- Verwende kein "ß", immer "ss" (Schweizer Deutsch).
- Verwende IMMER korrekte Umlaute: ä, ö, ü, Ä, Ö, Ü. NIEMALS ae, oe, ue als Ersatz. NIEMALS "sz" statt "ss". Beispiele: "erfüllt" (NICHT "erfuellt"), "Verheissung" (NICHT "Verheiszung"), "fühlt" (NICHT "fuehlt"), "schöpferisch" (NICHT "schoepferisch"), "Grösse" (NICHT "Groesse").
- Zitiere exakt aus Zürcher Bibel, Lutherbibel 2017 oder Einheitsübersetzung 2016.
- Nenne immer die Übersetzung.
- Wähle Themen die berühren: Mut, Zweifel, Liebe, Gerechtigkeit, Hoffnung, Vergebung, Identität, Angst, Dankbarkeit, Berufung.
- Der Teaser soll neugierig machen – wie eine Überschrift, die man anklicken MUSS.
- Beziehe dich auf christliche Feiertage wenn einer nahe ist (±3 Tage).
- Decke Altes UND Neues Testament ab – wechsle ab.

WICHTIG – Grammatikregeln für den Teaser:
- Der Teaser MUSS grammatikalisch korrektes Schweizer Hochdeutsch sein.
- Natürliche Satzstellung verwenden: Subjekt-Verb-Objekt.
- KEINE invertierten Genitiv-Konstruktionen wie "Vergessen Gottes" oder "Lohnen des Vertrauens".
- Fragesätze beginnen mit dem Verb oder einem Fragewort (Wer, Was, Warum, Wie, Kann, Hat, Ist).
- GUTE Teaser-Beispiele: "Vergibt Gott wirklich alles?", "Warum Vergebung dein Leben verändert", "Gott vergisst – aber wie geht das?", "Drei Worte, die alles verändern", "Was passiert, wenn du loslässt?", "Warum lohnt sich Vertrauen?"
- SCHLECHTE Teaser (NIEMALS so schreiben): "Vergessen Gottes deine Fehler wirklich?", "Lohnen des Vertrauens sich?", "Verändern Gottes Worte alles?"
- Prüfe jeden Teaser: Würde ein Schweizer diesen Satz natürlich so sagen? Wenn nein, formuliere um.`;

// Major Christian holidays (approximate, some move yearly)
function getChurchContext(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Fixed holidays
  if (month === 12 && day >= 1 && day <= 24) return "Adventszeit – Vorbereitung auf Weihnachten";
  if (month === 12 && (day === 25 || day === 26)) return "Weihnachten – Geburt Jesu Christi";
  if (month === 12 && day === 31) return "Silvester / Jahreswechsel";
  if (month === 1 && day === 1) return "Neujahr – Neuer Anfang";
  if (month === 1 && day === 6) return "Dreikönigstag / Epiphanias";
  if (month === 3 && day === 19) return "Josefstag";
  if (month === 8 && day === 1) return "Schweizer Nationalfeiertag";
  if (month === 8 && day === 15) return "Mariä Himmelfahrt";
  if (month === 11 && day === 1) return "Allerheiligen";
  if (month === 11 && day >= 20) return "Ewigkeitssonntag / Totengedenken naht";

  // Seasonal context
  if (month >= 3 && month <= 4) return "Frühling / mögliche Fastenzeit oder Osterzeit";
  if (month === 5) return "Auffahrt / Pfingsten naht";
  if (month === 6) return "Pfingstzeit / Sommeranfang";

  // Sunday
  if (dayOfWeek === 0) return "Sonntag – Tag der Ruhe und Besinnung";

  return "Normaler Wochentag";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const churchContext = getChurchContext(now);
    const weekday = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][now.getDay()];

    const userPrompt = `Heute ist ${weekday}, ${dateStr}. Kirchlicher Kontext: ${churchContext}. Generiere einen passenden täglichen Impuls.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let impulse;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      impulse = JSON.parse(cleaned);
      // Fix spelling in all text fields
      for (const key of ['topic', 'verse', 'teaser', 'context']) {
        if (impulse[key]) impulse[key] = fixSpelling(impulse[key]);
      }
      impulse.date = dateStr;
    } catch {
      console.error("Failed to parse impulse:", content);
      // Fallback
      impulse = {
        topic: "Hoffnung",
        verse: "«Denn ich weiss wohl, was ich für Gedanken über euch habe, spricht der Herr: Gedanken des Friedens und nicht des Leides.»",
        reference: "Jeremia 29,11 (Lutherbibel 2017)",
        teaser: "Gott hat einen Plan – auch wenn du ihn noch nicht siehst",
        context: "Manchmal fühlt sich das Leben planlos an. Dieser Vers erinnert daran, dass es eine grössere Perspektive gibt.",
        date: dateStr,
      };
    }

    return new Response(JSON.stringify(impulse), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("daily-impulse error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Issues short-lived tokens for OpenAI Realtime (WebRTC voice) sessions.
// The system prompt is set here on the backend so the BibelBot methodology
// (PERMA, Logotherapy, gratitude, biblical wisdom) is always applied.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VOICE_SYSTEM_PROMPT = `Du bist BibleBot – ein einfühlsamer, weiser Begleiter im **Voice-Modus** (gesprochenes Gespräch).

## WICHTIGE SPRACH-REGELN (Voice)
- Antworte IMMER in **Schweizer Hochdeutsch** (kein ß, immer "ss"; "Velo", "Tram", "parkieren" sind ok).
- Sprich **kurz, warm, gesprächig** – wie ein guter Freund am Telefon. Ein bis drei kurze Sätze pro Antwort.
- KEINE Aufzählungen, KEINE Markdown-Symbole (kein *, kein -, keine Überschriften). Reines gesprochenes Deutsch.
- Wenn du eine Bibelstelle erwähnst, sprich sie natürlich aus: "Im Johannesevangelium, Kapitel 3, Vers 16, steht..." – NICHT "Joh 3,16".
- Pausen sind erlaubt. Stille auch.

## DEINE ROLLE
Du bist Seelsorger und Coach. Du verbindest:
- **Bibel** (5 Übersetzungen: Lutherbibel, Zürcher, Einheitsübersetzung, Schlachter, Elberfelder)
- **PERMA-Modell** (Seligman): Positive Emotionen, Engagement, Beziehungen, Sinn, Erfolg
- **Logotherapie** (Frankl): Sinnsuche, Selbsttranszendenz
- **Dankbarkeitspraxis** und **Vergebung**
- **Sokratisches Fragen**: stell offene, tiefe Fragen statt fertige Antworten zu geben

## STIL
- Höre zuerst, frag nach, validiere Gefühle.
- Stell EINE gute Frage am Ende – keine Liste von Fragen.
- Sei ehrlich und auch herausfordernd, wenn nötig. Nicht nur tröstend.
- Vermeide religiöse Floskeln. Sprich menschlich.
- Wenn der Mensch in einer Krise ist (Suizidgedanken, Gewalt, Missbrauch): ermutige professionelle Hilfe (Tel. 143 Dargebotene Hand in der Schweiz).

## START
Wenn das Gespräch beginnt, begrüsse kurz und frag offen, was den Menschen gerade beschäftigt. Maximal zwei Sätze.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let voice = "alloy";
    try {
      const body = await req.json();
      if (body?.voice && typeof body.voice === "string") voice = body.voice;
    } catch {
      // no body is fine
    }

    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice,
        instructions: VOICE_SYSTEM_PROMPT,
        modalities: ["audio", "text"],
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI realtime session error:", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to create realtime session", detail: errText }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("realtime-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

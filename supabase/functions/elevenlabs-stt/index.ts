import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "deu";

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map i18n language codes to ISO 639-3 for ElevenLabs
    const langMap: Record<string, string> = {
      de: "deu", en: "eng", fr: "fra", es: "spa", it: "ita",
      pt: "por", nl: "nld", pl: "pol", ru: "rus", uk: "ukr",
      sv: "swe", da: "dan", no: "nor", fi: "fin", hu: "hun",
      cs: "ces", sk: "slk", ro: "ron", bg: "bul", hr: "hrv",
      sr: "srp", el: "ell", ko: "kor", zh: "zho", vi: "vie",
      id: "ind", sw: "swa", tl: "tgl", af: "afr", zu: "zul",
    };
    const languageCode = langMap[language] || language;

    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("language_code", languageCode);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: apiFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Transcription failed", detail: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("STT error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

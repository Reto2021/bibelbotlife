import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

/**
 * Content safety gate for user generated content (Kreuzwege photos, stories, quotes).
 * Blocks sexual/pornographic imagery and racist / hateful text.
 * Returns { allowed, categories, reason }.
 */

const MODEL = "google/gemini-3.6-flash";

const SYSTEM = `You are a strict content-safety reviewer for a Christian community app where
people upload photos of wayside crosses together with a short story or Bible quote.

Reject content in these categories:
- "sexual": nudity, pornography, sexualized bodies, sexual acts, fetish content, sexual text.
- "hate": racism, ethnic or religious slurs, xenophobia, antisemitism, dehumanizing language,
  extremist or Nazi symbols and propaganda, calls for discrimination.
- "violence": graphic gore, threats, glorification of violence, terrorism.
- "csam": any sexualized depiction of minors (always reject).
- "spam": advertising, scams, links to unrelated commercial offers.

Everything else is allowed, including crosses, churches, graveyards, landscapes, people
fully clothed, prayers, grief, and religious language of any denomination.

Answer with JSON only:
{"allowed": boolean, "categories": string[], "reason": "short explanation in German"}`;

interface Body {
  imageBase64?: string;
  imageMimeType?: string;
  texts?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      // Fail open on configuration problems so uploads are never fully blocked.
      return json({ allowed: true, categories: [], reason: "moderation unavailable" });
    }

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const texts = (body.texts ?? [])
      .filter((t) => typeof t === "string")
      .map((t) => t.slice(0, 2000))
      .filter((t) => t.trim().length > 0);

    const image = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    if (!image && texts.length === 0) {
      return json({ error: "Nothing to moderate" }, 400);
    }
    // ~8 MB of base64 is plenty for a compressed upload.
    if (image.length > 8_000_000) {
      return json({ error: "Image too large for moderation" }, 400);
    }

    const mime = /^image\/(jpeg|png|webp)$/.test(body.imageMimeType ?? "")
      ? body.imageMimeType!
      : "image/jpeg";

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text:
          "Review this submission.\n" +
          (texts.length ? `Text:\n${texts.join("\n---\n")}` : "No text provided."),
      },
    ];
    if (image) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${image}` },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return json({ allowed: true, categories: [], reason: "rate limited" });
    }
    if (res.status === 402) {
      return json({ allowed: true, categories: [], reason: "credits exhausted" });
    }
    if (!res.ok) {
      console.error("moderation gateway error", res.status, await res.text());
      return json({ allowed: true, categories: [], reason: "moderation error" });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { allowed?: boolean; categories?: string[]; reason?: string } = {};
    try {
      parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    } catch {
      console.error("moderation parse error", raw);
      return json({ allowed: true, categories: [], reason: "unparsable verdict" });
    }

    return json({
      allowed: parsed.allowed !== false,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    });
  } catch (err) {
    console.error("moderation failed", err);
    return json({ allowed: true, categories: [], reason: "moderation failed" });
  }
});

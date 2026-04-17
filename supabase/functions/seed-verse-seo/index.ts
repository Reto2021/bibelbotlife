// Seeds verse_seo_content for the TOP verses across all 38 supported languages.
// Uses Lovable AI Gateway (no API key needed). Idempotent: skips already-seeded.
// Trigger via POST with { batch?: number, languages?: string[], force?: boolean }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

const TOP_VERSES: Array<{ slug: string; book: string; chapter: number; verse: number }> = [
  { slug: "john-3-16", book: "john", chapter: 3, verse: 16 },
  { slug: "john-14-6", book: "john", chapter: 14, verse: 6 },
  { slug: "john-1-1", book: "john", chapter: 1, verse: 1 },
  { slug: "john-8-32", book: "john", chapter: 8, verse: 32 },
  { slug: "john-11-25", book: "john", chapter: 11, verse: 25 },
  { slug: "romans-8-28", book: "romans", chapter: 8, verse: 28 },
  { slug: "romans-8-38", book: "romans", chapter: 8, verse: 38 },
  { slug: "romans-12-2", book: "romans", chapter: 12, verse: 2 },
  { slug: "romans-5-8", book: "romans", chapter: 5, verse: 8 },
  { slug: "romans-6-23", book: "romans", chapter: 6, verse: 23 },
  { slug: "psalms-23-1", book: "psalms", chapter: 23, verse: 1 },
  { slug: "psalms-23-4", book: "psalms", chapter: 23, verse: 4 },
  { slug: "psalms-46-10", book: "psalms", chapter: 46, verse: 10 },
  { slug: "psalms-119-105", book: "psalms", chapter: 119, verse: 105 },
  { slug: "psalms-91-1", book: "psalms", chapter: 91, verse: 1 },
  { slug: "psalms-27-1", book: "psalms", chapter: 27, verse: 1 },
  { slug: "psalms-37-4", book: "psalms", chapter: 37, verse: 4 },
  { slug: "psalms-139-14", book: "psalms", chapter: 139, verse: 14 },
  { slug: "philippians-4-13", book: "philippians", chapter: 4, verse: 13 },
  { slug: "philippians-4-6", book: "philippians", chapter: 4, verse: 6 },
  { slug: "philippians-4-7", book: "philippians", chapter: 4, verse: 7 },
  { slug: "proverbs-3-5", book: "proverbs", chapter: 3, verse: 5 },
  { slug: "proverbs-3-6", book: "proverbs", chapter: 3, verse: 6 },
  { slug: "matthew-6-33", book: "matthew", chapter: 6, verse: 33 },
  { slug: "matthew-11-28", book: "matthew", chapter: 11, verse: 28 },
  { slug: "matthew-28-19", book: "matthew", chapter: 28, verse: 19 },
  { slug: "matthew-7-7", book: "matthew", chapter: 7, verse: 7 },
  { slug: "jeremiah-29-11", book: "jeremiah", chapter: 29, verse: 11 },
  { slug: "isaiah-40-31", book: "isaiah", chapter: 40, verse: 31 },
  { slug: "isaiah-41-10", book: "isaiah", chapter: 41, verse: 10 },
  { slug: "1-corinthians-13-4", book: "1-corinthians", chapter: 13, verse: 4 },
  { slug: "1-corinthians-13-13", book: "1-corinthians", chapter: 13, verse: 13 },
  { slug: "galatians-5-22", book: "galatians", chapter: 5, verse: 22 },
  { slug: "ephesians-2-8", book: "ephesians", chapter: 2, verse: 8 },
  { slug: "hebrews-11-1", book: "hebrews", chapter: 11, verse: 1 },
  { slug: "joshua-1-9", book: "joshua", chapter: 1, verse: 9 },
  { slug: "1-john-4-8", book: "1-john", chapter: 4, verse: 8 },
  { slug: "1-john-1-9", book: "1-john", chapter: 1, verse: 9 },
  { slug: "revelation-21-4", book: "revelation", chapter: 21, verse: 4 },
];

const LANG_NAME: Record<string, string> = {
  de: "German", en: "English", fr: "French", es: "Spanish", it: "Italian",
  pl: "Polish", cs: "Czech", pt: "Portuguese", nl: "Dutch", ro: "Romanian",
  da: "Danish", no: "Norwegian", sv: "Swedish", fi: "Finnish", el: "Greek",
  hr: "Croatian", sr: "Serbian", hu: "Hungarian", sk: "Slovak", bg: "Bulgarian",
  ru: "Russian", uk: "Ukrainian", ka: "Georgian", hy: "Armenian", ko: "Korean",
  tl: "Tagalog", id: "Indonesian", vi: "Vietnamese", zh: "Chinese (Simplified)",
  sw: "Swahili", am: "Amharic", af: "Afrikaans", yo: "Yoruba", ig: "Igbo",
  zu: "Zulu", ht: "Haitian Creole", ar: "Arabic", he: "Hebrew",
};

function buildPrompt(refLabel: string, lang: string) {
  const langName = LANG_NAME[lang] || lang;
  return `You are a thoughtful, ecumenical Bible companion writing for a wide audience.
Generate SEO-optimized content for the verse "${refLabel}" entirely in ${langName}.

Return ONLY a JSON object (no markdown fences) with this exact shape:
{
  "title": "Short descriptive title (max 70 chars), in ${langName}",
  "meta_description": "Compelling meta description (max 160 chars), in ${langName}",
  "context": "2-3 short paragraphs on historical/biblical context: who wrote it, to whom, what surrounds it. In ${langName}.",
  "reflection": "2-3 short paragraphs on practical meaning for life today, warm and inviting tone, no preaching. In ${langName}.",
  "related_topics": ["max 5 short topic slugs in english kebab-case, e.g. love, hope, forgiveness"]
}

Be respectful of all denominations. Do not quote the verse text itself (we display it separately). Avoid the word "AI".`;
}

async function callLovableAI(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You generate concise, warm SEO content for Bible verses. Always return valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("rate-limit");
  if (res.status === 402) throw new Error("payment-required");
  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    // strip markdown fences if model added them anyway
    const stripped = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(stripped);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchLimit: number = Math.min(body.batch ?? 20, 80);
    const languages: string[] = Array.isArray(body.languages) && body.languages.length
      ? body.languages.filter((l: string) => SUPPORTED_LANGS.includes(l))
      : SUPPORTED_LANGS;
    const force: boolean = !!body.force;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Array<{ slug: string; lang: string; status: string; error?: string }> = [];
    let processed = 0;

    outer: for (const verse of TOP_VERSES) {
      for (const lang of languages) {
        if (processed >= batchLimit) break outer;

        if (!force) {
          const { data: existing } = await supabase
            .from("verse_seo_content")
            .select("id")
            .eq("reference_slug", verse.slug)
            .eq("language", lang)
            .maybeSingle();
          if (existing) {
            results.push({ slug: verse.slug, lang, status: "skipped" });
            continue;
          }
        }

        const refLabel = `${verse.book.replace(/-/g, " ")} ${verse.chapter}:${verse.verse}`;
        try {
          const ai = await callLovableAI(buildPrompt(refLabel, lang));
          const topics = Array.isArray(ai.related_topics)
            ? ai.related_topics.slice(0, 5).map((s: string) => String(s).toLowerCase().replace(/\s+/g, "-"))
            : [];

          const { error } = await supabase.from("verse_seo_content").upsert(
            {
              reference_slug: verse.slug,
              language: lang,
              book: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              title: String(ai.title || "").slice(0, 200),
              meta_description: String(ai.meta_description || "").slice(0, 200),
              context: String(ai.context || ""),
              reflection: String(ai.reflection || ""),
              related_topics: topics,
              is_featured: lang === "de" || lang === "en",
            },
            { onConflict: "reference_slug,language" }
          );
          if (error) throw error;

          processed++;
          results.push({ slug: verse.slug, lang, status: "created" });
          // small delay to avoid hammering AI gateway
          await new Promise((r) => setTimeout(r, 250));
        } catch (e: any) {
          results.push({ slug: verse.slug, lang, status: "error", error: e?.message ?? String(e) });
          if (e?.message === "rate-limit" || e?.message === "payment-required") break outer;
        }
      }
    }

    return new Response(
      JSON.stringify({ processed, total: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

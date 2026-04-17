// Seeds seo_topics (thematic hubs) in all 38 supported languages.
// POST { topics?: string[], languages?: string[], batch?: number, force?: boolean }

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

// 30 core topics — each with English seed-question and a few canonical verse slugs
const CORE_TOPICS: Array<{ slug: string; seed: string; verses: string[] }> = [
  { slug: "love", seed: "What does the Bible say about love?", verses: ["1-corinthians-13-4", "1-john-4-8", "john-3-16"] },
  { slug: "hope", seed: "What does the Bible say about hope?", verses: ["jeremiah-29-11", "romans-15-13", "hebrews-11-1"] },
  { slug: "faith", seed: "What does the Bible say about faith?", verses: ["hebrews-11-1", "ephesians-2-8", "romans-10-17"] },
  { slug: "forgiveness", seed: "What does the Bible say about forgiveness?", verses: ["1-john-1-9", "matthew-6-14", "ephesians-4-32"] },
  { slug: "fear", seed: "What does the Bible say about fear and anxiety?", verses: ["isaiah-41-10", "philippians-4-6", "psalms-23-4"] },
  { slug: "anxiety", seed: "What does the Bible say about anxiety?", verses: ["philippians-4-6", "matthew-6-25", "1-peter-5-7"] },
  { slug: "peace", seed: "What does the Bible say about peace?", verses: ["philippians-4-7", "john-14-27", "isaiah-26-3"] },
  { slug: "joy", seed: "What does the Bible say about joy?", verses: ["philippians-4-4", "psalms-16-11", "nehemiah-8-10"] },
  { slug: "grief", seed: "What does the Bible say about grief and loss?", verses: ["matthew-5-4", "psalms-34-18", "revelation-21-4"] },
  { slug: "death", seed: "What does the Bible say about death?", verses: ["john-11-25", "1-corinthians-15-55", "revelation-21-4"] },
  { slug: "marriage", seed: "What does the Bible say about marriage?", verses: ["genesis-2-24", "ephesians-5-25", "1-corinthians-13-4"] },
  { slug: "prayer", seed: "What does the Bible say about prayer?", verses: ["matthew-6-9", "philippians-4-6", "1-thessalonians-5-17"] },
  { slug: "purpose", seed: "What does the Bible say about purpose and calling?", verses: ["jeremiah-29-11", "romans-8-28", "ephesians-2-10"] },
  { slug: "money", seed: "What does the Bible say about money?", verses: ["1-timothy-6-10", "matthew-6-24", "philippians-4-19"] },
  { slug: "work", seed: "What does the Bible say about work?", verses: ["colossians-3-23", "ecclesiastes-3-22", "proverbs-16-3"] },
  { slug: "patience", seed: "What does the Bible say about patience?", verses: ["james-1-4", "romans-12-12", "psalms-37-7"] },
  { slug: "trust", seed: "What does the Bible say about trust?", verses: ["proverbs-3-5", "psalms-56-3", "isaiah-26-4"] },
  { slug: "gratitude", seed: "What does the Bible say about gratitude?", verses: ["1-thessalonians-5-18", "psalms-100-4", "colossians-3-17"] },
  { slug: "humility", seed: "What does the Bible say about humility?", verses: ["philippians-2-3", "james-4-10", "proverbs-22-4"] },
  { slug: "wisdom", seed: "What does the Bible say about wisdom?", verses: ["proverbs-3-5", "james-1-5", "proverbs-9-10"] },
  { slug: "loneliness", seed: "What does the Bible say about loneliness?", verses: ["psalms-25-16", "deuteronomy-31-6", "matthew-28-20"] },
  { slug: "depression", seed: "What does the Bible say about depression?", verses: ["psalms-34-18", "psalms-42-11", "isaiah-41-10"] },
  { slug: "healing", seed: "What does the Bible say about healing?", verses: ["isaiah-53-5", "james-5-15", "psalms-147-3"] },
  { slug: "salvation", seed: "What does the Bible say about salvation?", verses: ["john-3-16", "ephesians-2-8", "romans-10-9"] },
  { slug: "holy-spirit", seed: "What does the Bible say about the Holy Spirit?", verses: ["john-14-26", "galatians-5-22", "acts-2-4"] },
  { slug: "creation", seed: "What does the Bible say about creation?", verses: ["genesis-1-1", "psalms-19-1", "colossians-1-16"] },
  { slug: "family", seed: "What does the Bible say about family?", verses: ["proverbs-22-6", "ephesians-6-4", "joshua-24-15"] },
  { slug: "children", seed: "What does the Bible say about raising children?", verses: ["proverbs-22-6", "deuteronomy-6-7", "psalms-127-3"] },
  { slug: "friendship", seed: "What does the Bible say about friendship?", verses: ["proverbs-17-17", "proverbs-27-17", "john-15-13"] },
  { slug: "guidance", seed: "How does the Bible guide decisions?", verses: ["psalms-119-105", "proverbs-3-6", "james-1-5"] },
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

function buildPrompt(seed: string, lang: string) {
  const langName = LANG_NAME[lang] || lang;
  return `You are a thoughtful, ecumenical Bible companion writing for a wide audience.
Generate SEO-optimized topical hub content. Question: "${seed}". Write entirely in ${langName}.

Return ONLY a JSON object (no markdown fences):
{
  "title": "Compelling H1 title (max 70 chars) in ${langName}",
  "meta_description": "Compelling meta description (max 160 chars) in ${langName}",
  "intro": "1 short paragraph (~50 words) hooking the reader, in ${langName}",
  "body_md": "3-5 paragraphs of warm, practical insight grounded in scripture. Plain text with double line-breaks between paragraphs. No markdown headings. In ${langName}.",
  "faqs": [
    {"question": "...", "answer": "1-3 sentences"},
    {"question": "...", "answer": "1-3 sentences"},
    {"question": "...", "answer": "1-3 sentences"}
  ]
}

Tone: warm, ecumenical, never preachy, never use the word "AI". Speak directly to the reader.`;
}

async function callLovableAI(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You generate warm, SEO-optimized topical Bible content. Always return valid JSON only." },
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
    const stripped = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(stripped);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchLimit: number = Math.min(body.batch ?? 15, 60);
    const languages: string[] = Array.isArray(body.languages) && body.languages.length
      ? body.languages.filter((l: string) => SUPPORTED_LANGS.includes(l))
      : SUPPORTED_LANGS;
    const onlySlugs: string[] | null = Array.isArray(body.topics) && body.topics.length ? body.topics : null;
    const force: boolean = !!body.force;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const topics = onlySlugs
      ? CORE_TOPICS.filter((t) => onlySlugs.includes(t.slug))
      : CORE_TOPICS;

    const results: Array<{ slug: string; lang: string; status: string; error?: string }> = [];
    let processed = 0;

    outer: for (const topic of topics) {
      for (const lang of languages) {
        if (processed >= batchLimit) break outer;

        if (!force) {
          const { data: existing } = await supabase
            .from("seo_topics")
            .select("id")
            .eq("slug", topic.slug)
            .eq("language", lang)
            .maybeSingle();
          if (existing) {
            results.push({ slug: topic.slug, lang, status: "skipped" });
            continue;
          }
        }

        try {
          const ai = await callLovableAI(buildPrompt(topic.seed, lang));
          const faqs = Array.isArray(ai.faqs)
            ? ai.faqs
                .filter((f: any) => f?.question && f?.answer)
                .slice(0, 6)
                .map((f: any) => ({ question: String(f.question), answer: String(f.answer) }))
            : [];

          const { error } = await supabase.from("seo_topics").upsert(
            {
              slug: topic.slug,
              language: lang,
              title: String(ai.title || "").slice(0, 200),
              meta_description: String(ai.meta_description || "").slice(0, 200),
              intro: String(ai.intro || ""),
              body_md: String(ai.body_md || ""),
              related_verses: topic.verses,
              faqs: faqs as any,
              is_published: true,
            },
            { onConflict: "slug,language" }
          );
          if (error) throw error;

          processed++;
          results.push({ slug: topic.slug, lang, status: "created" });
          await new Promise((r) => setTimeout(r, 300));
        } catch (e: any) {
          results.push({ slug: topic.slug, lang, status: "error", error: e?.message ?? String(e) });
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

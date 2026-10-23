import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}-\d{1,3}-\d{1,3}$/),
  lang: z.string().regex(/^[a-z]{2}$/),
  book_number: z.number().int().min(1).max(73),
  chapter: z.number().int().min(1).max(200),
  verse: z.number().int().min(1).max(200),
  reference: z.string().max(60),
  text: z.string().max(1200).optional(),
});

export type KeyWord = { word: string; original: string; meaning: string };
export type VerseMeaning = {
  title: string | null;
  meta_description: string | null;
  summary: string | null;
  context: string | null;
  reflection: string | null;
  key_words: KeyWord[];
  life_questions: string[];
  prayer: string | null;
  related_references: string[];
  related_topics: string[];
};

const COLS =
  "title,meta_description,context,reflection,related_references,related_topics,summary,key_words,life_questions,prayer";

function toDto(r: any): VerseMeaning {
  return {
    title: r?.title ?? null,
    meta_description: r?.meta_description ?? null,
    summary: r?.summary ?? null,
    context: r?.context ?? null,
    reflection: r?.reflection ?? null,
    key_words: Array.isArray(r?.key_words) ? r.key_words : [],
    life_questions: Array.isArray(r?.life_questions) ? r.life_questions : [],
    prayer: r?.prayer ?? null,
    related_references: r?.related_references ?? [],
    related_topics: r?.related_topics ?? [],
  };
}

/**
 * Detailed meaning for any Bible verse. Cached per verse+language; generated
 * once on first request. Only verses that exist in our Bible text are generated.
 */
export const getVerseMeaning = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<{ meaning: VerseMeaning | null; error?: string }> => {
    const { createAdminClient, serverEnv } = await import("./supabase-server.server");
    const sb = createAdminClient();
    const { slug, lang } = data;

    const { data: existing } = await sb
      .from("verse_seo_content")
      .select(COLS)
      .eq("reference_slug", slug)
      .eq("language", lang)
      .maybeSingle();
    if (existing?.summary) return { meaning: toDto(existing) };

    const { data: real } = await sb
      .from("bible_verses")
      .select("id")
      .eq("book_number", data.book_number)
      .eq("chapter", data.chapter)
      .eq("verse", data.verse)
      .limit(1);
    if (!real?.length) return { meaning: existing ? toDto(existing) : null, error: "not-found" };

    const prompt = `Explain the Bible verse "${data.reference}"${data.text ? ` ("${data.text}")` : ""} in depth.
Write entirely in the language with ISO code "${lang}". Audience: Christians without church affiliation. Warm, honest, ecumenical, no church jargon, no preaching, no pressure.${lang === "de" ? " Swiss spelling: never use ß, always ss." : ""}
Never use the words "AI" or "KI". Do not quote other verses verbatim.
Return ONLY JSON:
{"title":"max 70 chars","meta_description":"max 155 chars","summary":"1-2 sentences: core message in plain words","context":"2-3 short paragraphs: author, audience, historical setting, what comes before and after","key_words":[{"word":"key term","original":"Hebrew/Greek word, transliterated","meaning":"1-2 sentences"}],"reflection":"2-3 short paragraphs: what it can mean in everyday life today","life_questions":["3 short personal questions"],"prayer":"short honest prayer, 2-4 sentences","related_references":["3-5 related verses as english slugs, e.g. john-3-16, psalms-23-1, 1-corinthians-13-4"],"related_topics":["max 5 english kebab-case topics"]}
key_words: 2-4 items.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${serverEnv("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        console.error("verse-meaning ai", res.status, await res.text());
        return { meaning: existing ? toDto(existing) : null, error: res.status === 429 ? "rate-limit" : "ai" };
      }
      const j = await res.json();
      const raw = String(j?.choices?.[0]?.message?.content || "{}")
        .replace(/^```(json)?/i, "")
        .replace(/```$/, "")
        .trim();
      const ai = JSON.parse(raw);
      const fix = (s: unknown) => (lang === "de" ? String(s ?? "").replace(/ß/g, "ss") : String(s ?? ""));
      const arr = (a: unknown, n: number): any[] => (Array.isArray(a) ? a.slice(0, n) : []);
      const ex: any = existing;

      const row = {
        reference_slug: slug,
        language: lang,
        book: slug.replace(/-\d+-\d+$/, ""),
        chapter: data.chapter,
        verse: data.verse,
        title: ex?.title || fix(ai.title).slice(0, 200),
        meta_description: ex?.meta_description || fix(ai.meta_description).slice(0, 200),
        context: ex?.context || fix(ai.context),
        reflection: ex?.reflection || fix(ai.reflection),
        summary: fix(ai.summary),
        key_words: arr(ai.key_words, 4).map((k) => ({
          word: fix(k?.word),
          original: String(k?.original ?? ""),
          meaning: fix(k?.meaning),
        })),
        life_questions: arr(ai.life_questions, 3).map(fix),
        prayer: fix(ai.prayer),
        related_references: ex?.related_references?.length
          ? ex.related_references
          : arr(ai.related_references, 5)
              .map((s) => String(s).toLowerCase())
              .filter((s) => /^[a-z0-9-]+-\d+-\d+$/.test(s)),
        related_topics: ex?.related_topics?.length
          ? ex.related_topics
          : arr(ai.related_topics, 5).map((s) => String(s).toLowerCase().replace(/\s+/g, "-")),
      };
      const { error } = await sb.from("verse_seo_content").upsert(row, { onConflict: "reference_slug,language" });
      if (error) console.error("verse-meaning upsert", error.message);
      return { meaning: toDto(row) };
    } catch (e) {
      console.error("verse-meaning", e);
      return { meaning: existing ? toDto(existing) : null, error: "failed" };
    }
  });

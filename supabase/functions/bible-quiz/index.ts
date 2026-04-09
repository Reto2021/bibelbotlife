import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = "multiple_choice", translation = "luther1912" } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get a random verse using a random offset for variety
    const randomOffset = Math.floor(Math.random() * 30000);
    const { data: verses, error } = await supabase
      .from("bible_verses")
      .select("id, book, book_number, chapter, verse, text, translation")
      .eq("translation", translation)
      .range(randomOffset, randomOffset + 99)
      .limit(100);

    // Fallback if offset is too high
    let versePool = verses;
    if (!versePool?.length) {
      const { data: fallback } = await supabase
        .from("bible_verses")
        .select("id, book, book_number, chapter, verse, text, translation")
        .eq("translation", translation)
        .limit(100);
      versePool = fallback;
    }

    if (error || !versePool?.length) {
      return new Response(JSON.stringify({ error: "Keine Verse gefunden" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick a random verse
    const randomVerse = versePool[Math.floor(Math.random() * versePool.length)];

    // Full list of Bible books for wrong-answer options
    const allBibleBooks = [
      "1. Mose","2. Mose","3. Mose","4. Mose","5. Mose","Josua","Richter","Ruth",
      "1. Samuel","2. Samuel","1. Könige","2. Könige","1. Chronik","2. Chronik",
      "Esra","Nehemia","Esther","Hiob","Psalmen","Sprüche","Prediger",
      "Hohelied","Jesaja","Jeremia","Klagelieder","Hesekiel","Daniel","Hosea",
      "Joel","Amos","Obadja","Jona","Micha","Nahum","Habakuk","Zefanja",
      "Haggai","Sacharja","Maleachi","Matthäus","Markus","Lukas","Johannes",
      "Apostelgeschichte","Römer","1. Korinther","2. Korinther","Galater",
      "Epheser","Philipper","Kolosser","1. Thessalonicher","2. Thessalonicher",
      "1. Timotheus","2. Timotheus","Titus","Philemon","Hebräer","Jakobus",
      "1. Petrus","2. Petrus","1. Johannes","2. Johannes","3. Johannes","Judas","Offenbarung"
    ];

    if (mode === "verse_guess") {
      // Mode: Show verse text, guess the book
      // Get 3 wrong book options from the full list
      const wrongBooks = allBibleBooks
        .filter(b => b !== randomVerse.book)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [...wrongBooks, randomVerse.book].sort(() => Math.random() - 0.5);

      return new Response(JSON.stringify({
        mode: "verse_guess",
        question: randomVerse.text,
        hint: `Kapitel ${randomVerse.chapter}, Vers ${randomVerse.verse}`,
        options,
        correct: randomVerse.book,
        reference: `${randomVerse.book} ${randomVerse.chapter},${randomVerse.verse}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: Multiple choice – AI generates question about the verse
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Du bist ein Bibelquiz-Generator. Erstelle eine Multiple-Choice-Frage auf Deutsch basierend auf diesem Bibelvers:

"${randomVerse.text}" (${randomVerse.book} ${randomVerse.chapter},${randomVerse.verse})

Regeln:
- Die Frage soll zum Nachdenken anregen
- 4 Antwortmöglichkeiten (A, B, C, D)
- Genau eine richtige Antwort
- Antworte AUSSCHLIESSLICH als JSON:
{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
correct = Index (0-3) der richtigen Antwort.
explanation = kurze Erklärung warum.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!aiResp.ok) {
      throw new Error(`AI error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let raw = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    
    const quiz = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      mode: "multiple_choice",
      question: quiz.question,
      options: quiz.options,
      correct: quiz.options[quiz.correct],
      correctIndex: quiz.correct,
      explanation: quiz.explanation,
      reference: `${randomVerse.book} ${randomVerse.chapter},${randomVerse.verse}`,
      verse_text: randomVerse.text,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Quiz error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Quiz generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

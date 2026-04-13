import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Book groups for difficulty-based wrong answers
const bookGroups: Record<string, string[]> = {
  pentateuch: ["1. Mose", "2. Mose", "3. Mose", "4. Mose", "5. Mose"],
  history: ["Josua", "Richter", "Ruth", "1. Samuel", "2. Samuel", "1. Könige", "2. Könige", "1. Chronik", "2. Chronik", "Esra", "Nehemia", "Esther"],
  wisdom: ["Hiob", "Psalmen", "Sprüche", "Prediger", "Hohelied"],
  majorProphets: ["Jesaja", "Jeremia", "Klagelieder", "Hesekiel", "Daniel"],
  minorProphets: ["Hosea", "Joel", "Amos", "Obadja", "Jona", "Micha", "Nahum", "Habakuk", "Zefanja", "Haggai", "Sacharja", "Maleachi"],
  gospels: ["Matthäus", "Markus", "Lukas", "Johannes"],
  acts: ["Apostelgeschichte"],
  pauline: ["Römer", "1. Korinther", "2. Korinther", "Galater", "Epheser", "Philipper", "Kolosser", "1. Thessalonicher", "2. Thessalonicher", "1. Timotheus", "2. Timotheus", "Titus", "Philemon"],
  general: ["Hebräer", "Jakobus", "1. Petrus", "2. Petrus", "1. Johannes", "2. Johannes", "3. Johannes", "Judas"],
  revelation: ["Offenbarung"],
};

const allBibleBooks = Object.values(bookGroups).flat();

// Broader categories for medium difficulty
const testament: Record<string, string[]> = {
  ot: [...bookGroups.pentateuch, ...bookGroups.history, ...bookGroups.wisdom, ...bookGroups.majorProphets, ...bookGroups.minorProphets],
  nt: [...bookGroups.gospels, ...bookGroups.acts, ...bookGroups.pauline, ...bookGroups.general, ...bookGroups.revelation],
};

function getGroupForBook(book: string): string {
  for (const [group, books] of Object.entries(bookGroups)) {
    if (books.includes(book)) return group;
  }
  return "unknown";
}

function getTestamentForBook(book: string): "ot" | "nt" {
  return testament.ot.includes(book) ? "ot" : "nt";
}

function pickWrongBooks(correctBook: string, difficulty: string): string[] {
  const correctGroup = getGroupForBook(correctBook);
  const correctTestament = getTestamentForBook(correctBook);

  let candidates: string[];

  if (difficulty === "hard") {
    // Same group first, then same testament
    const sameGroup = bookGroups[correctGroup]?.filter(b => b !== correctBook) || [];
    if (sameGroup.length >= 3) {
      candidates = sameGroup;
    } else {
      // Expand to neighboring groups in same testament
      const sameTest = testament[correctTestament].filter(b => b !== correctBook);
      candidates = [...sameGroup, ...sameTest.filter(b => !sameGroup.includes(b))];
    }
  } else if (difficulty === "medium") {
    // Same testament but different group
    const sameTest = testament[correctTestament].filter(b => b !== correctBook);
    candidates = sameTest;
  } else {
    // Easy: different testament
    const otherTestament = correctTestament === "ot" ? "nt" : "ot";
    candidates = testament[otherTestament];
  }

  // Fallback if not enough candidates
  if (candidates.length < 3) {
    candidates = allBibleBooks.filter(b => b !== correctBook);
  }

  return candidates
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = "multiple_choice", translation = "luther1912", difficulty = "medium", language = "de" } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get a random verse using a random offset for variety, filtered by language
    const randomOffset = Math.floor(Math.random() * 30000);
    const { data: verses, error } = await supabase
      .from("bible_verses")
      .select("id, book, book_number, chapter, verse, text, translation")
      .eq("translation", translation)
      .eq("language", language)
      .range(randomOffset, randomOffset + 99)
      .limit(100);

    // Fallback if offset is too high
    let versePool = verses;
    if (!versePool?.length) {
      const { data: fallback } = await supabase
        .from("bible_verses")
        .select("id, book, book_number, chapter, verse, text, translation")
        .eq("translation", translation)
        .eq("language", language)
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

    if (mode === "verse_guess") {
      const wrongBooks = pickWrongBooks(randomVerse.book, difficulty);
      const options = [...wrongBooks, randomVerse.book].sort(() => Math.random() - 0.5);

      return new Response(JSON.stringify({
        mode: "verse_guess",
        difficulty,
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

    const difficultyHint = difficulty === "easy"
      ? "Stelle eine einfache, faktische Frage."
      : difficulty === "hard"
        ? "Stelle eine anspruchsvolle Frage, die tiefes Bibelwissen erfordert. Die falschen Antworten sollen plausibel klingen."
        : "Stelle eine mittelschwere Frage.";

    const prompt = `Du bist ein Bibelquiz-Generator. Erstelle eine Multiple-Choice-Frage auf Deutsch basierend auf diesem Bibelvers:

"${randomVerse.text}" (${randomVerse.book} ${randomVerse.chapter},${randomVerse.verse})

Regeln:
- ${difficultyHint}
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
      difficulty,
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

// Edge Function: bible-extra-seed-nt
// Hintergrund-Job: lädt Kapitel für Kapitel das gesamte NT (Mt..Offb) für eine
// Liste geschützter Übersetzungen via bible-extra-fetch in bible_verses_restricted.
// Aufruf: POST { translations?: string[], start_book?: number, end_book?: number, batch_size?: number }
// Default: alle restricted-Übersetzungen mit NT, Mt(40)..Offb(66).
// Pro Aufruf werden max. batch_size Kapitel verarbeitet (Default 30), damit innerhalb
// des 150s-Timeouts. Status-Antwort enthält "next_cursor" für Folgeaufruf.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NT-Bücher mit ihren Kapitel-Anzahlen
const NT_BOOKS: { number: number; canonical: string; chapters: number }[] = [
  { number: 40, canonical: "Matthäus", chapters: 28 },
  { number: 41, canonical: "Markus", chapters: 16 },
  { number: 42, canonical: "Lukas", chapters: 24 },
  { number: 43, canonical: "Johannes", chapters: 21 },
  { number: 44, canonical: "Apostelgeschichte", chapters: 28 },
  { number: 45, canonical: "Römer", chapters: 16 },
  { number: 46, canonical: "1. Korinther", chapters: 16 },
  { number: 47, canonical: "2. Korinther", chapters: 13 },
  { number: 48, canonical: "Galater", chapters: 6 },
  { number: 49, canonical: "Epheser", chapters: 6 },
  { number: 50, canonical: "Philipper", chapters: 4 },
  { number: 51, canonical: "Kolosser", chapters: 4 },
  { number: 52, canonical: "1. Thessalonicher", chapters: 5 },
  { number: 53, canonical: "2. Thessalonicher", chapters: 3 },
  { number: 54, canonical: "1. Timotheus", chapters: 6 },
  { number: 55, canonical: "2. Timotheus", chapters: 4 },
  { number: 56, canonical: "Titus", chapters: 3 },
  { number: 57, canonical: "Philemon", chapters: 1 },
  { number: 58, canonical: "Hebräer", chapters: 13 },
  { number: 59, canonical: "Jakobus", chapters: 5 },
  { number: 60, canonical: "1. Petrus", chapters: 5 },
  { number: 61, canonical: "2. Petrus", chapters: 3 },
  { number: 62, canonical: "1. Johannes", chapters: 5 },
  { number: 63, canonical: "2. Johannes", chapters: 1 },
  { number: 64, canonical: "3. Johannes", chapters: 1 },
  { number: 65, canonical: "Judas", chapters: 1 },
  { number: 66, canonical: "Offenbarung", chapters: 22 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Nur Admin oder Service-Role
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Admin-Check via JWT (Service-Role-Aufrufe haben kein User-JWT, deshalb prüfen wir nur authentifizierte Aufrufe)
  if (authHeader.startsWith("Bearer ") && !authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin");
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Nur Admins" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const body = await req.json().catch(() => ({}));
  const batchSize: number = Math.min(Number(body.batch_size) || 30, 60);
  const cursor: { translation: string; book_number: number; chapter: number } | null = body.cursor ?? null;
  const onlyTranslations: string[] | null = Array.isArray(body.translations) ? body.translations : null;

  // Alle restricted Übersetzungen mit NT
  const { data: metas, error: metaErr } = await supabase
    .from("bible_translation_meta")
    .select("code, is_restricted, testaments")
    .eq("is_restricted", true);
  if (metaErr) {
    return new Response(JSON.stringify({ error: metaErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const translations = (metas ?? [])
    .filter((m: any) => (m.testaments as string[]).includes("NT"))
    .map((m: any) => m.code as string)
    .filter((c) => !onlyTranslations || onlyTranslations.includes(c))
    .sort();

  // Reihenfolge: für jede Übersetzung jedes NT-Buch jedes Kapitel.
  // Cursor erlaubt Wiederaufnahme.
  const work: { translation: string; book: { number: number; canonical: string }; chapter: number }[] = [];
  for (const t of translations) {
    for (const b of NT_BOOKS) {
      for (let ch = 1; ch <= b.chapters; ch++) {
        work.push({ translation: t, book: { number: b.number, canonical: b.canonical }, chapter: ch });
      }
    }
  }

  let startIdx = 0;
  if (cursor) {
    startIdx = work.findIndex(
      (w) => w.translation === cursor.translation && w.book.number === cursor.book_number && w.chapter === cursor.chapter,
    );
    if (startIdx < 0) startIdx = 0;
  }

  // Bereits geladene Kapitel überspringen (per Log)
  const { data: doneLog } = await supabase
    .from("bible_chapter_fetch_log")
    .select("translation, book_number, chapter, status")
    .in("status", ["success"]);
  const doneSet = new Set((doneLog ?? []).map((r: any) => `${r.translation}|${r.book_number}|${r.chapter}`));

  const results: { translation: string; book: string; chapter: number; status: string; verses?: number; error?: string }[] = [];
  let processed = 0;
  let lastIdx = startIdx;
  for (let i = startIdx; i < work.length && processed < batchSize; i++) {
    const w = work[i];
    lastIdx = i;
    const key = `${w.translation}|${w.book.number}|${w.chapter}`;
    if (doneSet.has(key)) continue;

    // Direkter HTTP-Call an unsere eigene fetch-Function via interner URL
    const fetchUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/bible-extra-fetch`;
    try {
      const resp = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ translation: w.translation, book: w.book.canonical, chapter: w.chapter }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        results.push({ translation: w.translation, book: w.book.canonical, chapter: w.chapter, status: data.cached ? "cached" : "ok", verses: data.verses?.length });
      } else {
        results.push({ translation: w.translation, book: w.book.canonical, chapter: w.chapter, status: "failed", error: data.error });
      }
    } catch (e: any) {
      results.push({ translation: w.translation, book: w.book.canonical, chapter: w.chapter, status: "error", error: e.message });
    }
    processed++;
    // kurzer Throttle gegen Rate-Limits
    await new Promise((r) => setTimeout(r, 250));
  }

  const next = work[lastIdx + 1];
  return new Response(
    JSON.stringify({
      processed,
      total: work.length,
      remaining: Math.max(0, work.length - (lastIdx + 1)),
      results,
      next_cursor: next ? { translation: next.translation, book_number: next.book.number, chapter: next.chapter } : null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

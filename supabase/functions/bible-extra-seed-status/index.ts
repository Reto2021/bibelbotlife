// Seed-Status-Endpunkt: Gibt Batch-Fortschritt, zuletzt gesuchte Übersetzung
// und zuletzt gespeicherte Kapitelanzahl zurück.
// Kein JWT erforderlich (read-only, aggregierte Statistiken).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface TranslationProgress {
  translation: string;
  total_attempts: number;
  ok: number;
  pending: number;
  failed: number;
  retry_scheduled: number;
  last_fetched_at: string | null;
  last_ok_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  stored_verses: number;
  stored_chapters: number;
  last_stored_chapter_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const filterTranslation = url.searchParams.get("translation")?.toUpperCase();

    // 1) Fetch-Log aggregieren pro Übersetzung
    let logQuery = supabase
      .from("bible_chapter_fetch_log")
      .select(
        "translation, status, attempts, fetched_at, next_retry_at, last_error_code, error_message, verse_count, book_number, chapter",
      )
      .order("fetched_at", { ascending: false })
      .limit(5000);

    if (filterTranslation) {
      logQuery = logQuery.eq("translation", filterTranslation);
    }

    const { data: logs, error: logErr } = await logQuery;
    if (logErr) throw logErr;

    // 2) Pro Übersetzung gespeicherte Verse + Kapitel zählen
    const progressMap = new Map<string, TranslationProgress>();

    for (const row of logs ?? []) {
      const t = row.translation;
      if (!progressMap.has(t)) {
        progressMap.set(t, {
          translation: t,
          total_attempts: 0,
          ok: 0,
          pending: 0,
          failed: 0,
          retry_scheduled: 0,
          last_fetched_at: null,
          last_ok_at: null,
          last_error_code: null,
          last_error_message: null,
          stored_verses: 0,
          stored_chapters: 0,
          last_stored_chapter_at: null,
        });
      }
      const p = progressMap.get(t)!;
      p.total_attempts += row.attempts ?? 1;

      const status = String(row.status ?? "").toLowerCase();
      if (status === "ok" || status === "success") {
        p.ok += 1;
        if (!p.last_ok_at || (row.fetched_at && row.fetched_at > p.last_ok_at)) {
          p.last_ok_at = row.fetched_at;
        }
      } else if (status === "pending") {
        p.pending += 1;
      } else if (status === "failed" || status === "error") {
        p.failed += 1;
        if (!p.last_error_code && row.last_error_code) {
          p.last_error_code = row.last_error_code;
          p.last_error_message = row.error_message ?? null;
        }
      }

      if (row.next_retry_at && new Date(row.next_retry_at) > new Date()) {
        p.retry_scheduled += 1;
      }

      if (
        !p.last_fetched_at ||
        (row.fetched_at && row.fetched_at > p.last_fetched_at)
      ) {
        p.last_fetched_at = row.fetched_at;
      }
    }

    // 3) Pro Übersetzung gespeicherte Kapitel/Verse zählen
    const translations = filterTranslation
      ? [filterTranslation]
      : Array.from(progressMap.keys());

    for (const t of translations) {
      // Verszahl (head count)
      const { count: verseCount } = await supabase
        .from("bible_verses")
        .select("id", { count: "exact", head: true })
        .eq("translation", t);

      // Unique Kapitelzahl via RPC-freie Aggregation: hole distinct chapter rows
      const { data: chapterRows } = await supabase
        .from("bible_verses")
        .select("book_number, chapter, created_at")
        .eq("translation", t)
        .order("created_at", { ascending: false })
        .limit(10000);

      const seen = new Set<string>();
      let lastStoredAt: string | null = null;
      for (const r of chapterRows ?? []) {
        seen.add(`${r.book_number}:${r.chapter}`);
        if (!lastStoredAt || (r.created_at && r.created_at > lastStoredAt)) {
          lastStoredAt = r.created_at as string;
        }
      }

      if (!progressMap.has(t)) {
        progressMap.set(t, {
          translation: t,
          total_attempts: 0,
          ok: 0,
          pending: 0,
          failed: 0,
          retry_scheduled: 0,
          last_fetched_at: null,
          last_ok_at: null,
          last_error_code: null,
          last_error_message: null,
          stored_verses: 0,
          stored_chapters: 0,
          last_stored_chapter_at: null,
        });
      }
      const p = progressMap.get(t)!;
      p.stored_verses = verseCount ?? 0;
      p.stored_chapters = seen.size;
      p.last_stored_chapter_at = lastStoredAt;
    }

    // 4) Letzte gesuchte Übersetzung & letztes gespeichertes Kapitel (global)
    const { data: lastAttempt } = await supabase
      .from("bible_chapter_fetch_log")
      .select("translation, book_number, chapter, status, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: lastStored } = await supabase
      .from("bible_verses")
      .select("translation, book, book_number, chapter, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5) Batch-Progress: offene Retries fällig jetzt
    const nowIso = new Date().toISOString();
    const { count: dueRetries } = await supabase
      .from("bible_chapter_fetch_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .lte("next_retry_at", nowIso);

    const translationsArr = Array.from(progressMap.values()).sort((a, b) =>
      a.translation.localeCompare(b.translation),
    );

    const totals = translationsArr.reduce(
      (acc, p) => {
        acc.ok += p.ok;
        acc.pending += p.pending;
        acc.failed += p.failed;
        acc.stored_verses += p.stored_verses;
        acc.stored_chapters += p.stored_chapters;
        return acc;
      },
      { ok: 0, pending: 0, failed: 0, stored_verses: 0, stored_chapters: 0 },
    );

    return new Response(
      JSON.stringify({
        ok: true,
        generated_at: nowIso,
        totals: {
          ...totals,
          due_retries: dueRetries ?? 0,
          translations_tracked: translationsArr.length,
        },
        last_attempt: lastAttempt ?? null,
        last_stored: lastStored ?? null,
        translations: translationsArr,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[bible-extra-seed-status] error", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

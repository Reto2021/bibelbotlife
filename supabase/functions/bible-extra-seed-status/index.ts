// Seed-Status-Endpunkt: Liefert Batch-Fortschritt, zuletzt gesuchten Übersetzungs-Code
// und zuletzt gespeicherte Kapitelanzahl aus dem Bibel-Seeding-Prozess.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const translationFilter = url.searchParams.get("translation");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Aggregate fetch log status counts
    const { data: logRows, error: logErr } = await supabase
      .from("bible_chapter_fetch_log")
      .select("translation,status,attempts,next_retry_at,last_error_code,fetched_at,verse_count,book_number,chapter,error_message,source_url");

    if (logErr) throw logErr;

    // Stored verse counts grouped by translation
    const { data: verseRows, error: verseErr } = await supabase
      .rpc("noop_dummy_does_not_exist", {})
      .select()
      .then(() => ({ data: null, error: null }))
      .catch(() => ({ data: null, error: null }));

    // Fall back to direct count via SQL helper if needed; aggregate manually:
    const { data: verseAgg, error: vaErr } = await supabase
      .from("bible_verses")
      .select("translation, book_number, chapter", { count: "exact", head: false })
      .limit(50000);

    if (vaErr) console.warn("verse agg warning", vaErr.message);

    const now = Date.now();
    const totals = { ok: 0, failed: 0, pending: 0, due_retries: 0, scheduled: 0 };
    const perTrans = new Map<string, any>();

    for (const row of logRows ?? []) {
      const t = row.translation as string;
      if (translationFilter && t !== translationFilter) continue;
      if (!perTrans.has(t)) {
        perTrans.set(t, {
          translation: t,
          ok: 0, failed: 0, pending: 0, due_retries: 0, scheduled: 0,
          last_attempt_at: null as string | null,
          last_error_code: null as string | null,
          last_error_message: null as string | null,
          stored_verses: 0,
          stored_chapters: 0,
        });
      }
      const bucket = perTrans.get(t)!;
      const status = String(row.status);
      if (status === "ok") { bucket.ok++; totals.ok++; }
      else if (status === "failed") { bucket.failed++; totals.failed++; }
      else { bucket.pending++; totals.pending++; }

      if (row.next_retry_at) {
        const due = new Date(row.next_retry_at).getTime() <= now;
        if (due && status !== "ok") { bucket.due_retries++; totals.due_retries++; }
        else if (!due && status !== "ok") { bucket.scheduled++; totals.scheduled++; }
      }

      if (!bucket.last_attempt_at || (row.fetched_at && row.fetched_at > bucket.last_attempt_at)) {
        bucket.last_attempt_at = row.fetched_at;
        bucket.last_error_code = row.last_error_code ?? null;
        bucket.last_error_message = row.error_message ?? null;
      }
    }

    // Aggregate stored verses
    const storedKeys = new Set<string>();
    let storedVerseTotal = 0;
    for (const v of verseAgg ?? []) {
      const t = (v as any).translation as string;
      if (translationFilter && t !== translationFilter) continue;
      if (!perTrans.has(t)) {
        perTrans.set(t, {
          translation: t,
          ok: 0, failed: 0, pending: 0, due_retries: 0, scheduled: 0,
          last_attempt_at: null, last_error_code: null, last_error_message: null,
          stored_verses: 0, stored_chapters: 0,
        });
      }
      const bucket = perTrans.get(t)!;
      bucket.stored_verses++;
      storedVerseTotal++;
      const key = `${t}|${(v as any).book_number}|${(v as any).chapter}`;
      if (!storedKeys.has(key)) {
        storedKeys.add(key);
        bucket.stored_chapters++;
      }
    }

    // Last attempt overall + last stored chapter
    let lastAttempt: any = null;
    for (const row of logRows ?? []) {
      if (translationFilter && row.translation !== translationFilter) continue;
      if (!lastAttempt || (row.fetched_at && row.fetched_at > lastAttempt.fetched_at)) {
        lastAttempt = row;
      }
    }

    // Last stored row (newest by created_at)
    const { data: lastStoredRows } = await supabase
      .from("bible_verses")
      .select("translation,book,book_number,chapter,verse,created_at")
      .order("created_at", { ascending: false })
      .limit(translationFilter ? 50 : 1);

    let lastStored: any = null;
    for (const r of lastStoredRows ?? []) {
      if (translationFilter && r.translation !== translationFilter) continue;
      lastStored = r;
      break;
    }

    const translations = Array.from(perTrans.values()).sort((a, b) =>
      a.translation.localeCompare(b.translation)
    );

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        filter: translationFilter,
        totals: {
          ...totals,
          stored_verses: storedVerseTotal,
          stored_chapters: storedKeys.size,
          tracked_chapters: (logRows ?? []).filter(r => !translationFilter || r.translation === translationFilter).length,
        },
        last_attempt: lastAttempt ? {
          translation: lastAttempt.translation,
          book_number: lastAttempt.book_number,
          chapter: lastAttempt.chapter,
          status: lastAttempt.status,
          attempts: lastAttempt.attempts,
          fetched_at: lastAttempt.fetched_at,
          next_retry_at: lastAttempt.next_retry_at,
          last_error_code: lastAttempt.last_error_code,
          source_url: lastAttempt.source_url,
        } : null,
        last_stored: lastStored ? {
          translation: lastStored.translation,
          book: lastStored.book,
          book_number: lastStored.book_number,
          chapter: lastStored.chapter,
          verse: lastStored.verse,
          stored_at: lastStored.created_at,
        } : null,
        translations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("seed-status error", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

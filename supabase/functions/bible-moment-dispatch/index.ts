// Bible Moment Dispatcher — runs on cron every 15 min.
// Selects active bible_moments due for delivery, generates a short verse+reflection
// via Lovable AI, and delivers via configured channels (in-app record, web push).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { requireAdminOrService } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:hallo@biblebot.life", VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type Moment = {
  id: string;
  user_id: string;
  trigger_type: string;
  label: string | null;
  config: Record<string, unknown>;
  delivery_channel: string;
  language: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  active: boolean;
  last_delivered_at: string | null;
  next_eligible_at: string | null;
};

function inQuietHours(m: Moment, now: Date): boolean {
  if (m.quiet_hours_start == null || m.quiet_hours_end == null) return false;
  const h = now.getUTCHours();
  const s = m.quiet_hours_start;
  const e = m.quiet_hours_end;
  if (s === e) return false;
  return s < e ? (h >= s && h < e) : (h >= s || h < e);
}

async function buildContext(m: Moment): Promise<string> {
  const cfg = (m.config as any) ?? {};
  const label = m.label ? ` (${m.label})` : "";

  if (m.trigger_type === "mood" && cfg.mood) {
    return `Der Nutzer fühlt sich gerade: ${cfg.mood}.`;
  }

  if (m.trigger_type === "journal_mood") {
    const { data } = await supabase
      .from("journal_entries")
      .select("mood, content, created_at")
      .eq("user_id", m.user_id)
      .not("mood", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const j = data?.[0];
    if (j) {
      const snippet = (j.content || "").slice(0, 300);
      return `Letzter Journal-Eintrag (Stimmung: ${j.mood}): "${snippet}". Wähle einen Vers, der dazu passt — tröstend, klärend oder ermutigend.`;
    }
    return `Auslöser: journal_mood${label} — keine Journal-Daten gefunden, wähle einen allgemein tröstenden Vers.`;
  }

  if (m.trigger_type === "memory_topic") {
    const { data } = await supabase
      .from("user_memory")
      .select("content")
      .eq("user_id", m.user_id)
      .eq("is_active", true)
      .order("imported_at", { ascending: false })
      .limit(1);
    const mem = data?.[0]?.content?.slice(0, 2000);
    const topic = cfg.topic as string | undefined;
    if (mem) {
      return `Kontext aus dem KI-Gedächtnis des Nutzers:\n${mem}\n\n${topic ? `Fokus-Thema: ${topic}. ` : ""}Wähle einen Vers, der genau zu seiner aktuellen Lebenssituation spricht.`;
    }
    return `Auslöser: memory_topic${label}${topic ? ` — Thema: ${topic}` : ""}.`;
  }

  if (m.trigger_type === "calendar") {
    const event = cfg.event as string | undefined;
    const when = cfg.date as string | undefined;
    const recipient = cfg.recipient_name as string | undefined;
    const relation = cfg.relationship as string | undefined;
    const occasion = cfg.occasion as string | undefined;
    if (recipient) {
      return `Geburtstag/Anlass für ${recipient}${relation ? ` (${relation})` : ""}${when ? ` am ${when}` : ""}${occasion ? ` — ${occasion}` : ""}. Erzeuge einen kurzen, warmen Bibelgruss (Vers + 1-2 Sätze) an den Nutzer, damit er ihn weiterleiten kann.`;
    }
    return `Kalender-Ereignis${when ? ` am ${when}` : ""}${event ? `: ${event}` : ""}. Wähle einen passenden, stärkenden Vers.`;
  }

  return `Auslöser: ${m.trigger_type}${label}.`;
}

async function generateImpulse(m: Moment): Promise<{ title: string; verse: string; reflection: string }> {
  const lang = m.language || "de";
  const context = await buildContext(m);

  const sys = `Du bist ein warmherziger, seelsorgerlicher Bibelbegleiter für BibelBot.Life. Antworte auf ${lang === "de" ? "Schweizer Deutsch (kein ß, immer ss)" : lang}. Gib genau JSON zurück: {"title": "kurzer Titel (max 40 Zeichen)", "verse": "Bibelvers mit Referenz z.B. Psalm 23,1", "reflection": "1-2 Sätze warme Reflexion"}. Kein Markdown, nur JSON.`;


  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      service_tier: "priority",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || "Bibel-Moment",
      verse: parsed.verse || "",
      reflection: parsed.reflection || "",
    };
  } catch {
    return { title: "Bibel-Moment", verse: "", reflection: raw };
  }
}

async function sendPush(userId: string, payload: { title: string; body: string; url: string }) {
  const { data: subs } = await supabase
    .from("user_push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (!subs?.length) return { sent: 0, failed: 0 };
  let sent = 0, failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(s.subscription as any, JSON.stringify(payload));
      sent++;
    } catch (err: any) {
      failed++;
      // 410 / 404 → deactivate
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", s.id);
      }
      console.error("push failed", err?.statusCode, err?.body);
    }
  }
  return { sent, failed };
}

function nextEligible(m: Moment, now: Date): string {
  // Simple cadence: default 6h; time triggers with frequency=daily → 24h.
  const cfg = m.config as any;
  const hours = cfg?.frequency === "daily" ? 24 : cfg?.frequency === "hourly" ? 1 : 6;
  return new Date(now.getTime() + hours * 3600_000).toISOString();
}

async function processMoment(m: Moment, now: Date) {
  if (inQuietHours(m, now)) return { skipped: "quiet_hours" };

  const impulse = await generateImpulse(m);
  const body = impulse.verse ? `${impulse.verse}\n\n${impulse.reflection}` : impulse.reflection;

  // Log delivery
  await supabase.from("bible_moment_deliveries").insert({
    moment_id: m.id,
    user_id: m.user_id,
    channel: m.delivery_channel,
    status: "delivered",
    reference: impulse.verse,
    verse_text: impulse.verse,
    impulse_text: impulse.reflection,
    context: m.trigger_type,
    sent_at: now.toISOString(),
  });


  // Push if configured
  let pushResult: any = null;
  if (m.delivery_channel === "push" || m.delivery_channel === "in_app_push") {
    pushResult = await sendPush(m.user_id, {
      title: `✨ ${impulse.title}`,
      body,
      url: "/mein-bereich/momente",
    });
  }

  await supabase
    .from("bible_moments")
    .update({
      last_delivered_at: now.toISOString(),
      next_eligible_at: nextEligible(m, now),
    })
    .eq("id", m.id);

  return { delivered: true, push: pushResult };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const now = new Date();

  const { data: moments, error } = await supabase
    .from("bible_moments")
    .select("*")
    .eq("active", true)
    .or(`next_eligible_at.is.null,next_eligible_at.lte.${now.toISOString()}`)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];
  for (const m of moments || []) {
    try {
      const r = await processMoment(m as Moment, now);
      results.push({ id: (m as any).id, ...r });
    } catch (e: any) {
      results.push({ id: (m as any).id, error: e?.message });
      await supabase.from("bible_moment_deliveries").insert({
        moment_id: (m as any).id,
        user_id: (m as any).user_id,
        channel: (m as any).delivery_channel,
        status: "error",
        error: e?.message ?? "unknown",

      });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

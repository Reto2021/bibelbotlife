import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Web Push helpers ────────────────────────────────────
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
): Promise<boolean> {
  try {
    const resp = await fetch(subscription.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", TTL: "86400" },
      body: payload,
    });
    return resp.ok;
  } catch (e) {
    console.error("Push error:", e);
    return false;
  }
}

// ── Telegram helper ────────────────────────────────────
async function sendTelegram(chatId: number, text: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    return resp.ok;
  } catch (e) {
    console.error("Telegram error:", e);
    return false;
  }
}

// ── SMS helper (textlinksms.com) ────────────────────────
async function sendSMS(phone: string, text: string, apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch("https://textlinksms.com/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone_number: phone, text }),
    });
    return resp.ok;
  } catch (e) {
    console.error("SMS error:", e);
    return false;
  }
}

// ── Language names for translation prompt ──────────────
const LANGUAGE_NAMES: Record<string, string> = {
  de: "German (Swiss)", en: "English", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", nl: "Dutch", pl: "Polish", cs: "Czech", sk: "Slovak",
  hu: "Hungarian", ro: "Romanian", bg: "Bulgarian", hr: "Croatian", sr: "Serbian",
  sl: "Slovenian", uk: "Ukrainian", ru: "Russian", el: "Greek", da: "Danish",
  sv: "Swedish", no: "Norwegian", fi: "Finnish", ko: "Korean", zh: "Chinese",
  vi: "Vietnamese", id: "Indonesian", tl: "Filipino", sw: "Swahili", am: "Amharic",
  yo: "Yoruba", ig: "Igbo", zu: "Zulu", af: "Afrikaans", ht: "Haitian Creole",
  ka: "Georgian", hy: "Armenian",
};

// ── Translate impulse via AI ───────────────────────────
async function translateImpulse(
  impulse: Record<string, string>,
  targetLang: string,
  apiKey: string,
): Promise<Record<string, string>> {
  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  const prompt = `Translate this Bible daily impulse JSON from German to ${langName}. 
Keep ALL JSON keys exactly as they are. Translate only the values.
Keep the Bible reference format (Book Chapter,Verse) but use the standard book names in ${langName}.
Output ONLY valid JSON, no markdown, no explanation.

${JSON.stringify(impulse, null, 2)}`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a translator. Output ONLY valid JSON. No markdown code blocks." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      console.error(`Translation to ${targetLang} failed:`, resp.status);
      return impulse; // fallback to German
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    parsed.date = impulse.date; // preserve date
    return parsed;
  } catch (e) {
    console.error(`Translation to ${targetLang} error:`, e);
    return impulse; // fallback to German
  }
}

// ── Format messages ────────────────────────────────────
const GREETINGS: Record<string, [string, string]> = {
  de: ["Guten Morgen", "Mehr auf BibleBot.ch"],
  en: ["Good morning", "More at BibleBot.ch"],
  fr: ["Bonjour", "Plus sur BibleBot.ch"],
  es: ["Buenos días", "Más en BibleBot.ch"],
  it: ["Buongiorno", "Altro su BibleBot.ch"],
  pt: ["Bom dia", "Mais em BibleBot.ch"],
  ko: ["좋은 아침", "BibleBot.ch에서 더 보기"],
  zh: ["早上好", "更多内容请访问 BibleBot.ch"],
};

function getGreeting(lang: string): [string, string] {
  return GREETINGS[lang] || GREETINGS["en"];
}

function formatMessage(impulse: Record<string, string>, firstName?: string, lang = "de"): string {
  const [greeting, cta] = getGreeting(lang);
  const name = firstName ? `${greeting}, ${firstName}! 🙏` : `${greeting}! 🙏`;
  return `${name}

*${impulse.topic}*

_${impulse.verse}_
– ${impulse.reference}

${impulse.context}

👉 ${cta}`;
}

function formatSMS(impulse: Record<string, string>, firstName?: string, lang = "de"): string {
  const [greeting] = getGreeting(lang);
  const name = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;
  return `${name} ${impulse.topic}: ${impulse.teaser} - ${impulse.reference} | BibleBot.ch`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramToken = Deno.env.get("TELEGRAM_API_KEY") || "";
    const smsApiKey = Deno.env.get("TEXTLINKSMS_API_KEY") || "";
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Generate today's impulse (German base)
    const impulseResp = await fetch(`${supabaseUrl}/functions/v1/daily-impulse`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!impulseResp.ok) throw new Error("Failed to fetch impulse");
    const baseImpulse = await impulseResp.json();

    // 2. Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("daily_subscribers")
      .select("*")
      .eq("is_active", true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Group subscribers by language
    const byLang: Record<string, typeof subscribers> = {};
    for (const sub of subscribers) {
      const lang = sub.language || "de";
      if (!byLang[lang]) byLang[lang] = [];
      byLang[lang].push(sub);
    }

    // 4. Translate impulse for each non-German language (in parallel)
    const impulseByLang: Record<string, Record<string, string>> = { de: baseImpulse };
    const languages = Object.keys(byLang).filter((l) => l !== "de");

    if (languages.length > 0) {
      const translations = await Promise.all(
        languages.map((lang) => translateImpulse(baseImpulse, lang, lovableApiKey))
      );
      languages.forEach((lang, i) => {
        impulseByLang[lang] = translations[i];
      });
    }

    console.log(`Broadcasting to ${subscribers.length} subscribers in ${Object.keys(byLang).length} language(s): ${Object.keys(byLang).join(", ")}`);

    // 5. Send to each subscriber in their language
    let sentCount = 0;

    for (const sub of subscribers) {
      const lang = sub.language || "de";
      const impulse = impulseByLang[lang] || baseImpulse;
      let success = false;

      if (sub.channel === "telegram" && sub.telegram_chat_id && telegramToken) {
        const msg = formatMessage(impulse, sub.first_name, lang);
        success = await sendTelegram(sub.telegram_chat_id, msg, telegramToken);
      } else if (sub.channel === "sms" && sub.phone_number && smsApiKey) {
        const msg = formatSMS(impulse, sub.first_name, lang);
        success = await sendSMS(sub.phone_number, msg, smsApiKey);
      } else if (sub.channel === "push" && sub.push_subscription && vapidPublic) {
        const msg = JSON.stringify({
          title: `🙏 ${impulse.topic}`,
          body: impulse.teaser,
          url: "https://bibelbotlive.lovable.app",
        });
        success = await sendWebPush(sub.push_subscription, msg, vapidPublic, vapidPrivate);
      }

      if (success) sentCount++;
    }

    // 6. Log broadcast
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("daily_broadcast_log").upsert(
      {
        impulse_date: today,
        impulse_data: baseImpulse,
        subscribers_count: sentCount,
      },
      { onConflict: "impulse_date" }
    );

    return new Response(
      JSON.stringify({
        message: "Broadcast complete",
        sent: sentCount,
        total: subscribers.length,
        languages: Object.keys(byLang),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Broadcast error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

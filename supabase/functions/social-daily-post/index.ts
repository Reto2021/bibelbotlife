import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// SETUP REQUIRED (Supabase Secrets):
// GHL_API_KEY         — GoHighLevel API Key (Settings → API Keys)
// GHL_LOCATION_ID     — GoHighLevel Location/Sub-Account ID
// GHL_ACCOUNT_IDS     — JSON: {"facebook":"acc_xxx","instagram":"acc_yyy","linkedin":"acc_zzz","x":"acc_www","google":"acc_ggg"}

const GHL_BASE = "https://services.leadconnectorhq.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Impulse {
  topic: string;
  verse: string;
  reference: string;
  teaser: string;
  context: string;
}

async function postToGHL(
  locationId: string,
  apiKey: string,
  accountId: string,
  summary: string,
  mediaUrl: string | null,
  scheduleDate?: string,
): Promise<{ ok: boolean; status: number; body?: string }> {
  const body: Record<string, unknown> = {
    accountIds: [accountId],
    summary,
    status: scheduleDate ? "scheduled" : "published",
  };

  if (scheduleDate) body.scheduledAt = scheduleDate;
  if (mediaUrl) body.mediaUrls = [mediaUrl];

  try {
    const resp = await fetch(
      `${GHL_BASE}/social-media-posting/${locationId}/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify(body),
      },
    );
    let respBody: string | undefined;
    if (!resp.ok) {
      respBody = await resp.text().catch(() => undefined);
    }
    return { ok: resp.ok, status: resp.status, body: respBody };
  } catch (err) {
    console.error(`GHL fetch error for account ${accountId}:`, err);
    return { ok: false, status: 0, body: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const GHL_API_KEY = Deno.env.get("GHL_API_KEY");
  const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");
  const GHL_ACCOUNT_IDS = Deno.env.get("GHL_ACCOUNT_IDS");

  if (!GHL_API_KEY || !GHL_LOCATION_ID || !GHL_ACCOUNT_IDS) {
    console.error("Missing GHL configuration");
    return new Response(
      JSON.stringify({ error: "GHL secrets not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let accounts: Record<string, string>;
  try {
    accounts = JSON.parse(GHL_ACCOUNT_IDS);
  } catch {
    return new Response(
      JSON.stringify({ error: "GHL_ACCOUNT_IDS is not valid JSON" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // ── Step 1: Get today's impulse (from daily-impulse function) ────
  let impulse: Impulse;
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/daily-impulse`, {
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`daily-impulse ${resp.status}: ${txt}`);
    }
    impulse = await resp.json();
  } catch (err) {
    console.error("Failed to fetch impulse:", err);
    return new Response(
      JSON.stringify({ error: "Could not load today's impulse", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!impulse?.verse || !impulse?.reference) {
    return new Response(
      JSON.stringify({ error: "Impulse missing verse/reference", impulse }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Step 2: Get share image URL (generate if missing) ────────────
  const fileName = `impulse-${today}.png`;
  let shareImageUrl: string | null = null;

  const { data: publicUrlData } = supabase.storage
    .from("share-images")
    .getPublicUrl(fileName);

  if (publicUrlData?.publicUrl) {
    const headResp = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
    if (headResp.ok) shareImageUrl = publicUrlData.publicUrl;
  }

  if (!shareImageUrl) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/impulse-share-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verse: impulse.verse,
          reference: impulse.reference,
          teaser: impulse.teaser,
          topic: impulse.topic,
          date: today,
        }),
      });
      const { data: retryUrl } = supabase.storage
        .from("share-images")
        .getPublicUrl(fileName);
      shareImageUrl = retryUrl?.publicUrl || null;
    } catch (err) {
      console.error("Image generation failed:", err);
    }
  }

  // ── Step 3: Format platform-specific posts ───────────────────────
  const deepLink = `https://biblebot.life/?v=${encodeURIComponent(impulse.reference)}&ref=social`;

  const posts: Record<string, string> = {
    x: `«${impulse.verse}»\n— ${impulse.reference}\n\n${impulse.teaser}\n\n${deepLink}`,

    instagram: [
      impulse.topic,
      "",
      `«${impulse.verse}»`,
      `— ${impulse.reference}`,
      "",
      impulse.context,
      "",
      "🔗 Link in Bio: biblebot.life",
      "",
      "#bibel #bibelvers #glaube #hoffnung #tagesimpuls #biblebot #bibellesen #christlich #inspiration #gebet",
    ].join("\n"),

    facebook: `📖 ${impulse.topic}\n\n«${impulse.verse}»\n— ${impulse.reference}\n\n${impulse.context}\n\n👉 Mehr entdecken: ${deepLink}`,

    linkedin: `📖 Tagesimpuls: ${impulse.topic}\n\n«${impulse.verse}»\n— ${impulse.reference}\n\n${impulse.context}\n\nBibleBot.Life begleitet Menschen durch die Bibel — kostenlos, anonym, ökumenisch.\n\n${deepLink}`,

    google: `📖 ${impulse.topic}: «${impulse.verse}» — ${impulse.reference}\n\n${deepLink}`,
  };

  // ── Step 4: Post to each connected GHL account ───────────────────
  const results: Record<string, { ok: boolean; status: number; body?: string }> = {};

  for (const [platform, accountId] of Object.entries(accounts)) {
    const postText = posts[platform] || posts.facebook;
    results[platform] = await postToGHL(
      GHL_LOCATION_ID,
      GHL_API_KEY,
      accountId,
      postText,
      shareImageUrl,
    );
    console.log(`Posted to ${platform}: ${results[platform].status}`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  // ── Step 5: Log ──────────────────────────────────────────────────
  await supabase.from("social_posts_log").insert({
    date: today,
    topic: impulse.topic,
    reference: impulse.reference,
    platforms: Object.keys(results),
    results,
  });

  return new Response(
    JSON.stringify({
      success: true,
      date: today,
      topic: impulse.topic,
      shareImageUrl,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

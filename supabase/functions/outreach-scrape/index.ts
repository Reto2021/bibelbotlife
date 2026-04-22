import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Retry fetch with exponential backoff for transient errors (DNS, network, 5xx, 429).
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: { retries?: number; baseDelayMs?: number; label?: string } = {},
): Promise<Response> {
  const retries = opts.retries ?? 4;
  const baseDelay = opts.baseDelayMs ?? 800;
  const label = opts.label ?? url;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt < retries) {
          const delay = Math.round(baseDelay * Math.pow(2, attempt) + Math.random() * 300);
          console.warn(`[retry] ${label} HTTP ${res.status}, attempt ${attempt + 1}/${retries} in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      return res;
    } catch (err) {
      lastErr = err;
      const msg = (err as Error)?.message || String(err);
      const isTransient =
        /dns|getaddrinfo|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|ECONNREFUSED|network|fetch failed|TLS|handshake|sending request/i
          .test(msg);
      if (!isTransient || attempt === retries) {
        throw err;
      }
      const delay = Math.round(baseDelay * Math.pow(2, attempt) + Math.random() * 300);
      console.warn(`[retry] ${label} ${msg}, attempt ${attempt + 1}/${retries} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error(`fetchWithRetry exhausted for ${label}`);
}

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateAlternativeColor(hexColor: string): string {
  const hsl = hexToHsl(hexColor);
  if (!hsl) return hexColor;
  const parts = hsl.split(" ");
  const h = parseInt(parts[0]);
  const s = parseInt(parts[1]);
  const l = parseInt(parts[2]);
  const newH = (h + 15) % 360;
  const newS = Math.min(s + 10, 100);
  return hslToHex(newH, newS, l);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { lead_id, website } = await req.json();

    if (!lead_id || !website) {
      return new Response(JSON.stringify({ error: "lead_id and website required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = website.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    // Step 1: Scrape with branding extraction + screenshot
    const scrapeRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "screenshot", "branding"],
        onlyMainContent: true,
      }),
    }, { label: "firecrawl-scrape", retries: 4, baseDelayMs: 1000 });

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const screenshotUrl = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    const brandingRaw = scrapeData?.data?.branding || scrapeData?.branding || {};

    if (!markdown && !brandingRaw) {
      return new Response(JSON.stringify({ error: "Could not scrape website", details: scrapeData }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract branding colors
    const primaryColor = brandingRaw?.colors?.primary || null;
    const secondaryColor = brandingRaw?.colors?.secondary || null;
    const textColor = brandingRaw?.colors?.textPrimary || null;
    const logoUrl = brandingRaw?.images?.logo || brandingRaw?.logo || null;

    // Step 1b: Extract social media links from markdown via regex
    const socialLinks: Record<string, string | null> = {
      instagram_handle: null,
      facebook_url: null,
      whatsapp_number: null,
      telegram_username: null,
      youtube_url: null,
    };

    // Instagram
    const igMatch = markdown.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/i);
    if (igMatch) socialLinks.instagram_handle = igMatch[1];

    // Facebook
    const fbMatch = markdown.match(/(https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._\-/]+)/i);
    if (fbMatch) socialLinks.facebook_url = fbMatch[1];

    // WhatsApp
    const waMatch = markdown.match(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?\+?(\d{8,15})/i);
    if (waMatch) socialLinks.whatsapp_number = `+${waMatch[1].replace(/^0+/, "")}`;

    // Telegram
    const tgMatch = markdown.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
    if (tgMatch) socialLinks.telegram_username = tgMatch[1];

    // YouTube
    const ytMatch = markdown.match(/(https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|@)[a-zA-Z0-9._\-/]+)/i);
    if (ytMatch) socialLinks.youtube_url = ytMatch[1];

    console.log("Social links extracted:", JSON.stringify(socialLinks));

    // Step 2: AI extraction of contact data + website score in one call
    const aiRes = await fetchWithRetry("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du bist ein Assistent der aus Gemeinde-Websites Kontaktdaten extrahiert und das Design bewertet.
Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung):
{
  "contact_name": "Name des Pfarrers/Pastors oder null",
  "contact_email": "E-Mail-Adresse oder null",
  "denomination": "Konfession oder null",
  "city": "Ort oder null",
  "size_estimate": "klein/mittel/gross oder null",
  "highlights": ["Besonderheit 1", "Besonderheit 2"],
  "personal_note": "Ein persönlicher Satz über die Gemeinde, max 2 Sätze.",
  "website_score": 5,
  "instagram_handle": "Instagram-Benutzername oder null",
  "facebook_url": "Facebook-Seiten-URL oder null",
  "whatsapp_number": "WhatsApp-Nummer mit Ländervorwahl oder null",
  "telegram_username": "Telegram-Benutzername oder null",
  "youtube_url": "YouTube-Kanal-URL oder null"
}

website_score: Bewerte das Website-Design auf einer Skala von 1-10 nach:
- Modernität des Designs
- Mobile-Freundlichkeit (schätze anhand des HTML/CSS)
- Benutzerfreundlichkeit
- Professioneller Eindruck
Gib NUR eine Zahl 1-10 als website_score.

Extrahiere auch Social-Media-Links (Instagram, Facebook, WhatsApp, Telegram, YouTube) falls vorhanden.`,
          },
          {
            role: "user",
            content: `Extrahiere Kontaktdaten, Social-Media-Links und bewerte das Design dieser Gemeinde-Website:\n\nURL: ${formattedUrl}\n\nInhalt:\n${markdown.slice(0, 4000)}\n\nBranding-Daten: ${JSON.stringify(brandingRaw).slice(0, 1000)}`,
          },
        ],
        temperature: 0.3,
      }),
    }, { label: "ai-gateway", retries: 4, baseDelayMs: 1000 });

    const aiData = await aiRes.json();
    let extracted: any = {};
    try {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("AI parse error:", aiData);
    }

    const websiteScore = typeof extracted.website_score === "number"
      ? Math.min(10, Math.max(1, extracted.website_score))
      : null;

    // Step 3: Generate A/B variant color
    const abVariantColor = primaryColor ? generateAlternativeColor(primaryColor) : null;

    // Merge social links: prefer regex-extracted, fall back to AI-extracted
    const finalSocial = {
      instagram_handle: socialLinks.instagram_handle || extracted.instagram_handle || null,
      facebook_url: socialLinks.facebook_url || extracted.facebook_url || null,
      whatsapp_number: socialLinks.whatsapp_number || extracted.whatsapp_number || null,
      telegram_username: socialLinks.telegram_username || extracted.telegram_username || null,
      youtube_url: socialLinks.youtube_url || extracted.youtube_url || null,
    };

    // Step 4: Update lead with all data
    const updateData: any = {
      scraped_data: {
        markdown_preview: markdown.slice(0, 500),
        ...extracted,
        scraped_at: new Date().toISOString(),
      },
      scraped_branding: {
        ...brandingRaw,
        fonts: brandingRaw?.fonts || [],
        extractedAt: new Date().toISOString(),
      },
      website_score: websiteScore,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      text_color: textColor,
      logo_url: logoUrl,
      screenshot_url: screenshotUrl,
      ab_variant_color: abVariantColor,
      ...finalSocial,
    };

    if (extracted.contact_name) updateData.contact_name = extracted.contact_name;
    if (extracted.contact_email) updateData.email = extracted.contact_email;
    if (extracted.denomination) updateData.denomination = extracted.denomination;
    if (extracted.city) updateData.city = extracted.city;
    if (extracted.personal_note) updateData.personal_note = extracted.personal_note;

    await supabase.from("outreach_leads").update(updateData).eq("id", lead_id);

    return new Response(JSON.stringify({
      success: true,
      extracted,
      branding: { primaryColor, secondaryColor, textColor, logoUrl },
      websiteScore,
      screenshotUrl,
      abVariantColor,
      socialLinks: finalSocial,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scrape error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

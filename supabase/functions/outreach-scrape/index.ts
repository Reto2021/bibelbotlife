import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
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
    });

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

    // Step 2: AI extraction of contact data + website score in one call
    const aiRes = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
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
  "website_score": 5
}

website_score: Bewerte das Website-Design auf einer Skala von 1-10 nach:
- Modernität des Designs
- Mobile-Freundlichkeit (schätze anhand des HTML/CSS)
- Benutzerfreundlichkeit
- Professioneller Eindruck
Gib NUR eine Zahl 1-10 als website_score.`,
          },
          {
            role: "user",
            content: `Extrahiere Kontaktdaten und bewerte das Design dieser Gemeinde-Website:\n\nURL: ${formattedUrl}\n\nInhalt:\n${markdown.slice(0, 4000)}\n\nBranding-Daten: ${JSON.stringify(brandingRaw).slice(0, 1000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

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

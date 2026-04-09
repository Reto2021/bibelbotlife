import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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

    // Scrape website with Firecrawl
    let formattedUrl = website.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";

    if (!markdown) {
      return new Response(JSON.stringify({ error: "Could not scrape website", details: scrapeData }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract contact info and generate personal note
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `Du bist ein Assistent der aus Gemeinde-Websites Kontaktdaten extrahiert. 
Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung):
{
  "contact_name": "Name des Pfarrers/Pastors oder null",
  "contact_email": "E-Mail-Adresse oder null",
  "denomination": "Konfession oder null",
  "city": "Ort oder null",
  "size_estimate": "klein/mittel/gross oder null",
  "highlights": ["Besonderheit 1", "Besonderheit 2"],
  "personal_note": "Ein persönlicher Satz über die Gemeinde, der zeigt dass man die Website gelesen hat. Max 2 Sätze."
}`,
          },
          {
            role: "user",
            content: `Extrahiere Kontaktdaten von dieser Gemeinde-Website:\n\n${markdown.slice(0, 4000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await aiRes.json();
    let extracted: any = {};
    try {
      const content = aiData.choices?.[0]?.message?.content || "";
      // Strip markdown code fences if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("AI parse error:", aiData);
    }

    // Update lead with scraped data
    const updateData: any = {
      scraped_data: {
        markdown_preview: markdown.slice(0, 500),
        ...extracted,
        scraped_at: new Date().toISOString(),
      },
    };

    if (extracted.contact_name) updateData.contact_name = extracted.contact_name;
    if (extracted.contact_email) updateData.email = extracted.contact_email;
    if (extracted.denomination) updateData.denomination = extracted.denomination;
    if (extracted.city) updateData.city = extracted.city;
    if (extracted.personal_note) updateData.personal_note = extracted.personal_note;

    await supabase.from("outreach_leads").update(updateData).eq("id", lead_id);

    return new Response(JSON.stringify({ success: true, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scrape error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

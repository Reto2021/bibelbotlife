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
      // Retry on transient HTTP errors
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

    const { campaign_id, search_query, country = "ch", lang = "de", max_results = 10 } = await req.json();

    if (!campaign_id || !search_query) {
      return new Response(JSON.stringify({ error: "campaign_id and search_query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Search for churches using Firecrawl
    console.log("Searching:", search_query);
    const searchRes = await fetchWithRetry("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: search_query,
        limit: Math.min(max_results, 20),
        lang,
        country,
        scrapeOptions: { formats: ["markdown"] },
      }),
    }, { label: "firecrawl-search", retries: 4, baseDelayMs: 1000 });

    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      return new Response(JSON.stringify({ error: "Firecrawl search failed", details: searchData }), {
        status: searchRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = searchData?.data || searchData?.results || [];
    if (!results.length) {
      return new Response(JSON.stringify({ discovered: 0, imported: 0, skipped: 0, leads: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Extract contacts from each result using AI (batch)
    const batchPrompt = results.map((r: any, i: number) => {
      const md = (r.markdown || r.description || "").slice(0, 2000);
      return `--- WEBSITE ${i + 1} ---\nURL: ${r.url}\nTitle: ${r.title || ""}\nContent:\n${md}`;
    }).join("\n\n");

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
            content: `Du extrahierst Kontaktdaten von Websites. Zielgruppen sind:
- Kirchen und Gemeinden (reformiert, katholisch, freikirchlich etc.)
- Seelsorger und Seelsorge-Praxen (Spitalseelsorge, Gefängnisseelsorge, Notfallseelsorge etc.)
- Life Coaches mit spirituellem/christlichem Fokus
- Heime und Pflegeeinrichtungen mit Seelsorge-Angebot

Antworte NUR mit einem JSON-Array. Für jede Website ein Objekt:
[
  {
    "website_index": 1,
    "church_name": "Name der Organisation/Person",
    "email": "kontakt@email.ch oder null",
    "contact_name": "Name der Kontaktperson oder null",
    "city": "Stadt oder null",
    "denomination": "Konfession oder null",
    "category": "church | chaplain | life_coach | care_home | other",
    "website": "URL der Website",
    "is_relevant": true
  }
]

Regeln:
- Kirchen, Seelsorger, christliche Life Coaches und Heime mit Seelsorge einschliessen (is_relevant: true)
- Keine Aggregator-Seiten, Verzeichnisse, Nachrichtenportale, Wikipedia
- E-Mail muss eine echte Kontakt-E-Mail sein (kein noreply, persönliche E-Mail bevorzugen)
- Falls keine E-Mail gefunden: email = null
- "category" korrekt setzen: church (Kirche/Gemeinde), chaplain (Seelsorger), life_coach (Coach), care_home (Heim)
- Antworte NUR mit dem JSON-Array, keine Erklärung`,
          },
          {
            role: "user",
            content: `Extrahiere die Kontakte aus diesen ${results.length} Suchergebnissen:\n\n${batchPrompt}`,
          },
        ],
        temperature: 0.2,
      }),
    }, { label: "ai-gateway", retries: 4, baseDelayMs: 1000 });

    const aiData = await aiRes.json();
    let extracted: any[] = [];
    try {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch (e) {
      console.error("AI parse error:", aiData);
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: aiData.choices?.[0]?.message?.content }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter: only churches with email
    const validLeads = extracted.filter((e: any) => e.is_relevant && e.email && e.church_name);

    if (!validLeads.length) {
      return new Response(JSON.stringify({ discovered: extracted.length, imported: 0, skipped: extracted.length, leads: extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Deduplicate against existing leads
    const emails = validLeads.map((l: any) => l.email.toLowerCase().trim());
    const { data: existing } = await supabase
      .from("outreach_leads")
      .select("email")
      .eq("campaign_id", campaign_id)
      .in("email", emails);

    const existingEmails = new Set((existing || []).map((e: any) => e.email.toLowerCase()));
    const newLeads = validLeads.filter((l: any) => !existingEmails.has(l.email.toLowerCase().trim()));

    // Step 4: Insert new leads
    if (newLeads.length > 0) {
      const rows = newLeads.map((l: any) => ({
        campaign_id,
        church_name: l.church_name,
        email: l.email.trim(),
        website: l.website || null,
        city: l.city || null,
        denomination: l.denomination || null,
        contact_name: l.contact_name || null,
        source: "auto_discover",
        status: "new",
      }));

      const { error } = await supabase.from("outreach_leads").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({
      discovered: extracted.length,
      imported: newLeads.length,
      skipped: validLeads.length - newLeads.length,
      no_email: extracted.filter((e: any) => !e.email).length,
      leads: extracted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Discover error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

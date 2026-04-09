import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { campaign_id, csv_data, auto_scrape = false } = await req.json();

    if (!campaign_id || !csv_data) {
      return new Response(JSON.stringify({ error: "campaign_id and csv_data required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse CSV (expects: church_name,email,website,city,denomination,contact_name)
    const lines = csv_data.split("\n").filter((l: string) => l.trim());
    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    
    const leads: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim());
      const row: any = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = values[idx] || null;
      });

      if (!row.email || !row.church_name) continue;

      leads.push({
        campaign_id,
        church_name: row.church_name,
        email: row.email,
        website: row.website || null,
        city: row.city || null,
        denomination: row.denomination || null,
        contact_name: row.contact_name || null,
        source: "csv_import",
        status: "new",
      });
    }

    if (!leads.length) {
      return new Response(JSON.stringify({ error: "No valid leads in CSV" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicates
    const emails = leads.map((l) => l.email);
    const { data: existing } = await supabase
      .from("outreach_leads")
      .select("email")
      .eq("campaign_id", campaign_id)
      .in("email", emails);

    const existingEmails = new Set((existing || []).map((e: any) => e.email));
    const newLeads = leads.filter((l) => !existingEmails.has(l.email));

    if (newLeads.length) {
      const { error } = await supabase.from("outreach_leads").insert(newLeads);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        imported: newLeads.length,
        skipped: leads.length - newLeads.length,
        total: leads.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

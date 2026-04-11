import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Fetch active schedules
    const { data: schedules, error: schErr } = await supabase
      .from("pipeline_schedules")
      .select("*, outreach_campaigns(*)")
      .eq("is_active", true);

    if (schErr) throw schErr;
    if (!schedules?.length) {
      return new Response(JSON.stringify({ message: "No active schedules", ran: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const schedule of schedules) {
      const log: string[] = [];
      const campaignId = schedule.campaign_id;
      let status = "success";

      try {
        // Step 1: Discover
        log.push("🔍 Discover gestartet…");
        const discoverRes = await fetch(`${supabaseUrl}/functions/v1/outreach-discover`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            search_query: schedule.search_query,
            country: schedule.country,
            max_results: schedule.max_results,
          }),
        });
        const discoverData = await discoverRes.json();
        if (!discoverRes.ok) throw new Error(discoverData.error || "Discover failed");
        log.push(`✅ ${discoverData.imported} Leads importiert, ${discoverData.skipped} Duplikate`);

        if (discoverData.imported === 0) {
          log.push("⏭️ Keine neuen Leads — überspringe Scrape/Send");
        } else {
          // Fetch new leads
          const { data: freshLeads } = await supabase
            .from("outreach_leads")
            .select("*")
            .eq("campaign_id", campaignId)
            .order("created_at", { ascending: false });
          const allLeads = freshLeads || [];

          // Step 2: Scrape
          const scrapeable = allLeads.filter((l: any) => l.website && !l.primary_color);
          log.push(`🌐 Scrape ${scrapeable.length} Websites…`);
          let scrapeOk = 0, scrapeErr = 0;
          for (const lead of scrapeable) {
            try {
              const res = await fetch(`${supabaseUrl}/functions/v1/outreach-scrape`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
                body: JSON.stringify({ lead_id: lead.id, website: lead.website }),
              });
              if (!res.ok) throw new Error("scrape failed");
              scrapeOk++;
            } catch { scrapeErr++; }
            // Rate limit
            await new Promise((r) => setTimeout(r, 2000));
          }
          log.push(`✅ ${scrapeOk} gescraped, ${scrapeErr} Fehler`);

          // Step 3: Sequence
          const { data: existingSeqs } = await supabase
            .from("outreach_sequences")
            .select("id")
            .eq("campaign_id", campaignId);
          if (!existingSeqs?.length) {
            log.push("✍️ Generiere E-Mail-Sequenz…");
            const seqRes = await fetch(`${supabaseUrl}/functions/v1/outreach-generate-sequence`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
              body: JSON.stringify({ campaign_id: campaignId }),
            });
            if (!seqRes.ok) throw new Error("Sequence generation failed");
            log.push("✅ Sequenz generiert");
          } else {
            log.push(`⏭️ Sequenz existiert (${existingSeqs.length} Schritte)`);
          }

          // Step 4: Personalize + Send
          const eligible = allLeads.filter((l: any) => l.status === "new");
          log.push(`📧 Personalisiere ${eligible.length} Leads…`);
          let sendOk = 0, sendFail = 0;
          for (const lead of eligible) {
            try {
              const targetStep = (lead.current_step + 1) || 1;
              const persRes = await fetch(`${supabaseUrl}/functions/v1/outreach-generate-sequence`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
                body: JSON.stringify({ mode: "personalize", lead_id: lead.id, step_number: targetStep }),
              });
              const persData = await persRes.json();
              if (!persRes.ok) throw new Error("personalize failed");
              await supabase.from("outreach_emails").insert({
                lead_id: persData.lead_id,
                sequence_step: persData.step_number,
                subject: persData.subject,
                body: persData.body,
                status: "pending",
              });
              sendOk++;
            } catch { sendFail++; }
            await new Promise((r) => setTimeout(r, 1500));
          }
          log.push(`✅ ${sendOk} vorbereitet, ${sendFail} Fehler`);

          // Trigger send
          const sendRes = await fetch(`${supabaseUrl}/functions/v1/outreach-send`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({}),
          });
          const sendData = await sendRes.json();
          log.push(`🚀 ${sendData.sent || 0} E-Mails versendet`);
        }

        log.push("🎉 Pipeline abgeschlossen");
      } catch (err: any) {
        status = "error";
        log.push(`❌ Fehler: ${err.message}`);
      }

      // Update schedule with run results
      await supabase.from("pipeline_schedules").update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
        last_run_log: log,
      }).eq("id", schedule.id);

      results.push({ campaign_id: campaignId, status, log });
    }

    return new Response(JSON.stringify({ ran: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

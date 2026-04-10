import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active campaigns
    const { data: campaigns } = await supabase
      .from("outreach_campaigns")
      .select("*")
      .eq("status", "active");

    if (!campaigns?.length) {
      return new Response(JSON.stringify({ message: "No active campaigns" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const currentHour = now.getUTCHours() + 1; // CET approximation
    const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
    let totalSent = 0;

    for (const campaign of campaigns) {
      // Check send window
      if (campaign.send_weekdays_only && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      if (currentHour < campaign.send_start_hour || currentHour >= campaign.send_end_hour) continue;

      // Check daily limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: sentToday } = await supabase
        .from("outreach_emails")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", todayStart.toISOString())
        .in("lead_id", 
          (await supabase.from("outreach_leads").select("id").eq("campaign_id", campaign.id)).data?.map((l: any) => l.id) || []
        );

      if ((sentToday || 0) >= campaign.max_emails_per_day) continue;

      // Get sequences for this campaign
      const { data: sequences } = await supabase
        .from("outreach_sequences")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("step_number");

      if (!sequences?.length) continue;

      // Get leads ready for next step
      const { data: leads } = await supabase
        .from("outreach_leads")
        .select("*")
        .eq("campaign_id", campaign.id)
        .in("status", ["new", "contacted"])
        .lt("current_step", sequences.length);

      if (!leads?.length) continue;

      let hourSent = 0;

      for (const lead of leads) {
        if (hourSent >= campaign.max_emails_per_hour) break;
        if ((sentToday || 0) + totalSent >= campaign.max_emails_per_day) break;

        // Check if blacklisted
        const domain = lead.email.split("@")[1];
        if (campaign.blacklist_domains?.includes(domain)) continue;

        const nextStep = lead.current_step + 1;
        const sequence = sequences.find((s: any) => s.step_number === nextStep);
        if (!sequence) continue;

        // Check delay
        if (lead.last_contacted_at) {
          const daysSince = (now.getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < sequence.delay_days) continue;
        } else if (nextStep > 1) {
          continue; // First contact not yet sent
        }

        // Personalize template
        const subject = personalizeTemplate(sequence.subject_template, lead, campaign);
        const body = personalizeTemplate(sequence.body_template, lead, campaign);

        // Send via Resend
        try {
          const sendHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };

          let sendUrl = "https://api.resend.com/emails";

          // Use gateway if lovable key available, otherwise direct
          if (lovableKey) {
            sendUrl = `${RESEND_GATEWAY}/emails`;
            sendHeaders["Authorization"] = `Bearer ${lovableKey}`;
            sendHeaders["X-Connection-Api-Key"] = resendKey;
          } else {
            sendHeaders["Authorization"] = `Bearer ${resendKey}`;
          }

          const emailRes = await fetch(sendUrl, {
            method: "POST",
            headers: sendHeaders,
            body: JSON.stringify({
              from: `${campaign.sender_name} <${campaign.sender_email}>`,
              to: [lead.email],
              subject,
              html: body,
            }),
          });

          const emailData = await emailRes.json();

          if (emailRes.ok) {
            // Log email
            await supabase.from("outreach_emails").insert({
              lead_id: lead.id,
              sequence_step: nextStep,
              subject,
              body,
              status: "sent",
              sent_at: now.toISOString(),
              resend_id: emailData.id,
            });

            // Update lead
            await supabase
              .from("outreach_leads")
              .update({
                current_step: nextStep,
                last_contacted_at: now.toISOString(),
                status: nextStep === 1 ? "contacted" : lead.status,
              })
              .eq("id", lead.id);

            totalSent++;
            hourSent++;
          } else {
            console.error("Resend error:", emailData);
            // Log failed attempt
            await supabase.from("outreach_emails").insert({
              lead_id: lead.id,
              sequence_step: nextStep,
              subject,
              body,
              status: "bounced",
            });
          }
        } catch (err) {
          console.error("Send error for lead", lead.id, err);
        }

        // Small delay between sends
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Outreach send error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function personalizeTemplate(template: string, lead: any, campaign: any): string {
  const appUrl = "https://biblebot.life";
  return template
    .replace(/\{\{church_name\}\}/g, lead.church_name || "")
    .replace(/\{\{churchName\}\}/g, lead.church_name || "")
    .replace(/\{\{contact_name\}\}/g, lead.contact_name || "")
    .replace(/\{\{contactName\}\}/g, lead.contact_name || "")
    .replace(/\{\{pastorName\}\}/g, lead.contact_name || "")
    .replace(/\{\{city\}\}/g, lead.city || "")
    .replace(/\{\{denomination\}\}/g, lead.denomination || "")
    .replace(/\{\{personal_note\}\}/g, lead.personal_note || "")
    .replace(/\{\{booking_url\}\}/g, campaign.booking_url || "")
    .replace(/\{\{sender_name\}\}/g, campaign.sender_name || "")
    .replace(/\{\{previewUrl\}\}/g, `${appUrl}/widget-preview/${lead.id}`)
    .replace(/\{\{screenshotUrl\}\}/g, lead.screenshot_url || "")
    .replace(/\{\{splashUrl\}\}/g, `${appUrl}/splash/${lead.church_name?.toLowerCase().replace(/\s+/g, "-") || lead.id}`)
    .replace(/\{\{websiteScore\}\}/g, lead.website_score?.toString() || "?")
    .replace(/\{\{primaryColor\}\}/g, lead.primary_color || "")
    .replace(/\{\{logoUrl\}\}/g, lead.logo_url || "");
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend";
const REPORT_TO = "reto@biblebot.life";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Emails sent in last 24h
    const { data: emails } = await supabase
      .from("outreach_emails")
      .select("id, lead_id, sequence_step, subject, status, sent_at")
      .gte("sent_at", since.toISOString())
      .order("sent_at", { ascending: false });

    const sent = (emails || []).filter((e) => e.status === "sent");
    const bounced = (emails || []).filter((e) => e.status === "bounced");

    // Hydrate leads
    const leadIds = [...new Set(sent.map((e) => e.lead_id))];
    const { data: leads } = leadIds.length
      ? await supabase
          .from("outreach_leads")
          .select("id, church_name, city, country, email, website")
          .in("id", leadIds)
      : { data: [] as any[] };
    const leadMap = new Map((leads || []).map((l: any) => [l.id, l]));

    // Pipeline runs in last 24h
    const { data: schedules } = await supabase
      .from("pipeline_schedules")
      .select("search_query, country, last_run_at, last_run_status, last_run_log")
      .gte("last_run_at", since.toISOString());

    // Overall funnel stats
    const { count: totalLeads } = await supabase
      .from("outreach_leads")
      .select("*", { count: "exact", head: true });
    const { count: contacted } = await supabase
      .from("outreach_leads")
      .select("*", { count: "exact", head: true })
      .gt("current_step", 0);
    const { count: replied } = await supabase
      .from("outreach_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "replied");

    // Build country breakdown for the day
    const byCountry: Record<string, number> = {};
    for (const e of sent) {
      const l: any = leadMap.get(e.lead_id);
      const c = l?.country || "?";
      byCountry[c] = (byCountry[c] || 0) + 1;
    }
    const byStep: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
    for (const e of sent) byStep[String(e.sequence_step)] = (byStep[String(e.sequence_step)] || 0) + 1;

    const stepLabel = (s: number) =>
      s === 1 ? "Erstkontakt" : s === 2 ? "Follow-up" : s === 3 ? "Break-up" : `Step ${s}`;

    const rowsHtml = sent
      .map((e) => {
        const l: any = leadMap.get(e.lead_id) || {};
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${l.church_name || "?"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${l.city || ""} ${l.country ? `(${l.country})` : ""}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${e.sequence_step ? stepLabel(e.sequence_step) : ""}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#666;">${e.subject || ""}</td>
        </tr>`;
      })
      .join("");

    const pipelineHtml = (schedules || [])
      .map(
        (s: any) =>
          `<li><strong>${s.country || "?"}</strong> · "${s.search_query}" — ${s.last_run_status || "?"}</li>`,
      )
      .join("");

    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#222;max-width:680px;margin:0 auto;padding:24px;">
      <h2 style="color:#C8883A;margin:0 0 4px;">BibleBot.Life · Outreach-Tagesreport</h2>
      <p style="color:#666;margin:0 0 24px;">${now.toLocaleString("de-CH", { dateStyle: "full", timeStyle: "short" })}</p>

      <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:140px;background:#FAF6EE;border-radius:12px;padding:14px;">
          <div style="font-size:11px;color:#888;text-transform:uppercase;">Heute verschickt</div>
          <div style="font-size:28px;font-weight:700;color:#C8883A;">${sent.length}</div>
        </div>
        <div style="flex:1;min-width:140px;background:#FAF6EE;border-radius:12px;padding:14px;">
          <div style="font-size:11px;color:#888;text-transform:uppercase;">Bounces</div>
          <div style="font-size:28px;font-weight:700;color:#b00;">${bounced.length}</div>
        </div>
        <div style="flex:1;min-width:140px;background:#FAF6EE;border-radius:12px;padding:14px;">
          <div style="font-size:11px;color:#888;text-transform:uppercase;">Leads gesamt</div>
          <div style="font-size:28px;font-weight:700;">${totalLeads || 0}</div>
        </div>
        <div style="flex:1;min-width:140px;background:#FAF6EE;border-radius:12px;padding:14px;">
          <div style="font-size:11px;color:#888;text-transform:uppercase;">Antworten</div>
          <div style="font-size:28px;font-weight:700;color:#2a7;">${replied || 0}</div>
        </div>
      </div>

      <h3 style="margin:24px 0 8px;">Aufteilung heute</h3>
      <p style="margin:0 0 12px;">
        ${Object.entries(byCountry).map(([c, n]) => `<span style="display:inline-block;background:#eee;border-radius:6px;padding:3px 8px;margin-right:6px;">${c}: <strong>${n}</strong></span>`).join("")}
      </p>
      <p style="margin:0 0 12px;">
        Erstkontakt: <strong>${byStep["1"] || 0}</strong> · Follow-up: <strong>${byStep["2"] || 0}</strong> · Break-up: <strong>${byStep["3"] || 0}</strong>
      </p>

      ${sent.length ? `<h3 style="margin:24px 0 8px;">Verschickte E-Mails (${sent.length})</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#FAF6EE;text-align:left;">
          <th style="padding:6px 10px;">Gemeinde</th>
          <th style="padding:6px 10px;">Ort</th>
          <th style="padding:6px 10px;">Schritt</th>
          <th style="padding:6px 10px;">Betreff</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>` : `<p style="color:#888;font-style:italic;">Heute wurden keine E-Mails verschickt.</p>`}

      ${pipelineHtml ? `<h3 style="margin:24px 0 8px;">Pipeline-Läufe (24h)</h3>
      <ul>${pipelineHtml}</ul>` : ""}

      <p style="margin-top:32px;color:#888;font-size:12px;">
        Verwaltung: <a href="https://biblebot.life/admin/outreach">Cold Outreach Dashboard</a>
      </p>
    </body></html>`;

    const subject = `📬 Outreach: ${sent.length} verschickt · ${bounced.length} Bounces · ${totalLeads || 0} Leads gesamt`;

    const sendHeaders: Record<string, string> = { "Content-Type": "application/json" };
    let sendUrl = "https://api.resend.com/emails";
    if (lovableKey) {
      sendUrl = `${RESEND_GATEWAY}/emails`;
      sendHeaders["Authorization"] = `Bearer ${lovableKey}`;
      sendHeaders["X-Connection-Api-Key"] = resendKey;
    } else {
      sendHeaders["Authorization"] = `Bearer ${resendKey}`;
    }

    const res = await fetch(sendUrl, {
      method: "POST",
      headers: sendHeaders,
      body: JSON.stringify({
        from: "BibleBot Outreach <reto@biblebot.life>",
        to: [REPORT_TO],
        subject,
        html,
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      console.error("Report send failed", out);
      return new Response(JSON.stringify({ error: out }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_today: sent.length, bounced: bounced.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Resend Broadcasts: synct Audience aus opt-in Kontakten und versendet eine Newsletter-Broadcast
// Versand-Subdomain: mail.biblebot.life (muss in Resend als verified domain konfiguriert sein)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API = "https://api.resend.com";
const FROM_EMAIL = "BibelBot News <news@mail.biblebot.life>";
const REPLY_TO = "hello@biblebot.life";
const AUDIENCE_SETTING_KEY = "resend_audience_id";

async function resend(path: string, init: RequestInit, apiKey: string) {
  const resp = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await resp.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!resp.ok) throw new Error(`Resend ${path} ${resp.status}: ${JSON.stringify(data)}`);
  return data;
}

async function getOrCreateAudience(supabase: any, apiKey: string): Promise<string> {
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", AUDIENCE_SETTING_KEY)
    .maybeSingle();

  if (setting?.value) return setting.value as string;

  const created = await resend("/audiences", {
    method: "POST",
    body: JSON.stringify({ name: "BibelBot Community" }),
  }, apiKey);

  const id = created.id;
  await supabase.from("app_settings").upsert({ key: AUDIENCE_SETTING_KEY, value: id });
  return id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY fehlt");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin-Check via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const action = body.action as "sync" | "send" | "test" | "preview";

    const audienceId = await getOrCreateAudience(supabase, apiKey);

    if (action === "sync") {
      // Opt-in Kontakte ziehen
      const { data: contacts, error } = await supabase.rpc("admin_list_optin_contacts");
      if (error) throw error;

      let added = 0, skipped = 0, errors = 0;
      for (const c of (contacts ?? [])) {
        try {
          await resend(`/audiences/${audienceId}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              email: c.email,
              first_name: (c.display_name || "").split(" ")[0] || undefined,
              unsubscribed: false,
            }),
          }, apiKey);
          added++;
        } catch (e) {
          const msg = String(e);
          if (msg.includes("already exists") || msg.includes("422")) skipped++;
          else { errors++; console.error("Add contact failed:", c.email, msg); }
        }
      }

      return new Response(JSON.stringify({ ok: true, audienceId, total: contacts?.length ?? 0, added, skipped, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test") {
      const to = body.to as string;
      const subject = body.subject as string;
      const html = body.html as string;
      if (!to || !subject || !html) throw new Error("to, subject, html erforderlich");
      const res = await resend("/emails", {
        method: "POST",
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          reply_to: REPLY_TO,
          subject: `[TEST] ${subject}`,
          html,
        }),
      }, apiKey);
      return new Response(JSON.stringify({ ok: true, id: res.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      const subject = body.subject as string;
      const html = body.html as string;
      const preview = (body.preview as string) || "";
      if (!subject || !html) throw new Error("subject und html erforderlich");

      // Footer mit Unsubscribe-Link (Resend ersetzt das Token automatisch)
      const fullHtml = `${html}
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/>
<p style="font-size:12px;color:#6b7280;text-align:center;font-family:Arial,sans-serif">
  Du erhältst diese E-Mail, weil du BibelBot-News abonniert hast.<br/>
  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b7280">Abbestellen</a> ·
  BibelBot.Life
</p>`;

      const broadcast = await resend("/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          audience_id: audienceId,
          from: FROM_EMAIL,
          reply_to: REPLY_TO,
          subject,
          html: fullHtml,
          preview_text: preview || undefined,
          name: `${subject} – ${new Date().toISOString().slice(0, 10)}`,
        }),
      }, apiKey);

      const sendRes = await resend(`/broadcasts/${broadcast.id}/send`, {
        method: "POST",
        body: JSON.stringify({}),
      }, apiKey);

      return new Response(JSON.stringify({ ok: true, broadcastId: broadcast.id, send: sendRes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unbekannte action");
  } catch (e) {
    console.error("send-broadcast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

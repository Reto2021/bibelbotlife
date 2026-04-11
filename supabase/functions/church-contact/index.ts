import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { church_id, sender_name, sender_email, message } = await req.json();

    const email = typeof sender_email === "string" ? sender_email.trim().toLowerCase() : "";
    const name = typeof sender_name === "string" ? sender_name.trim().slice(0, 100) : null;
    const content = typeof message === "string" ? message.trim().slice(0, 5000) : "";
    const isValidUuid = typeof church_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(church_id);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidUuid || !isValidEmail || content.length < 5) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get church info
    const { data: church, error: churchError } = await supabase
      .from("church_partners")
      .select("name, contact_email, is_active")
      .eq("id", church_id)
      .single();

    if (churchError || !church || !church.is_active) {
      return new Response(JSON.stringify({ error: "Church not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store in DB
    const requestId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("church_contact_requests")
      .insert({ id: requestId, church_id, sender_name: name, sender_email: email, message: content });

    if (insertError) throw insertError;

    // Send confirmation email to sender
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-confirmation",
        recipientEmail: email,
        idempotencyKey: `church-contact-confirm-${requestId}`,
        templateData: { name: name || undefined },
      },
    });

    // Notify admin at kontakt@bibelbot.ch
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-notification",
        recipientEmail: "kontakt@bibelbot.ch",
        idempotencyKey: `church-contact-notify-${requestId}`,
        templateData: {
          senderName: name || undefined,
          senderEmail: email,
          churchName: church.name,
          message: content,
          source: `Gemeinde-Kontaktformular (${church.name})`,
        },
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

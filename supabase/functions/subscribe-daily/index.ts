import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SubscribeSchema = z.object({
  channel: z.enum(["push", "telegram", "sms"]),
  first_name: z.string().trim().min(1).max(50).optional(),
  phone_number: z.string().trim().min(8).max(20).optional(),
  language: z.string().trim().min(2).max(10).optional(),
  push_subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }).optional(),
});

const ManageSchema = z.object({
  action: z.enum(["unsubscribe", "status"]),
  subscriber_id: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    // Route: manage existing subscription
    if (body.action) {
      const parsed = ManageSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { action, subscriber_id } = parsed.data;

      if (action === "unsubscribe") {
        const { error } = await supabase
          .from("daily_subscribers")
          .update({ is_active: false })
          .eq("id", subscriber_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: "Du wurdest erfolgreich abgemeldet. 🙏", is_active: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "status") {
        const { data, error } = await supabase
          .from("daily_subscribers")
          .select("id, channel, is_active, language, first_name")
          .eq("id", subscriber_id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          return new Response(
            JSON.stringify({ found: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ found: true, ...data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Route: new subscription
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { channel, first_name, phone_number, language, push_subscription } = parsed.data;

    if (channel === "sms" && !phone_number) {
      return new Response(
        JSON.stringify({ error: "Bitte gib deine Handynummer ein." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (channel === "push" && !push_subscription) {
      return new Response(
        JSON.stringify({ error: "Push-Berechtigung fehlt." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const record: Record<string, unknown> = {
      channel,
      is_active: true,
      language: language || "de",
    };
    if (first_name) record.first_name = first_name;
    if (channel === "sms") record.phone_number = phone_number;
    if (channel === "push") record.push_subscription = push_subscription;

    const { data, error } = await supabase
      .from("daily_subscribers")
      .insert(record)
      .select("id, channel")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Already exists – try to find it and reactivate
        let query = supabase.from("daily_subscribers").select("id, channel, is_active");
        if (channel === "sms") query = query.eq("phone_number", phone_number);
        if (channel === "push") query = query.eq("push_subscription->>endpoint", push_subscription!.endpoint);

        const { data: existing } = await query.eq("channel", channel).maybeSingle();

        if (existing) {
          // Reactivate if inactive
          if (!existing.is_active) {
            await supabase.from("daily_subscribers").update({ is_active: true }).eq("id", existing.id);
          }
          return new Response(
            JSON.stringify({ message: "Du bist bereits angemeldet! 🙏", subscriber_id: existing.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ message: "Du bist bereits angemeldet! 🙏" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: "Anmeldung erfolgreich! Du erhältst ab morgen deinen täglichen Impuls. 🙏",
        subscriber_id: data.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Subscribe error:", e);
    return new Response(
      JSON.stringify({ error: "Vorgang fehlgeschlagen. Bitte versuche es später." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { channel, first_name, phone_number, language, push_subscription } = parsed.data;

    // Validate channel-specific fields
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build record
    const record: Record<string, unknown> = {
      channel,
      is_active: true,
      language: language || 'de',
    };
    if (first_name) record.first_name = first_name;
    if (channel === "sms") record.phone_number = phone_number;
    if (channel === "push") record.push_subscription = push_subscription;
    // telegram subscriptions are handled via the Telegram bot directly

    const { error } = await supabase.from("daily_subscribers").insert(record);

    if (error) {
      // Duplicate check
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ message: "Du bist bereits angemeldet! 🙏" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Anmeldung erfolgreich! Du erhältst ab morgen deinen täglichen Impuls. 🙏" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Subscribe error:", e);
    return new Response(
      JSON.stringify({ error: "Anmeldung fehlgeschlagen. Bitte versuche es später." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

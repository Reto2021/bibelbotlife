import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, customAmountCents } = await req.json();

    const env = (environment || 'sandbox') as StripeEnv;
    const stripe = createStripeClient(env);

    let lineItems;

    if (customAmountCents && typeof customAmountCents === 'number' && customAmountCents >= 100) {
      // Dynamic price_data for custom donation amounts
      lineItems = [{
        price_data: {
          currency: "chf",
          product_data: { name: "Spende an BibleBot.Life" },
          unit_amount: customAmountCents,
        },
        quantity: 1,
      }];
    } else if (priceId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(priceId)) {
        return new Response(JSON.stringify({ error: "Invalid priceId" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const prices = await stripe.prices.list({ lookup_keys: [priceId] });
      if (!prices.data.length) {
        return new Response(JSON.stringify({ error: "Price not found" }), {
          status: 404, headers: corsHeaders,
        });
      }
      const stripePrice = prices.data[0];
      lineItems = [{ price: stripePrice.id, quantity: quantity || 1 }];
    } else {
      return new Response(JSON.stringify({ error: "priceId or customAmountCents required" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const isRecurring = priceId && !customAmountCents
      ? (await stripe.prices.list({ lookup_keys: [priceId] })).data[0]?.type === "recurring"
      : false;

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/spenden/danke?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(userId && {
        metadata: { userId },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      }),
    });

    // Sync revenue to GHL (fire-and-forget)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      const amountCents = customAmountCents || (lineItems[0]?.price_data?.unit_amount ?? 0);
      const syncType = priceId && !customAmountCents ? "church_subscription" : "donation";
      fetch(`${supabaseUrl}/functions/v1/ghl-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: syncType,
          data: {
            email: customerEmail || "",
            amount: amountCents / 100,
            currency: "CHF",
            ...(syncType === "church_subscription" && {
              planTier: priceId || "",
              interval: isRecurring ? "recurring" : "one_time",
            }),
          },
        }),
      }).catch((e) => console.error("GHL sync error:", e));
    }

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});

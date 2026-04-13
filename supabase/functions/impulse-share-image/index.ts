import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { verse, reference, teaser, topic, date } = await req.json();

    if (!verse || !reference || !date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: verse, reference, date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if image already exists for this date
    const fileName = `impulse-${date}.png`;
    const { data: existing } = await supabase.storage
      .from("share-images")
      .createSignedUrl(fileName, 60);

    if (existing?.signedUrl) {
      // File exists, return public URL
      const { data: publicUrl } = supabase.storage
        .from("share-images")
        .getPublicUrl(fileName);
      return new Response(
        JSON.stringify({ imageUrl: publicUrl.publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate AI image
    const imagePrompt = `Create a 1080x1080 square artistic background image for a Bible verse sharing card.

Theme: "${topic || 'Faith'}"

CRITICAL REQUIREMENTS:
- ABSOLUTELY NO text, letters, words, or typography anywhere in the image
- NO people, NO faces, NO hands
- The image will have dark text overlaid on it, so keep the overall image DARK and moody
- Use deep, rich tones: dark navy (#0f1a2e), deep teal (#1a3a3a), muted warm amber accents
- Avoid bright/light areas especially in the top-left quadrant and bottom strip (text will go there)

Style:
- Abstract, atmospheric, contemplative — like a meditation app background
- Soft light rays, gentle bokeh, organic textures, subtle nature elements
- Think: dark moody landscape photography meets abstract art
- Golden hour warmth filtered through deep shadow
- Ethereal, cinematic quality — premium wellness brand aesthetic
- Subtle depth with layered gradients and atmospheric haze

The image must work as a dark canvas where white/cream text will be highly readable on top.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Image generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageBase64 =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("share-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to store image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("share-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

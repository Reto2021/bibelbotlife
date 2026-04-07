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
    const imagePrompt = `Create a modern, artistic, Instagram-worthy social media image (1080x1920 portrait/story format) for a daily Bible verse inspiration card. 

Theme/Topic: "${topic || 'Faith'}"
Mood: Contemplative, hopeful, modern

Style requirements:
- Abstract, artistic background with warm golden and deep blue tones
- Modern minimalist aesthetic that young adults (20-35) would share on Instagram Stories
- Atmospheric, dreamy quality - think golden hour light, soft gradients, organic textures
- NO text, NO letters, NO words, NO typography on the image
- NO people, NO faces
- Clean, elevated, magazine-quality composition
- Subtle spiritual symbolism (light rays, nature elements, geometric patterns)
- Color palette: warm gold (#D4911A), deep navy (#1a1a2e), soft cream, touches of amber

This should look like a premium wellness/spirituality brand post - sophisticated, not churchy.`;

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

// Edge Function: generate-verse-card
// Server-side PNG rendering via Satori + Resvg (WASM).
// Renders a 1200x630 OG share image for a given verse_card id,
// uploads to the share-images bucket and updates verse_cards.image_url.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import satori from "https://esm.sh/satori@0.10.13";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- One-time module init (font + wasm) ---------------------------------
let fontBuf: ArrayBuffer | null = null;
let fontBoldBuf: ArrayBuffer | null = null;
let serifBuf: ArrayBuffer | null = null;
let wasmReady: Promise<void> | null = null;

async function loadFont(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`font fetch failed: ${url} ${r.status}`);
  return await r.arrayBuffer();
}

async function ensureAssets() {
  if (!fontBuf) {
    fontBuf = await loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
    );
  }
  if (!fontBoldBuf) {
    fontBoldBuf = await loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
    );
  }
  if (!serifBuf) {
    // Cormorant Garamond as warm serif for the verse text
    serifBuf = await loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-500-italic.ttf",
    );
  }
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasmResp = await fetch(
        "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      );
      const wasm = await wasmResp.arrayBuffer();
      await initWasm(wasm);
    })();
  }
  await wasmReady;
}

// ---- Card layout (Satori object tree, no JSX) ---------------------------
function buildCard(opts: {
  verseText: string;
  verseRef: string;
  explanation: string;
}) {
  const { verseText, verseRef, explanation } = opts;
  const verseSize = verseText.length > 200 ? 38 : verseText.length > 120 ? 46 : 56;

  return {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px 80px",
        background:
          "linear-gradient(160deg, #F4E4C1 0%, #E8C896 35%, #C8883A 75%, #8B5A1F 100%)",
        fontFamily: "Inter",
        color: "#2A1810",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 20,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(42,24,16,0.7)",
              fontWeight: 600,
            },
            children: "Dein Vers",
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              marginTop: 20,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: verseSize,
                    lineHeight: 1.3,
                    fontFamily: "Cormorant",
                    fontStyle: "italic",
                    color: "#2A1810",
                  },
                  children: `«${verseText}»`,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#6B3410",
                    marginTop: 24,
                  },
                  children: verseRef,
                },
              },
              explanation
                ? {
                    type: "div",
                    props: {
                      style: {
                        fontSize: 22,
                        lineHeight: 1.5,
                        color: "rgba(42,24,16,0.85)",
                        marginTop: 24,
                      },
                      children: explanation.slice(0, 240),
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                        },
                        children: "biblebot.life",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 16,
                          color: "rgba(42,24,16,0.65)",
                          marginTop: 4,
                        },
                        children: "Dein persönlicher Bibel-Begleiter",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  } as any;
}

async function renderPng(card: { verse_text: string; verse_ref: string; explanation: string }) {
  await ensureAssets();

  const svg = await satori(
    buildCard({
      verseText: card.verse_text,
      verseRef: card.verse_ref,
      explanation: card.explanation,
    }),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontBuf!, weight: 400, style: "normal" },
        { name: "Inter", data: fontBoldBuf!, weight: 700, style: "normal" },
        { name: "Cormorant", data: serifBuf!, weight: 500, style: "italic" },
      ],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const png = resvg.render().asPng();
  return png;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: card, error: fetchErr } = await supabase
      .from("verse_cards")
      .select("id, verse_text, verse_ref, explanation, image_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !card) {
      return new Response(JSON.stringify({ error: "card not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already rendered? return cached.
    if (card.image_url) {
      return new Response(JSON.stringify({ image_url: card.image_url, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const png = await renderPng(card);
    const path = `verse-cards/${id}.png`;
    const { error: upErr } = await supabase.storage
      .from("share-images")
      .upload(path, png, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("share-images").getPublicUrl(path);
    const image_url = pub.publicUrl;

    await supabase.from("verse_cards").update({ image_url }).eq("id", id);

    return new Response(JSON.stringify({ image_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-verse-card error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

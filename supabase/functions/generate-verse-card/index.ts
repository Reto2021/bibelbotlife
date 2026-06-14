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

// ---- Mood symbols (inline SVG → data URL) -------------------------------
function moodSvg(mood: string, size = 160): string | null {
  const s = size;
  const c = s / 2;
  const gL = "rgba(255,230,180,0.55)";
  const gM = "rgba(232,200,150,0.45)";
  const gD = "rgba(139,90,31,0.35)";
  const gC = "rgba(255,245,220,0.85)";
  let inner = "";
  switch (mood) {
    case "dankbar": {
      inner += `<circle cx="${c}" cy="${c}" r="${s * 0.22}" fill="${gL}"/>`;
      for (let i = 0; i < 8; i++) {
        const deg = i * 45;
        const rad = (deg * Math.PI) / 180;
        const x1 = c + Math.cos(rad) * s * 0.32;
        const y1 = c + Math.sin(rad) * s * 0.32;
        const x2 = c + Math.cos(rad) * s * 0.46;
        const y2 = c + Math.sin(rad) * s * 0.46;
        inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i % 2 === 0 ? gL : gM}" stroke-width="${s * 0.025}" stroke-linecap="round"/>`;
      }
      break;
    }
    case "aengstlich": {
      inner += `<circle cx="${c}" cy="${c - s * 0.05}" r="${s * 0.38}" fill="${gM}" opacity="0.3"/>`;
      inner += `<ellipse cx="${c}" cy="${c - s * 0.08}" rx="${s * 0.12}" ry="${s * 0.22}" fill="${gL}"/>`;
      inner += `<ellipse cx="${c}" cy="${c - s * 0.05}" rx="${s * 0.06}" ry="${s * 0.14}" fill="rgba(255,245,220,0.8)"/>`;
      break;
    }
    case "traurig": {
      [0.2, 0.35, 0.5, 0.65, 0.8].forEach((xRel, i) => {
        inner += `<ellipse cx="${s * xRel}" cy="${s * (0.25 + i * 0.12)}" rx="${s * 0.04}" ry="${s * 0.06}" fill="${i < 2 ? gD : gM}" opacity="${0.5 + i * 0.1}"/>`;
      });
      inner += `<ellipse cx="${c}" cy="${s * 0.82}" rx="${s * 0.35}" ry="${s * 0.08}" fill="${gL}" opacity="0.4"/>`;
      break;
    }
    case "suchend": {
      inner += `<circle cx="${c}" cy="${c}" r="${s * 0.32}" fill="none" stroke="${gM}" stroke-width="${s * 0.02}"/>`;
      inner += `<polygon points="${c},${s * 0.18} ${c - s * 0.08},${c + s * 0.1} ${c + s * 0.08},${c + s * 0.1}" fill="${gL}"/>`;
      inner += `<polygon points="${c},${s * 0.82} ${c - s * 0.06},${c - s * 0.08} ${c + s * 0.06},${c - s * 0.08}" fill="${gD}"/>`;
      inner += `<circle cx="${c}" cy="${c}" r="${s * 0.04}" fill="${gL}"/>`;
      break;
    }
    case "hoffnungsvoll": {
      inner += `<polygon points="0,0 ${s * 0.6},0 0,${s * 0.45}" fill="${gL}" opacity="0.25"/>`;
      inner += `<polygon points="0,0 ${s * 0.35},0 0,${s * 0.25}" fill="${gL}" opacity="0.4"/>`;
      inner += `<circle cx="${s * 0.18}" cy="${s * 0.18}" r="${s * 0.14}" fill="${gL}" opacity="0.5"/>`;
      break;
    }
    case "muede": {
      inner += `<circle cx="${c - s * 0.06}" cy="${c - s * 0.15}" r="${s * 0.2}" fill="${gM}"/>`;
      inner += `<circle cx="${c + s * 0.02}" cy="${c - s * 0.18}" r="${s * 0.18}" fill="${gC}"/>`;
      [0.58, 0.68, 0.78].forEach((y, i) => {
        inner += `<ellipse cx="${c}" cy="${s * y}" rx="${s * (0.3 - i * 0.05)}" ry="${s * 0.015}" fill="${gD}" opacity="0.4"/>`;
      });
      break;
    }
    default:
      return null;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---- Card layout (Satori object tree, no JSX) ---------------------------
function buildCard(opts: {
  verseText: string;
  verseRef: string;
  explanation: string;
  mood?: string | null;
}) {
  const { verseText, verseRef, explanation, mood } = opts;
  const verseSize = verseText.length > 200 ? 38 : verseText.length > 120 ? 46 : 56;
  const symbolUrl = mood ? moodSvg(mood, 140) : null;

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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
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
              symbolUrl
                ? {
                    type: "img",
                    props: {
                      src: symbolUrl,
                      width: 90,
                      height: 90,
                      style: { width: 90, height: 90 },
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

async function renderPng(card: { verse_text: string; verse_ref: string; explanation: string; mood?: string | null }) {
  await ensureAssets();

  const svg = await satori(
    buildCard({
      verseText: card.verse_text,
      verseRef: card.verse_ref,
      explanation: card.explanation,
      mood: card.mood,
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

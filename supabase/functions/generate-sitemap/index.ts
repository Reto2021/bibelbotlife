import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://biblebot.life";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STATIC_PAGES: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/bibel", priority: 0.9, changefreq: "weekly" },
  { path: "/bibelquiz", priority: 0.8, changefreq: "weekly" },
  { path: "/gebetswand", priority: 0.7, changefreq: "daily" },
  { path: "/for-churches", priority: 0.8, changefreq: "monthly" },
  { path: "/for-institutions", priority: 0.7, changefreq: "monthly" },
  { path: "/fuer-seelsorger", priority: 0.7, changefreq: "monthly" },
  { path: "/unterrichtsplaner", priority: 0.7, changefreq: "monthly" },
  { path: "/churches", priority: 0.7, changefreq: "weekly" },
  { path: "/spenden", priority: 0.5, changefreq: "monthly" },
  { path: "/kontakt", priority: 0.4, changefreq: "yearly" },
  { path: "/ueber-uns", priority: 0.4, changefreq: "monthly" },
  { path: "/impressum", priority: 0.2, changefreq: "yearly" },
  { path: "/datenschutz", priority: 0.2, changefreq: "yearly" },
];

function urlEntry(loc: string, opts: { lastmod?: string; changefreq?: string; priority?: number } = {}) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : "",
    opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : "",
    opts.priority !== undefined ? `    <priority>${opts.priority.toFixed(1)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Static pages
    const entries: string[] = STATIC_PAGES.map((p) =>
      urlEntry(`${SITE}${p.path}`, {
        priority: p.priority,
        changefreq: p.changefreq,
      })
    );

    // Topic hubs
    const { data: topics } = await supabase
      .from("seo_topics")
      .select("slug, updated_at, language")
      .eq("is_published", true)
      .eq("language", "de");

    if (topics) {
      for (const t of topics) {
        entries.push(
          urlEntry(`${SITE}/themen/${t.slug}`, {
            lastmod: t.updated_at?.split("T")[0],
            changefreq: "weekly",
            priority: 0.7,
          })
        );
      }
    }

    // Verse landing pages
    const { data: verses } = await supabase
      .from("verse_seo_content")
      .select("reference_slug, updated_at, language, is_featured")
      .eq("language", "de")
      .order("is_featured", { ascending: false })
      .limit(5000);

    if (verses) {
      for (const v of verses) {
        entries.push(
          urlEntry(`${SITE}/vers/${v.reference_slug}`, {
            lastmod: v.updated_at?.split("T")[0],
            changefreq: "monthly",
            priority: v.is_featured ? 0.8 : 0.5,
          })
        );
      }
    }

    // Public church partner pages
    const { data: churches } = await supabase
      .from("church_partners")
      .select("slug, updated_at")
      .eq("is_active", true);

    if (churches) {
      for (const c of churches) {
        entries.push(
          urlEntry(`${SITE}/church/${c.slug}`, {
            lastmod: c.updated_at?.split("T")[0],
            changefreq: "monthly",
            priority: 0.6,
          })
        );
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[generate-sitemap] error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});

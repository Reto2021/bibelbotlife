import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://biblebot.life";

const SUPPORTED_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

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

interface UrlOpts {
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  /** If provided, emits xhtml:link alternates for each language using ?lng= */
  altLangs?: string[];
}

function urlEntry(loc: string, opts: UrlOpts = {}) {
  const lines: string[] = [
    "  <url>",
    `    <loc>${loc}</loc>`,
  ];
  if (opts.altLangs?.length) {
    for (const l of opts.altLangs) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}?lng=${l}"/>`
      );
    }
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`
    );
  }
  if (opts.lastmod) lines.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) lines.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority !== undefined) lines.push(`    <priority>${opts.priority.toFixed(1)}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
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

    const entries: string[] = STATIC_PAGES.map((p) =>
      urlEntry(`${SITE}${p.path}`, {
        priority: p.priority,
        changefreq: p.changefreq,
        altLangs: SUPPORTED_LANGS,
      })
    );

    // Topic hubs — group by slug, emit per-slug entry with alternates for available langs
    const { data: topics } = await supabase
      .from("seo_topics")
      .select("slug, updated_at, language")
      .eq("is_published", true);

    if (topics) {
      const bySlug = new Map<string, { langs: string[]; lastmod?: string }>();
      for (const t of topics) {
        const e = bySlug.get(t.slug) ?? { langs: [], lastmod: undefined };
        e.langs.push(t.language);
        const d = t.updated_at?.split("T")[0];
        if (d && (!e.lastmod || d > e.lastmod)) e.lastmod = d;
        bySlug.set(t.slug, e);
      }
      for (const [slug, e] of bySlug) {
        entries.push(
          urlEntry(`${SITE}/themen/${slug}`, {
            lastmod: e.lastmod,
            changefreq: "weekly",
            priority: 0.75,
            altLangs: e.langs,
          })
        );
      }
    }

    // Verse landing pages — same: group by slug, alternates per language
    const { data: verses } = await supabase
      .from("verse_seo_content")
      .select("reference_slug, updated_at, language, is_featured")
      .order("is_featured", { ascending: false })
      .limit(20000);

    if (verses) {
      const bySlug = new Map<string, { langs: string[]; lastmod?: string; featured: boolean }>();
      for (const v of verses) {
        const e = bySlug.get(v.reference_slug) ?? { langs: [], lastmod: undefined, featured: false };
        e.langs.push(v.language);
        if (v.is_featured) e.featured = true;
        const d = v.updated_at?.split("T")[0];
        if (d && (!e.lastmod || d > e.lastmod)) e.lastmod = d;
        bySlug.set(v.reference_slug, e);
      }
      for (const [slug, e] of bySlug) {
        entries.push(
          urlEntry(`${SITE}/vers/${slug}`, {
            lastmod: e.lastmod,
            changefreq: "monthly",
            priority: e.featured ? 0.8 : 0.5,
            altLangs: e.langs,
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
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

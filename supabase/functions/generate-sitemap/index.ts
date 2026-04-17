// Sitemap generator with sitemap-index pattern.
// Routes:
//   GET /generate-sitemap                 → sitemap index (default)
//   GET /generate-sitemap?type=index      → sitemap index
//   GET /generate-sitemap?type=core       → static + church-partner pages
//   GET /generate-sitemap?type=verses     → bible verse landing pages (all langs as alternates)
//   GET /generate-sitemap?type=topics&lang=de → topic pages for a single language

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://biblebot.life";
const FN_BASE = "https://swsthxftugjqznqjcfpk.supabase.co/functions/v1/generate-sitemap";

const SUPPORTED_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  altLangs?: string[];
}

function urlEntry(loc: string, opts: UrlOpts = {}) {
  const lines: string[] = ["  <url>", `    <loc>${loc}</loc>`];
  if (opts.altLangs?.length) {
    for (const l of opts.altLangs) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}?lng=${l}"/>`);
    }
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`);
  }
  if (opts.lastmod) lines.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) lines.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority !== undefined) lines.push(`    <priority>${opts.priority.toFixed(1)}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

function sitemapIndex(today: string): string {
  const items: string[] = [];
  items.push(`  <sitemap><loc>${FN_BASE}?type=core</loc><lastmod>${today}</lastmod></sitemap>`);
  items.push(`  <sitemap><loc>${FN_BASE}?type=verses</loc><lastmod>${today}</lastmod></sitemap>`);
  for (const lang of SUPPORTED_LANGS) {
    items.push(`  <sitemap><loc>${FN_BASE}?type=topics&amp;lang=${lang}</loc><lastmod>${today}</lastmod></sitemap>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join("\n")}
</sitemapindex>`;
}

const xmlResponse = (xml: string) =>
  new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "index";
  const today = new Date().toISOString().split("T")[0];

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Sitemap Index ───────────────────────────────────────────
    if (type === "index") {
      return xmlResponse(sitemapIndex(today));
    }

    // ─── Core: static pages + church partners ────────────────────
    if (type === "core") {
      const entries: string[] = STATIC_PAGES.map((p) =>
        urlEntry(`${SITE}${p.path}`, {
          priority: p.priority,
          changefreq: p.changefreq,
          altLangs: SUPPORTED_LANGS,
        })
      );

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

      return xmlResponse(wrapUrlset(entries));
    }

    // ─── Verses: bible verse landing pages ───────────────────────
    if (type === "verses") {
      const { data: verses } = await supabase
        .from("verse_seo_content")
        .select("reference_slug, updated_at, language, is_featured")
        .order("is_featured", { ascending: false })
        .limit(20000);

      const entries: string[] = [];
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
      return xmlResponse(wrapUrlset(entries));
    }

    // ─── Topics per language ─────────────────────────────────────
    if (type === "topics") {
      const lang = url.searchParams.get("lang") ?? "de";
      if (!SUPPORTED_LANGS.includes(lang)) {
        return xmlResponse(wrapUrlset([]));
      }

      const { data: topics } = await supabase
        .from("seo_topics")
        .select("slug, updated_at")
        .eq("is_published", true)
        .eq("language", lang);

      // Get all available langs per slug for hreflang alternates
      const { data: allLangs } = await supabase
        .from("seo_topics")
        .select("slug, language")
        .eq("is_published", true);

      const langsBySlug = new Map<string, string[]>();
      for (const r of allLangs ?? []) {
        const arr = langsBySlug.get(r.slug) ?? [];
        arr.push(r.language);
        langsBySlug.set(r.slug, arr);
      }

      const entries: string[] = [];
      for (const t of topics ?? []) {
        entries.push(
          urlEntry(`${SITE}/themen/${t.slug}`, {
            lastmod: t.updated_at?.split("T")[0],
            changefreq: "weekly",
            priority: 0.75,
            altLangs: langsBySlug.get(t.slug) ?? [lang],
          })
        );
      }
      return xmlResponse(wrapUrlset(entries));
    }

    // Unknown type → fallback to index
    return xmlResponse(sitemapIndex(today));
  } catch (err) {
    console.error("[generate-sitemap] error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
});

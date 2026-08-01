// Generates public/sitemap.xml. Run manually: bunx tsx scripts/generate-sitemap.ts
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://biblebot.life";
const SUPABASE_URL = "https://swsthxftugjqznqjcfpk.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3c3RoeGZ0dWdqcXpucWpjZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDk2OTEsImV4cCI6MjA5MTEyNTY5MX0.PA5KmApM_W0sngwt5LmGssh8vcZVU7N0-XA8Dhd3lVU";

interface Entry { path: string; changefreq?: string; priority?: string; lastmod?: string; }

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/bible-search", changefreq: "weekly", priority: "0.8" },
  { path: "/bibelquiz", changefreq: "weekly", priority: "0.7" },
  { path: "/gebetswand", changefreq: "daily", priority: "0.7" },
  { path: "/mein-vers", changefreq: "weekly", priority: "0.7" },
  { path: "/mein-kreis", changefreq: "weekly", priority: "0.6" },
  { path: "/ki-und-seelsorge", changefreq: "monthly", priority: "0.7" },
  { path: "/for-churches", changefreq: "monthly", priority: "0.8" },
  { path: "/fuer-seelsorger", changefreq: "monthly", priority: "0.7" },
  { path: "/unterrichtsplaner", changefreq: "monthly", priority: "0.7" },
  { path: "/fuer-lehrer", changefreq: "monthly", priority: "0.6" },
  { path: "/fuer-lehrkraefte", changefreq: "monthly", priority: "0.6" },
  { path: "/for-institutions", changefreq: "monthly", priority: "0.7" },
  { path: "/churches", changefreq: "weekly", priority: "0.7" },
  { path: "/widget", changefreq: "monthly", priority: "0.5" },
  { path: "/embed", changefreq: "monthly", priority: "0.4" },
  { path: "/analytics", changefreq: "monthly", priority: "0.4" },
  { path: "/spenden", changefreq: "monthly", priority: "0.5" },
  { path: "/ueber-uns", changefreq: "monthly", priority: "0.5" },
  { path: "/presse", changefreq: "monthly", priority: "0.4" },
  { path: "/flyer", changefreq: "monthly", priority: "0.4" },
  { path: "/kontakt", changefreq: "monthly", priority: "0.5" },
  { path: "/login", changefreq: "monthly", priority: "0.4" },
  { path: "/impressum", changefreq: "yearly", priority: "0.3" },
  { path: "/datenschutz", changefreq: "yearly", priority: "0.3" },
  { path: "/guide/ai-bible-study", changefreq: "monthly", priority: "0.7" },
  { path: "/guide/discord-integration", changefreq: "monthly", priority: "0.7" },
  { path: "/bibel-bot-vergleich", changefreq: "monthly", priority: "0.8" },
  { path: "/kreuzwege", changefreq: "daily", priority: "0.8" },
  { path: "/wegkreuze", changefreq: "weekly", priority: "0.7" },
  { path: "/gipfelkreuze", changefreq: "weekly", priority: "0.7" },
  { path: "/bergkreuze", changefreq: "weekly", priority: "0.7" },
];

async function fetchJson(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!r.ok) return [];
  return r.json();
}

async function fetchRpc(fn: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) return [];
  return r.json();
}

async function main() {
  const entries: Entry[] = [...staticEntries];

  // Kreuzwege detail pages: one entry per approved cross post.
  let crosses = (await fetchJson(
    "cross_posts?select=slug,updated_at,created_at&status=eq.approved&slug=not.is.null",
  )) as { slug: string; updated_at?: string; created_at?: string }[];
  if (!Array.isArray(crosses) || crosses.length === 0) {
    crosses = (await fetchRpc("get_approved_cross_posts")) as typeof crosses;
  }
  for (const c of Array.isArray(crosses) ? crosses : []) {
    if (!c?.slug) continue;
    entries.push({
      path: `/kreuzwege/${c.slug}`,
      changefreq: "monthly",
      priority: "0.6",
      lastmod: (c.updated_at ?? c.created_at)?.split("T")[0],
    });
  }

  // church_partners has RLS that may block anon; merge fetched slugs with known public partners.
  const fetched = (await fetchJson("church_partners?select=slug&slug=not.is.null")) as { slug: string }[];
  const knownPublic = ["testgemeinde"];
  const churchSlugs = Array.from(new Set([...knownPublic, ...fetched.map((c) => c.slug)]));
  for (const slug of churchSlugs) {
    entries.push({ path: `/church/${slug}`, changefreq: "weekly", priority: "0.6" });
    entries.push({ path: `/church-integration/${slug}`, changefreq: "monthly", priority: "0.5" });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${BASE_URL}${e.path}</loc>` +
          (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "") +
          (e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : "") +
          (e.priority ? `<priority>${e.priority}</priority>` : "") +
          `</url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();

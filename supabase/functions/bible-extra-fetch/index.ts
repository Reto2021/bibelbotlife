// Edge Function: bible-extra-fetch
// Lädt ein Kapitel oder einzelne Verse einer auf bibel.github.io gehosteten Übersetzung.
// - Gemeinfreie Übersetzungen (HRD, GRU, SLT1951, LU1545) → bible_verses (öffentlich lesbar)
// - Geschützte Übersetzungen → bible_verses_restricted (nur Service-Role / Chat-Backend)
// Nutzt einen Cache via bible_chapter_fetch_log, um doppeltes Scrapen zu vermeiden.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Buchnamen-Mapping: kanonische Namen → bibel.github.io-Pfad-Slug ──
// bibel.github.io verwendet Kürzel wie "Joh", "1Mo", "Ps" usw.
// Quelle: Pfade auf https://bibel.github.io/<Übersetzung>/<Buch>/<Kapitel>.html
const BOOK_SLUG: Record<string, { slug: string; number: number; canonical: string }> = {
  // AT
  "1mo": { slug: "1Mo", number: 1, canonical: "1. Mose" },
  "genesis": { slug: "1Mo", number: 1, canonical: "1. Mose" },
  "1mose": { slug: "1Mo", number: 1, canonical: "1. Mose" },
  "2mo": { slug: "2Mo", number: 2, canonical: "2. Mose" },
  "exodus": { slug: "2Mo", number: 2, canonical: "2. Mose" },
  "2mose": { slug: "2Mo", number: 2, canonical: "2. Mose" },
  "3mo": { slug: "3Mo", number: 3, canonical: "3. Mose" },
  "levitikus": { slug: "3Mo", number: 3, canonical: "3. Mose" },
  "3mose": { slug: "3Mo", number: 3, canonical: "3. Mose" },
  "4mo": { slug: "4Mo", number: 4, canonical: "4. Mose" },
  "numeri": { slug: "4Mo", number: 4, canonical: "4. Mose" },
  "4mose": { slug: "4Mo", number: 4, canonical: "4. Mose" },
  "5mo": { slug: "5Mo", number: 5, canonical: "5. Mose" },
  "deuteronomium": { slug: "5Mo", number: 5, canonical: "5. Mose" },
  "5mose": { slug: "5Mo", number: 5, canonical: "5. Mose" },
  "jos": { slug: "Jos", number: 6, canonical: "Josua" },
  "josua": { slug: "Jos", number: 6, canonical: "Josua" },
  "ri": { slug: "Ri", number: 7, canonical: "Richter" },
  "richter": { slug: "Ri", number: 7, canonical: "Richter" },
  "rut": { slug: "Rut", number: 8, canonical: "Rut" },
  "ruth": { slug: "Rut", number: 8, canonical: "Rut" },
  "1sam": { slug: "1Sam", number: 9, canonical: "1. Samuel" },
  "1samuel": { slug: "1Sam", number: 9, canonical: "1. Samuel" },
  "2sam": { slug: "2Sam", number: 10, canonical: "2. Samuel" },
  "2samuel": { slug: "2Sam", number: 10, canonical: "2. Samuel" },
  "1kon": { slug: "1Kon", number: 11, canonical: "1. Könige" },
  "1koen": { slug: "1Kon", number: 11, canonical: "1. Könige" },
  "1koenige": { slug: "1Kon", number: 11, canonical: "1. Könige" },
  "1könige": { slug: "1Kon", number: 11, canonical: "1. Könige" },
  "2kon": { slug: "2Kon", number: 12, canonical: "2. Könige" },
  "2koen": { slug: "2Kon", number: 12, canonical: "2. Könige" },
  "2koenige": { slug: "2Kon", number: 12, canonical: "2. Könige" },
  "2könige": { slug: "2Kon", number: 12, canonical: "2. Könige" },
  "1chr": { slug: "1Chr", number: 13, canonical: "1. Chronik" },
  "1chronik": { slug: "1Chr", number: 13, canonical: "1. Chronik" },
  "2chr": { slug: "2Chr", number: 14, canonical: "2. Chronik" },
  "2chronik": { slug: "2Chr", number: 14, canonical: "2. Chronik" },
  "esr": { slug: "Esr", number: 15, canonical: "Esra" },
  "esra": { slug: "Esr", number: 15, canonical: "Esra" },
  "neh": { slug: "Neh", number: 16, canonical: "Nehemia" },
  "nehemia": { slug: "Neh", number: 16, canonical: "Nehemia" },
  "est": { slug: "Est", number: 17, canonical: "Ester" },
  "ester": { slug: "Est", number: 17, canonical: "Ester" },
  "esther": { slug: "Est", number: 17, canonical: "Ester" },
  "hi": { slug: "Hi", number: 18, canonical: "Hiob" },
  "hiob": { slug: "Hi", number: 18, canonical: "Hiob" },
  "ijob": { slug: "Hi", number: 18, canonical: "Hiob" },
  "ps": { slug: "Ps", number: 19, canonical: "Psalm" },
  "psalm": { slug: "Ps", number: 19, canonical: "Psalm" },
  "psalmen": { slug: "Ps", number: 19, canonical: "Psalm" },
  "spr": { slug: "Spr", number: 20, canonical: "Sprüche" },
  "sprueche": { slug: "Spr", number: 20, canonical: "Sprüche" },
  "sprüche": { slug: "Spr", number: 20, canonical: "Sprüche" },
  "pred": { slug: "Pred", number: 21, canonical: "Prediger" },
  "prediger": { slug: "Pred", number: 21, canonical: "Prediger" },
  "kohelet": { slug: "Pred", number: 21, canonical: "Prediger" },
  "hl": { slug: "Hl", number: 22, canonical: "Hohelied" },
  "hohelied": { slug: "Hl", number: 22, canonical: "Hohelied" },
  "hoheslied": { slug: "Hl", number: 22, canonical: "Hohelied" },
  "jes": { slug: "Jes", number: 23, canonical: "Jesaja" },
  "jesaja": { slug: "Jes", number: 23, canonical: "Jesaja" },
  "jer": { slug: "Jer", number: 24, canonical: "Jeremia" },
  "jeremia": { slug: "Jer", number: 24, canonical: "Jeremia" },
  "klgl": { slug: "Klgl", number: 25, canonical: "Klagelieder" },
  "klagelieder": { slug: "Klgl", number: 25, canonical: "Klagelieder" },
  "hes": { slug: "Hes", number: 26, canonical: "Hesekiel" },
  "hesekiel": { slug: "Hes", number: 26, canonical: "Hesekiel" },
  "ezechiel": { slug: "Hes", number: 26, canonical: "Hesekiel" },
  "dan": { slug: "Dan", number: 27, canonical: "Daniel" },
  "daniel": { slug: "Dan", number: 27, canonical: "Daniel" },
  "hos": { slug: "Hos", number: 28, canonical: "Hosea" },
  "hosea": { slug: "Hos", number: 28, canonical: "Hosea" },
  "joel": { slug: "Joel", number: 29, canonical: "Joel" },
  "am": { slug: "Am", number: 30, canonical: "Amos" },
  "amos": { slug: "Am", number: 30, canonical: "Amos" },
  "ob": { slug: "Ob", number: 31, canonical: "Obadja" },
  "obadja": { slug: "Ob", number: 31, canonical: "Obadja" },
  "jon": { slug: "Jon", number: 32, canonical: "Jona" },
  "jona": { slug: "Jon", number: 32, canonical: "Jona" },
  "mi": { slug: "Mi", number: 33, canonical: "Micha" },
  "micha": { slug: "Mi", number: 33, canonical: "Micha" },
  "nah": { slug: "Nah", number: 34, canonical: "Nahum" },
  "nahum": { slug: "Nah", number: 34, canonical: "Nahum" },
  "hab": { slug: "Hab", number: 35, canonical: "Habakuk" },
  "habakuk": { slug: "Hab", number: 35, canonical: "Habakuk" },
  "zef": { slug: "Zef", number: 36, canonical: "Zefanja" },
  "zefanja": { slug: "Zef", number: 36, canonical: "Zefanja" },
  "hag": { slug: "Hag", number: 37, canonical: "Haggai" },
  "haggai": { slug: "Hag", number: 37, canonical: "Haggai" },
  "sach": { slug: "Sach", number: 38, canonical: "Sacharja" },
  "sacharja": { slug: "Sach", number: 38, canonical: "Sacharja" },
  "mal": { slug: "Mal", number: 39, canonical: "Maleachi" },
  "maleachi": { slug: "Mal", number: 39, canonical: "Maleachi" },
  // NT
  "mt": { slug: "Mt", number: 40, canonical: "Matthäus" },
  "matt": { slug: "Mt", number: 40, canonical: "Matthäus" },
  "matthaeus": { slug: "Mt", number: 40, canonical: "Matthäus" },
  "matthäus": { slug: "Mt", number: 40, canonical: "Matthäus" },
  "mk": { slug: "Mk", number: 41, canonical: "Markus" },
  "markus": { slug: "Mk", number: 41, canonical: "Markus" },
  "lk": { slug: "Lk", number: 42, canonical: "Lukas" },
  "lukas": { slug: "Lk", number: 42, canonical: "Lukas" },
  "joh": { slug: "Joh", number: 43, canonical: "Johannes" },
  "johannes": { slug: "Joh", number: 43, canonical: "Johannes" },
  "apg": { slug: "Apg", number: 44, canonical: "Apostelgeschichte" },
  "apostelgeschichte": { slug: "Apg", number: 44, canonical: "Apostelgeschichte" },
  "rom": { slug: "Rom", number: 45, canonical: "Römer" },
  "römer": { slug: "Rom", number: 45, canonical: "Römer" },
  "roemer": { slug: "Rom", number: 45, canonical: "Römer" },
  "1kor": { slug: "1Kor", number: 46, canonical: "1. Korinther" },
  "1korinther": { slug: "1Kor", number: 46, canonical: "1. Korinther" },
  "2kor": { slug: "2Kor", number: 47, canonical: "2. Korinther" },
  "2korinther": { slug: "2Kor", number: 47, canonical: "2. Korinther" },
  "gal": { slug: "Gal", number: 48, canonical: "Galater" },
  "galater": { slug: "Gal", number: 48, canonical: "Galater" },
  "eph": { slug: "Eph", number: 49, canonical: "Epheser" },
  "epheser": { slug: "Eph", number: 49, canonical: "Epheser" },
  "phil": { slug: "Phil", number: 50, canonical: "Philipper" },
  "philipper": { slug: "Phil", number: 50, canonical: "Philipper" },
  "kol": { slug: "Kol", number: 51, canonical: "Kolosser" },
  "kolosser": { slug: "Kol", number: 51, canonical: "Kolosser" },
  "1thess": { slug: "1Thess", number: 52, canonical: "1. Thessalonicher" },
  "1thessalonicher": { slug: "1Thess", number: 52, canonical: "1. Thessalonicher" },
  "2thess": { slug: "2Thess", number: 53, canonical: "2. Thessalonicher" },
  "2thessalonicher": { slug: "2Thess", number: 53, canonical: "2. Thessalonicher" },
  "1tim": { slug: "1Tim", number: 54, canonical: "1. Timotheus" },
  "1timotheus": { slug: "1Tim", number: 54, canonical: "1. Timotheus" },
  "2tim": { slug: "2Tim", number: 55, canonical: "2. Timotheus" },
  "2timotheus": { slug: "2Tim", number: 55, canonical: "2. Timotheus" },
  "tit": { slug: "Tit", number: 56, canonical: "Titus" },
  "titus": { slug: "Tit", number: 56, canonical: "Titus" },
  "phlm": { slug: "Phlm", number: 57, canonical: "Philemon" },
  "philemon": { slug: "Phlm", number: 57, canonical: "Philemon" },
  "hebr": { slug: "Hebr", number: 58, canonical: "Hebräer" },
  "hebraeer": { slug: "Hebr", number: 58, canonical: "Hebräer" },
  "hebräer": { slug: "Hebr", number: 58, canonical: "Hebräer" },
  "jak": { slug: "Jak", number: 59, canonical: "Jakobus" },
  "jakobus": { slug: "Jak", number: 59, canonical: "Jakobus" },
  "1petr": { slug: "1Petr", number: 60, canonical: "1. Petrus" },
  "1petrus": { slug: "1Petr", number: 60, canonical: "1. Petrus" },
  "2petr": { slug: "2Petr", number: 61, canonical: "2. Petrus" },
  "2petrus": { slug: "2Petr", number: 61, canonical: "2. Petrus" },
  "1joh": { slug: "1Joh", number: 62, canonical: "1. Johannes" },
  "1johannes": { slug: "1Joh", number: 62, canonical: "1. Johannes" },
  "2joh": { slug: "2Joh", number: 63, canonical: "2. Johannes" },
  "2johannes": { slug: "2Joh", number: 63, canonical: "2. Johannes" },
  "3joh": { slug: "3Joh", number: 64, canonical: "3. Johannes" },
  "3johannes": { slug: "3Joh", number: 64, canonical: "3. Johannes" },
  "jud": { slug: "Jud", number: 65, canonical: "Judas" },
  "judas": { slug: "Jud", number: 65, canonical: "Judas" },
  "offb": { slug: "Offb", number: 66, canonical: "Offenbarung" },
  "offenbarung": { slug: "Offb", number: 66, canonical: "Offenbarung" },
};

function resolveBook(input: string): { slug: string; number: number; canonical: string } | null {
  const key = input.trim().toLowerCase().replace(/\.|\s/g, "");
  const hit = BOOK_SLUG[key];
  if (!hit) return null;
  // slug ist nur noch ein "logischer" Default — der echte Pfad-Slug wird dynamisch ermittelt.
  return hit;
}

// Übersetzungs-Code → echter Pfad-Ordner auf bibel.github.io
// Wird durch Scraping des Index bestätigt/ermittelt. Einträge hier dienen als
// Fallback, wenn unser internes Kürzel vom Ordnernamen abweicht.
const TRANSLATION_PATH_HINT: Record<string, string[]> = {
  // code → Kandidaten-Ordner auf bibel.github.io, in Prioritätsreihenfolge
  EU: ["EUe"],
  ELB: ["ELB2006"],
  ZB: ["ZUR2007", "ZUR1931"],
  LU1912: ["LU1912"],
  LUT1984: ["LUT1984"],
  SCH2000: ["SCH2000"],
  NEUE: ["NeUe"],
  BB: ["BasisBibel"],
  GNB: ["GNB"],
  HFA: ["HFA"],
  HRD: ["HRD"],
  GRU: ["Gruenewald", "GRU"],
  MENG: ["MENG"],
  NLB: ["NLB"],
  NWT: ["NeueWelt", "NWT"],
  TUR: ["NHTS", "TUR"],
  BR: ["BuberRosenzweig", "BR"],
  SLT1951: ["SLT1951"],
  LU1545: ["LU1545"],
  HER: ["Herder", "HER"],
  MNT: ["MuenchenerNT", "MNT"],
  PAT: ["Schoeningh", "PAT"],
  NGUE: ["NGUE"],
};

// Cache: pro Übersetzung ein Mapping book_number → { testament: "ot"|"nt"|"meta", slug: string }
type BookPathEntry = { testament: "ot" | "nt" | "meta"; slug: string };
type TranslationIndex = {
  pathFolder: string;              // echter Ordner auf bibel.github.io
  byNumber: Record<number, BookPathEntry>;
};
const translationIndexCache = new Map<string, { index: TranslationIndex; ts: number }>();
const INDEX_TTL_MS = 6 * 60 * 60 * 1000; // 6 Stunden

// Heuristik: Buchnamen-Fragment aus URL-Slug (nach decodeURIComponent) einem book_number zuordnen.
function inferBookNumberFromSlug(rawSlug: string): number | null {
  const norm = rawSlug
    .replace(/\.html$/i, "")
    .replace(/_\d+$/, "")           // "_1" am Ende weg
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
  // Direkte Übereinstimmung im BOOK_SLUG-Lexikon
  const direct = BOOK_SLUG[norm];
  if (direct) return direct.number;

  // Bekannte Varianten, die auf bibel.github.io vorkommen, aber nicht 1:1 in BOOK_SLUG sind
  const aliases: Record<string, number> = {
    "gen": 1, "1mose": 1,
    "ex": 2, "2mose": 2,
    "lev": 3, "3mose": 3,
    "num": 4, "4mose": 4,
    "dtn": 5, "5mose": 5,
    "1kön": 11, "1koen": 11,
    "2kön": 12, "2koen": 12,
    "ijob": 18, "hiob": 18,
    "koh": 21, "pred": 21,
    "hld": 22, "hl": 22,
    "ez": 26, "hes": 26,
    "obd": 31, "ob": 31,
    "jona": 32, "jon": 32,
    "röm": 45, "roem": 45, "rom": 45,
    // Deuterokanonische (werden vorerst ignoriert / kein Eintrag)
  };
  if (aliases[norm] != null) return aliases[norm];
  return null;
}

async function loadTranslationIndex(translationCode: string): Promise<TranslationIndex | null> {
  // 1) RAM-Cache
  const cached = translationIndexCache.get(translationCode);
  if (cached && Date.now() - cached.ts < INDEX_TTL_MS) return cached.index;

  const candidates = TRANSLATION_PATH_HINT[translationCode] ?? [translationCode];

  for (const folder of candidates) {
    const indexUrl = `https://bibel.github.io/${folder}/`;
    try {
      const resp = await fetch(indexUrl, {
        headers: { "User-Agent": "BibleBot.Life/1.0 (+https://biblebot.life)" },
      });
      if (!resp.ok) {
        console.log(`[index] ${indexUrl} → HTTP ${resp.status}, Kandidat übersprungen`);
        continue;
      }
      const html = await resp.text();
      // Links können relativ ("ot/Gen_1.html") oder absolut ("https://bibel.github.io/EUe/ot/Gen_1.html") sein
      const linkRe = new RegExp(
        `href="(?:https://bibel\\.github\\.io/${folder}/|/${folder}/|)(ot|nt|meta)/([^"/#?]+?)_(\\d+)\\.html"`,
        "gi",
      );
      const byNumber: Record<number, BookPathEntry> = {};
      let m: RegExpExecArray | null;
      const seen = new Set<string>();
      while ((m = linkRe.exec(html)) !== null) {
        const testament = m[1] as "ot" | "nt" | "meta";
        const slugEncoded = m[2];
        const slug = decodeURIComponent(slugEncoded);
        const key = `${testament}/${slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (testament === "meta") continue;
        const bookNumber = inferBookNumberFromSlug(slug);
        if (bookNumber == null) continue;
        // Ersten Treffer pro book_number behalten (Index listet jedes Buch nur einmal zum 1. Kapitel)
        if (!byNumber[bookNumber]) {
          byNumber[bookNumber] = { testament, slug };
        }
      }

      if (Object.keys(byNumber).length === 0) {
        console.log(`[index] ${indexUrl} lieferte 0 Bücher, nächster Kandidat`);
        continue;
      }

      const index: TranslationIndex = { pathFolder: folder, byNumber };
      translationIndexCache.set(translationCode, { index, ts: Date.now() });
      console.log(
        `[index] ${translationCode} → /${folder}/, ${Object.keys(byNumber).length} Bücher erkannt`,
      );
      return index;
    } catch (e) {
      console.log(`[index] Fehler beim Laden ${indexUrl}:`, (e as Error).message);
    }
  }

  console.error(`[index] Kein gültiger Index für ${translationCode} gefunden (Kandidaten: ${candidates.join(", ")})`);
  return null;
}

// Parst HTML eines Kapitels in Verse.
// bibel.github.io verwendet im Allgemeinen <div class="v" id="vN"><span class="vn">N</span> TEXT</div>
// Wir sind tolerant: erkennen mehrere Strukturen.
function parseChapterHtml(html: string): { verse: number; text: string }[] {
  const results: { verse: number; text: string }[] = [];

  // Variante A: <div class="v" id="vN"> ... </div>
  const reA = /<div[^>]*\bclass="[^"]*\bv\b[^"]*"[^>]*\bid="v(\d+)"[^>]*>([\s\S]*?)<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = reA.exec(html)) !== null) {
    const v = parseInt(m[1], 10);
    const text = cleanVerseText(m[2]);
    if (text) results.push({ verse: v, text });
  }

  // Variante B (Fallback): <span class="verse" id="vN">N</span>TEXT bis nächstem <span class="verse"> oder Block-Ende
  if (results.length === 0) {
    const reB = /<span[^>]*\bclass="[^"]*\bverse\b[^"]*"[^>]*>(\d+)<\/span>([\s\S]*?)(?=<span[^>]*\bclass="[^"]*\bverse\b|<\/p>|<\/div>)/gi;
    while ((m = reB.exec(html)) !== null) {
      const v = parseInt(m[1], 10);
      const text = cleanVerseText(m[2]);
      if (text) results.push({ verse: v, text });
    }
  }

  return results;
}

function cleanVerseText(raw: string): string {
  return raw
    .replace(/<span[^>]*class="[^"]*\bvn\b[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "") // Versnummern entfernen
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAndStoreChapter(
  supabase: ReturnType<typeof createClient>,
  translationCode: string,
  bookInput: string,
  chapter: number,
  opts: { forceRetry?: boolean } = {},
): Promise<{ ok: boolean; verses: { verse: number; text: string }[]; source_url: string; book: { slug: string; number: number; canonical: string } | null; cached: boolean; error?: string }> {
  const cursorIgnoreBackoff = !!opts.forceRetry;
  const book = resolveBook(bookInput);
  if (!book) return { ok: false, verses: [], source_url: "", book: null, cached: false, error: `Buch '${bookInput}' nicht erkannt.` };

  // Dynamischen Index der Übersetzung laden (echter Ordnername + Buch-Slugs + Testament)
  const index = await loadTranslationIndex(translationCode);
  if (!index) {
    return {
      ok: false, verses: [], source_url: "", book, cached: false,
      error: `Übersetzung '${translationCode}' nicht erreichbar (Index auf bibel.github.io nicht gefunden).`,
    };
  }
  const pathEntry = index.byNumber[book.number];
  if (!pathEntry) {
    return {
      ok: false, verses: [], source_url: `https://bibel.github.io/${index.pathFolder}/`, book, cached: false,
      error: `Buch '${book.canonical}' (Nr. ${book.number}) ist in Übersetzung '${translationCode}' nicht enthalten.`,
    };
  }

  // Meta laden, um Ziel-Tabelle zu bestimmen
  const { data: meta } = await supabase
    .from("bible_translation_meta")
    .select("code, name, citation, is_restricted, rights_status")
    .eq("code", translationCode)
    .maybeSingle();
  if (!meta) return { ok: false, verses: [], source_url: "", book, cached: false, error: `Keine Metadaten für '${translationCode}'.` };

  const targetTable = meta.is_restricted ? "bible_verses_restricted" : "bible_verses";

  // URL dynamisch: https://bibel.github.io/<folder>/<ot|nt>/<slug>_<chapter>.html
  const sourceUrl = `https://bibel.github.io/${index.pathFolder}/${pathEntry.testament}/${encodeURIComponent(pathEntry.slug)}_${chapter}.html`;

  // Cache prüfen
  const { data: existing } = await supabase
    .from(targetTable)
    .select("verse, text")
    .eq("translation", translationCode)
    .eq("book_number", book.number)
    .eq("chapter", chapter)
    .order("verse", { ascending: true });

  if (existing && existing.length > 0) {
    return {
      ok: true,
      verses: existing.map((r: any) => ({ verse: r.verse as number, text: r.text as string })),
      source_url: sourceUrl,
      book,
      cached: true,
    };
  }

  // Vorherigen Log-Eintrag laden (für Retry-Logik / Backoff)
  const { data: prevLog } = await supabase
    .from("bible_chapter_fetch_log")
    .select("attempts, status, next_retry_at")
    .eq("translation", translationCode)
    .eq("book_number", book.number)
    .eq("chapter", chapter)
    .maybeSingle();

  const prevAttempts = Number((prevLog as any)?.attempts ?? 0);
  const nowMs = Date.now();
  const nextRetryIso = (prevLog as any)?.next_retry_at as string | null | undefined;

  // Wenn letzter Versuch fehlgeschlagen ist UND das Retry-Fenster noch nicht erreicht ist → abbrechen
  if (
    (prevLog as any)?.status === "failed" &&
    nextRetryIso &&
    new Date(nextRetryIso).getTime() > nowMs &&
    !cursorIgnoreBackoff
  ) {
    return {
      ok: false, verses: [], source_url: sourceUrl, book, cached: false,
      error: `Retry-Backoff aktiv bis ${nextRetryIso} (Versuche: ${prevAttempts}).`,
    };
  }

  // Helper: Backoff berechnen (exponentiell, mit Jitter, Cap = 2h)
  const backoffMs = (attempt: number) => {
    const base = Math.min(2 ** attempt * 30_000, 2 * 60 * 60 * 1000); // 30s, 60s, 120s, … max 2h
    const jitter = Math.floor(Math.random() * 10_000);
    return base + jitter;
  };

  const recordFailure = async (errCode: string, errMsg: string) => {
    const newAttempts = prevAttempts + 1;
    await supabase.from("bible_chapter_fetch_log").upsert({
      translation: translationCode, book_number: book.number, chapter,
      verse_count: 0, source_url: sourceUrl, status: "failed",
      error_message: errMsg,
      attempts: newAttempts,
      last_error_code: errCode,
      next_retry_at: new Date(nowMs + backoffMs(newAttempts)).toISOString(),
    }, { onConflict: "translation,book_number,chapter" });
  };

  // Scrape mit kleinem internen Retry (Netzwerk-Transient)
  let html = "";
  let fetchError: { code: string; msg: string } | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await fetch(sourceUrl, { headers: { "User-Agent": "BibleBot.Life/1.0 (+https://biblebot.life)" } });
      if (resp.ok) {
        html = await resp.text();
        fetchError = null;
        break;
      }
      fetchError = { code: `HTTP_${resp.status}`, msg: `HTTP ${resp.status}` };
      // 4xx (außer 408/429) → nicht wiederholen
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 408 && resp.status !== 429) break;
    } catch (e: any) {
      fetchError = { code: "NETWORK", msg: `Fetch fehlgeschlagen: ${e.message}` };
    }
    // kurzer, interner Backoff zwischen Versuchen
    if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
  }

  if (fetchError) {
    await recordFailure(fetchError.code, fetchError.msg);
    return { ok: false, verses: [], source_url: sourceUrl, book, cached: false, error: fetchError.msg };
  }

  const verses = parseChapterHtml(html);
  if (verses.length === 0) {
    await recordFailure("PARSE_EMPTY", "Parser fand keine Verse");
    return { ok: false, verses: [], source_url: sourceUrl, book, cached: false, error: "Keine Verse im HTML gefunden." };
  }

  // In Ziel-Tabelle schreiben — idempotent via Unique-Key (translation,book_number,chapter,verse)
  const rows = verses.map((v) => ({
    translation: translationCode,
    language: "de",
    book: book.canonical,
    book_number: book.number,
    chapter,
    verse: v.verse,
    text: v.text,
    ...(meta.is_restricted ? { source_url: sourceUrl } : {}),
  }));

  const { error: insertError } = await supabase
    .from(targetTable)
    .upsert(rows, {
      onConflict: "translation,book_number,chapter,verse",
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error(`Insert into ${targetTable} failed:`, insertError);
    await recordFailure("DB_INSERT", `Insert fehlgeschlagen: ${insertError.message}`);
    return { ok: false, verses: [], source_url: sourceUrl, book, cached: false, error: insertError.message };
  }

  await supabase.from("bible_chapter_fetch_log").upsert({
    translation: translationCode, book_number: book.number, chapter,
    verse_count: verses.length, source_url: sourceUrl, status: "success",
    attempts: prevAttempts + 1,
    last_error_code: null,
    next_retry_at: null,
  }, { onConflict: "translation,book_number,chapter" });

  return { ok: true, verses, source_url: sourceUrl, book, cached: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const translation: string = body.translation;
    const book: string = body.book;
    const chapter: number = Number(body.chapter);
    const verseStart: number | undefined = body.verse_start ? Number(body.verse_start) : undefined;
    const verseEnd: number | undefined = body.verse_end ? Number(body.verse_end) : undefined;

    if (!translation || !book || !Number.isFinite(chapter) || chapter < 1) {
      return new Response(JSON.stringify({ error: "translation, book, chapter erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await fetchAndStoreChapter(supabase, translation, book, chapter);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error, source_url: result.source_url }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional: nur Bereich zurückgeben
    let verses = result.verses;
    if (verseStart) {
      const end = verseEnd ?? verseStart;
      verses = verses.filter((v) => v.verse >= verseStart && v.verse <= end);
    }

    // Citation laden
    const { data: meta } = await supabase
      .from("bible_translation_meta")
      .select("name, citation")
      .eq("code", translation)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        translation,
        translation_name: meta?.name ?? translation,
        citation: meta?.citation ?? "",
        book: result.book?.canonical ?? book,
        chapter,
        verses,
        source_url: result.source_url,
        cached: result.cached,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("bible-extra-fetch error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

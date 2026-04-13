import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fix common AI spelling mistakes: wrong umlaut substitutions, sz→ss, etc.
function fixSpelling(text: string): string {
  const wordFixes: [RegExp, string][] = [
    [/\b([Ff])uell/g, '$1üll'], [/\b([Ee])rfuell/g, '$1rfüll'],
    [/\b([Gg])efuehl/g, '$1efühl'], [/\b([Ff])uehr/g, '$1ühr'],
    [/\b([Ww])uerdig/g, '$1ürdig'], [/\b([Ww])uensch/g, '$1ünsch'],
    [/\b([Gg])lueck/g, '$1lück'], [/\b([Zz])urueck/g, '$1urück'],
    [/\b([Ss])tueck/g, '$1tück'], [/\b([Uu])ebung/g, '$1bung'],
    [/\b([Uu])eber(?!all)/g, '$1ber'], [/\b([Gg])uet/g, '$1üt'],
    [/\b([Hh])uet/g, '$1üt'], [/\b([Mm])uede/g, '$1üde'],
    [/\b([Mm])uess/g, '$1üss'], [/\b([Ss])uend/g, '$1ünd'],
    [/\b([Tt])uer(?!k)/g, '$1ür'], [/\b([Nn])uetz/g, '$1ütz'],
    [/\b([Ss])chuetz/g, '$1chütz'], [/\b([Ss])tuetz/g, '$1tütz'],
    [/\b([Pp])ruef/g, '$1rüf'], [/\b([Bb])uecher/g, '$1ücher'],
    [/\b([Kk])ueche/g, '$1üche'], [/\b([Ww])uerd/g, '$1ürd'],
    [/\b([Bb])eruehr/g, '$1erühr'], [/\b([Ss])pueren/g, '$1püren'],
    [/\b([Ff])uer\b/g, '$1ür'], [/\b([Nn])atuerlich/g, '$1atürlich'],
    [/\b([Ee])rwaehlt/g, '$1rwählt'], [/\b([Ee])rzaehl/g, '$1rzähl'],
    [/\b([Gg])espraech/g, '$1espräch'], [/\b([Nn])aechst/g, '$1ächst'],
    [/\b([Tt])aeglich/g, '$1äglich'], [/\b([Ss])paet/g, '$1pät'],
    [/\b([Ss])taerk/g, '$1tärk'], [/\b([Gg])naed/g, '$1näd'],
    [/\b([Hh])aett/g, '$1ätt'], [/\b([Ww])aer/g, '$1är'],
    [/\b([Mm])aecht/g, '$1ächt'], [/\b([Hh])oer/g, '$1ör'],
    [/\b([Ss])choepf/g, '$1chöpf'], [/\b([Vv])oellig/g, '$1öllig'],
    [/\b([Gg])oettlich/g, '$1öttlich'], [/\b([Mm])oeglich/g, '$1öglich'],
    [/\b([Ss])choen/g, '$1chön'], [/\b([Gg])roess/g, '$1röss'],
    [/\b([Tt])roest/g, '$1röst'], [/\b([Vv])erheisz/g, '$1erheiss'],
    [/sz(?=[uo]ng)/g, 'ss'], [/ß/g, 'ss'],
  ];
  let result = text;
  for (const [pattern, replacement] of wordFixes) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Bible API integration ──────────────────────────────────────────

const BIBLE_API_BASE = "https://bible.helloao.org/api";

// Map of available German translations
const BIBLE_TRANSLATIONS: Record<string, { id: string; name: string }> = {
  luther: { id: "deu_l12", name: "Lutherbibel 1912" },
  luther1912: { id: "deu_l12", name: "Lutherbibel 1912" },
  elberfelder: { id: "deu_elbbk", name: "Elberfelder Übersetzung" },
  schlachter: { id: "deu_sch", name: "Schlachter-Bibel 1951" },
  schlachter2000: { id: "deu_sch", name: "Schlachter 2000" },
  kjv: { id: "eng_kjv", name: "King James Version" },
  web: { id: "eng_web", name: "World English Bible" },
};

// Standard book ID mapping (German/English name → OSIS ID)
const BOOK_MAP: Record<string, string> = {
  // German names
  "1. mose": "GEN", "2. mose": "EXO", "3. mose": "LEV", "4. mose": "NUM", "5. mose": "DEU",
  "1 mose": "GEN", "2 mose": "EXO", "3 mose": "LEV", "4 mose": "NUM", "5 mose": "DEU",
  genesis: "GEN", exodus: "EXO", levitikus: "LEV", numeri: "NUM", deuteronomium: "DEU",
  josua: "JOS", richter: "JDG", rut: "RUT", ruth: "RUT",
  "1. samuel": "1SA", "2. samuel": "2SA", "1 samuel": "1SA", "2 samuel": "2SA",
  "1. könige": "1KI", "2. könige": "2KI", "1 könige": "1KI", "2 könige": "2KI",
  "1. koenige": "1KI", "2. koenige": "2KI",
  "1. chronik": "1CH", "2. chronik": "2CH", "1 chronik": "1CH", "2 chronik": "2CH",
  esra: "EZR", nehemia: "NEH", ester: "EST", esther: "EST",
  hiob: "JOB", ijob: "JOB", job: "JOB",
  psalm: "PSA", psalmen: "PSA",
  sprüche: "PRO", sprichwörter: "PRO", "sprueche": "PRO",
  prediger: "ECC", kohelet: "ECC",
  hoheslied: "SNG", hohelied: "SNG",
  jesaja: "ISA", jeremia: "JER", klagelieder: "LAM",
  hesekiel: "EZK", ezechiel: "EZK",
  daniel: "DAN", hosea: "HOS", joel: "JOL",
  amos: "AMO", obadja: "OBA", jona: "JON",
  micha: "MIC", nahum: "NAM", habakuk: "HAB",
  zefanja: "ZEP", haggai: "HAG", sacharja: "ZEC", maleachi: "MAL",
  matthäus: "MAT", "matthaeus": "MAT", markus: "MRK", lukas: "LUK", johannes: "JHN",
  apostelgeschichte: "ACT",
  römer: "ROM", "roemer": "ROM",
  "1. korinther": "1CO", "2. korinther": "2CO", "1 korinther": "1CO", "2 korinther": "2CO",
  galater: "GAL", epheser: "EPH", philipper: "PHP", kolosser: "COL",
  "1. thessalonicher": "1TH", "2. thessalonicher": "2TH",
  "1 thessalonicher": "1TH", "2 thessalonicher": "2TH",
  "1. timotheus": "1TI", "2. timotheus": "2TI",
  "1 timotheus": "1TI", "2 timotheus": "2TI",
  titus: "TIT", philemon: "PHM", hebräer: "HEB", "hebraeer": "HEB",
  jakobus: "JAS", "1. petrus": "1PE", "2. petrus": "2PE",
  "1 petrus": "1PE", "2 petrus": "2PE",
  "1. johannes": "1JN", "2. johannes": "2JN", "3. johannes": "3JN",
  "1 johannes": "1JN", "2 johannes": "2JN", "3 johannes": "3JN",
  judas: "JUD", offenbarung: "REV",
  // English names
  genesis_en: "GEN", exodus_en: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG",
  "1 samuel_en": "1SA", "2 samuel_en": "2SA",
  "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH",
  ezra: "EZR", nehemiah: "NEH",
  psalms: "PSA", proverbs: "PRO", ecclesiastes: "ECC",
  "song of solomon": "SNG", isaiah: "ISA", jeremiah: "JER", lamentations: "LAM",
  ezekiel: "EZK", hosea_en: "HOS", joel_en: "JOL", obadiah: "OBA", jonah: "JON",
  micah: "MIC", nahum_en: "NAM", habakkuk: "HAB", zephaniah: "ZEP",
  haggai_en: "HAG", zechariah: "ZEC", malachi: "MAL",
  matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT",
  romans: "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO",
  galatians: "GAL", ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH",
  "1 timothy": "1TI", "2 timothy": "2TI",
  philemon_en: "PHM", hebrews: "HEB", james: "JAS",
  "1 peter": "1PE", "2 peter": "2PE",
  "1 john": "1JN", "2 john": "2JN", "3 john": "3JN",
  jude: "JUD", revelation: "REV",
};

function resolveBookId(bookName: string): string | null {
  const normalized = bookName.trim().toLowerCase();
  // Direct match
  if (BOOK_MAP[normalized]) return BOOK_MAP[normalized];
  // Try without dots
  const noDots = normalized.replace(/\./g, '');
  if (BOOK_MAP[noDots]) return BOOK_MAP[noDots];
  // Partial match
  for (const [key, val] of Object.entries(BOOK_MAP)) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) return val;
  }
  // If it already looks like an OSIS ID (3 uppercase letters)
  if (/^[A-Z0-9]{2,4}$/.test(bookName.trim())) return bookName.trim();
  return null;
}

async function lookupBibleVerse(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
  translationKey?: string
): Promise<string> {
  const bookId = resolveBookId(book);
  if (!bookId) return `Buch «${book}» nicht gefunden.`;

  const trans = BIBLE_TRANSLATIONS[translationKey?.toLowerCase() || "luther"] || BIBLE_TRANSLATIONS.luther;
  const url = `${BIBLE_API_BASE}/${trans.id}/${bookId}/${chapter}.json`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return `Kapitel ${book} ${chapter} nicht gefunden (${trans.name}).`;

    const data = await resp.json();
    const chapterData = data?.chapter?.content || [];
    const verses = chapterData.filter(
      (v: any) => v.type === "verse" && v.number >= verseStart && v.number <= (verseEnd || verseStart)
    );

    if (verses.length === 0) return `Vers(e) ${book} ${chapter},${verseStart}${verseEnd ? `-${verseEnd}` : ''} nicht gefunden.`;

    const text = verses
      .map((v: any) => `${v.number} ${(v.content || []).join(' ')}`)
      .join(' ');

    const ref = verseEnd && verseEnd !== verseStart
      ? `${book} ${chapter},${verseStart}-${verseEnd}`
      : `${book} ${chapter},${verseStart}`;

    return `«${text.trim()}» — ${ref} (${trans.name})`;
  } catch (e) {
    console.error("Bible API error:", e);
    return `Fehler beim Abrufen von ${book} ${chapter},${verseStart}.`;
  }
}

// Tool definition for AI tool calling
const BIBLE_LOOKUP_TOOL = {
  type: "function" as const,
  function: {
    name: "lookup_bible_verse",
    description: "Schlage einen exakten Bibelvers in einer deutschen Übersetzung nach. Verwende dieses Tool IMMER, wenn du einen Bibelvers wörtlich zitieren möchtest, um sicherzustellen, dass das Zitat korrekt ist.",
    parameters: {
      type: "object",
      properties: {
        book: {
          type: "string",
          description: "Buchname (deutsch oder englisch), z.B. 'Johannes', 'Psalm', '1. Korinther', 'Matthäus'"
        },
        chapter: {
          type: "number",
          description: "Kapitelnummer"
        },
        verse_start: {
          type: "number",
          description: "Erste Versnummer"
        },
        verse_end: {
          type: "number",
          description: "Letzte Versnummer (optional, für Versbereich)"
        },
        translation: {
          type: "string",
          enum: ["luther", "elberfelder", "schlachter", "kjv", "web"],
          description: "Bibelübersetzung. Standard: luther. Auch englisch: kjv, web"
        }
      },
      required: ["book", "chapter", "verse_start"]
    }
  }
};

// Semantic Bible search tool – searches the DB full-text index
const BIBLE_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_bible_verses",
    description: "Durchsuche die Bibel nach Versen zu einem Thema, Stichwort oder einer Frage. Verwende dieses Tool, wenn du thematisch passende Bibelverse finden willst, aber keine exakte Stellenangabe hast. Gibt bis zu 8 relevante Verse zurück.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Suchbegriffe oder Thema auf Deutsch, z.B. 'Hoffnung in schweren Zeiten', 'Vergebung', 'Gottes Liebe'"
        },
        translation: {
          type: "string",
          enum: ["luther1912", "elberfelder", "schlachter2000", "kjv", "web", "all"],
          description: "Bibelübersetzung für die Suche. Standard: luther1912. Englisch: kjv, web. 'all' für alle."
        }
      },
      required: ["query"]
    }
  }
};

async function searchBibleVerses(
  query: string,
  translation?: string
): Promise<string> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Use AI to expand search terms
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  let tsquery = query.split(/\s+/).filter(w => w.length > 0).join(" | ");

  try {
    const expandResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Generiere deutsche Suchbegriffe für eine Bibelsuche (PostgreSQL Full-Text-Search).
Nur einzelne Wörter getrennt mit | (OR). Viele Synonyme. Beispiel: "Liebe | lieben | Güte | Barmherzigkeit | Nächstenliebe"
Antworte NUR mit dem tsquery-String, nichts anderes. Keine Anführungszeichen, keine Klammern, keine Sonderzeichen ausser |.`
          },
          { role: "user", content: query },
        ],
        stream: false,
      }),
    });
    if (expandResp.ok) {
      const d = await expandResp.json();
      const expanded = d.choices?.[0]?.message?.content?.trim();
      if (expanded) tsquery = expanded;
    }
  } catch (e) {
    console.error("Search expansion error:", e);
  }

  // Sanitize tsquery: remove quotes, parens, special chars; keep only words and |
  tsquery = tsquery
    .replace(/["""''`()[\]{}<>!@#$%^&*+=~\\;:]/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .split(' | ')
    .map(term => term.trim())
    .filter(term => term.length > 0 && term !== '|')
    .join(' | ');

  if (!tsquery) tsquery = query.split(/\s+/).filter(w => w.length > 0).join(" | ");

  const trans = (!translation || translation === "all") ? null : translation;

  let results: any[] | null = null;
  let searchError: any = null;

  // Try the expanded query first, fall back to simple query on syntax error
  const { data, error } = await supabase.rpc("search_bible_verses", {
    search_query: tsquery,
    translation_filter: trans,
    book_boost: null,
    result_limit: 8,
  });

  if (error) {
    console.error("Bible search RPC error (expanded):", error.message, "tsquery:", tsquery);
    // Fallback: use the original simple query
    const fallbackQuery = query.split(/\s+/).filter(w => w.length > 0).join(" | ");
    const { data: fallbackData, error: fallbackError } = await supabase.rpc("search_bible_verses", {
      search_query: fallbackQuery,
      translation_filter: trans,
      book_boost: null,
      result_limit: 8,
    });
    if (fallbackError) {
      console.error("Bible search RPC fallback error:", fallbackError.message);
      return `Keine Verse zu «${query}» gefunden (Suche fehlgeschlagen).`;
    }
    results = fallbackData;
  } else {
    results = data;
  }

  if (!results || results.length === 0) {
    return `Keine Verse zu «${query}» gefunden.`;
  }

  return results
    .map((r: any) => `${r.book} ${r.chapter},${r.verse}: «${r.text}» (${r.translation})`)
    .join("\n\n");
}

// Theology knowledge search tool
const THEOLOGY_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_theology",
    description: "Durchsuche das theologische Lexikon nach Hintergrundwissen zu einem Begriff, einer Konfession, einem seelsorgerischen Thema oder einem Kirchengeschichts-Thema. Verwende dieses Tool, wenn du theologisches Hintergrundwissen brauchst – z.B. was 'Rechtfertigung' bedeutet, wie verschiedene Konfessionen die Taufe verstehen, oder wie man ein Trauergespräch führt.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Suchbegriff oder Thema, z.B. 'Trinität', 'reformierte Kirche', 'Trauergespräch führen'"
        },
        source_type: {
          type: "string",
          enum: ["lexikon", "kommentar", "konfession", "seelsorge"],
          description: "Optional: Nur in einer bestimmten Kategorie suchen"
        }
      },
      required: ["query"]
    }
  }
};

async function searchTheology(query: string, sourceType?: string): Promise<string> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Expand search terms via AI
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  let tsTerms = query.split(/\s+/).filter(w => w.length > 0).join(" | ");

  try {
    const expandResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Generiere deutsche Suchbegriffe für eine theologische Wissensdatenbank (PostgreSQL FTS).
Nur einzelne Wörter mit | (OR) getrennt. Viele Synonyme. Keine Anführungszeichen, keine Klammern, keine Sonderzeichen ausser |.
Antworte NUR mit dem tsquery-String.`
          },
          { role: "user", content: query },
        ],
        stream: false,
      }),
    });
    if (expandResp.ok) {
      const d = await expandResp.json();
      const expanded = d.choices?.[0]?.message?.content?.trim();
      if (expanded) tsTerms = expanded;
    }
  } catch (e) {
    console.error("Theology search expansion error:", e);
  }

  // Sanitize tsTerms
  tsTerms = tsTerms
    .replace(/["""''`()[\]{}<>!@#$%^&*+=~\\;:]/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .split(' | ')
    .map(term => term.trim())
    .filter(term => term.length > 0 && term !== '|')
    .join(' | ');

  if (!tsTerms) tsTerms = query.split(/\s+/).filter(w => w.length > 0).join(" | ");

  let q = supabase
    .from("theology_chunks")
    .select("source_type, title, content")
    .textSearch("content", tsTerms.replace(/\|/g, " | "), { config: "german" })
    .limit(5);

  if (sourceType) {
    q = q.eq("source_type", sourceType);
  }

  const { data, error } = await q;

  // Fallback: title search
  if (!data?.length) {
    const { data: titleData } = await supabase
      .from("theology_chunks")
      .select("source_type, title, content")
      .ilike("title", `%${query.split(/\s+/)[0]}%`)
      .limit(3);

    if (!titleData?.length) return `Kein theologisches Hintergrundwissen zu «${query}» gefunden.`;
    return titleData.map((r: any) => `[${r.source_type}] **${r.title}**\n${r.content}`).join("\n\n---\n\n");
  }

  if (error) {
    console.error("Theology search error:", error);
    return `Fehler bei der theologischen Suche: ${error.message}`;
  }

  return data.map((r: any) => `[${r.source_type}] **${r.title}**\n${r.content}`).join("\n\n---\n\n");
}

// ── System prompt ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist BibleBot – ein einfühlsamer, weiser und herausfordernder Begleiter für Menschen, die an der Bibel wachsen wollen. Du bist nicht nur tröstend, sondern auch ehrlich, tiefgründig und bereit, unbequeme Fragen zu stellen.

## Deine Identität
- Du sprichst Deutsch (Schweiz). Verwende nie "ß", immer "ss". Verwende IMMER korrekte Umlaute (ä, ö, ü), NIEMALS ASCII-Ersatz (ae, oe, ue). Schreibe z.B. "erfüllt" (NICHT "erfuellt"), "Verheissung" (NICHT "Verheiszung"), "fühlt" (NICHT "fuehlt"), "schöpferisch" (NICHT "schoepferisch"). Achte auf korrekte Grammatik und vollständige Wörter (z.B. "schlägt" statt "schlät", "geht" statt "geh").
- Du zitierst bevorzugt aus modernen Übersetzungen: Zürcher Bibel (2007, reformiert), Lutherbibel (2017, evangelisch), Einheitsübersetzung (2016, katholisch), Schlachter 2000 (freikirchlich), Elberfelder 2006 (wortgetreu).
- Du bist ökumenisch orientiert und respektierst alle christlichen Traditionen.
- Du bist kein Ersatz für seelsorgerische Beratung oder Therapie.
- WICHTIG: Deine Wissensbasis umfasst ausschliesslich den biblischen Kanon (Altes und Neues Testament). Wenn Nutzer nach Inhalten fragen, die ausserhalb dieses Kanons liegen (z.B. Buch Mormon, Koran, Apokryphen bestimmter Traditionen), antworte freundlich und transparent: «Meine Wissensbasis umfasst den biblischen Kanon (Altes und Neues Testament). Zu Texten ausserhalb dieses Kanons kann ich leider keine fundierte Auskunft geben. Ich kann dir aber gerne zeigen, was die Bibel zu diesem Thema sagt.» Sei dabei respektvoll gegenüber allen Glaubensrichtungen – grenze ab, ohne abzuwerten.

## KRITISCH: Bibelverse – Zwei Tools + Trainingswissen

### Verfügbare Übersetzungen
Es gibt zwei Kategorien von Übersetzungen:

**A) Im Tool verfügbar (exakt nachschlagbar via lookup_bible_verse):**
- Luther 1912, Elberfelder (historisch), Schlachter 1951, KJV (englisch), WEB (englisch)

**B) Moderne Übersetzungen (aus deinem Trainingswissen):**
- Zürcher Bibel (2007) – reformiert
- Lutherbibel (2017) – evangelisch
- Einheitsübersetzung (2016) – katholisch
- Schlachter 2000 – freikirchlich
- Elberfelder 2006 – wortgetreu

### Zitier-Regeln
1. **Bevorzuge IMMER moderne Übersetzungen (Kategorie B)** – sie sind sprachlich aktueller und näher an dem, was die Nutzer in ihren Gemeinden hören.
2. Für Kategorie-B-Übersetzungen: Zitiere aus deinem Trainingswissen. Du kennst diese Texte gut. Zitiere sie selbstbewusst mit Quellenangabe, z.B. «...» (Johannes 3,16, Zürcher Bibel 2007).
3. Verwende das lookup_bible_verse-Tool nur, wenn der Nutzer explizit eine Kategorie-A-Übersetzung wünscht, oder als Gegenprüfung wenn du dir bei einem Vers unsicher bist.
4. Verwende search_bible_verses weiterhin für thematische Suchen – die Ergebnisse kommen aus Kategorie A, aber du kannst den gefundenen Vers dann in einer modernen Übersetzung aus dem Trainingswissen wiedergeben.
5. Wenn du dir bei einem Zitat aus dem Trainingswissen nicht 100% sicher bist, kennzeichne es mit «Sinngemäss:».

### 1. «lookup_bible_verse» – Exaktes Nachschlagen (Kategorie A)
Verwende dieses Tool für exakte Zitate aus den historischen Übersetzungen (Luther 1912, Elberfelder, Schlachter 1951, KJV, WEB).
- Verfügbare Übersetzungen: luther, elberfelder, schlachter, kjv, web

### 2. «search_bible_verses» – Thematische Suche
Verwende dieses Tool, wenn du **thematisch passende Verse** finden willst, aber keine exakte Stelle kennst.
- Z.B. bei Fragen wie «Was sagt die Bibel über Hoffnung?», «Verse über Vergebung», «Trost bei Trauer»
- Liefert bis zu 8 relevante Verse aus der Datenbank (über 150'000 Verse in 5 Übersetzungen)
- Suche auch proaktiv nach Versen, die zum Gesprächsthema passen!
- Verfügbare Übersetzungen: luther1912, elberfelder, schlachter2000, kjv, web

### 3. «search_theology» – Theologisches Hintergrundwissen
Verwende dieses Tool, wenn du **theologisches Hintergrundwissen** brauchst:
- Begriffserklärungen (Gnade, Trinität, Sakrament, etc.)
- Konfessionsunterschiede (reformiert vs. lutherisch vs. katholisch)
- Seelsorge-Leitfäden (Trauergespräch, Krisenintervention, etc.)
- Kirchengeschichte (Konzile, Reformation, Bekenntnisschriften)
- Nutze es proaktiv, um deine Antworten theologisch fundierter zu machen!
- Kategorien: lexikon, kommentar, konfession, seelsorge

### Gemeinsame Regeln
1. Verwende den exakten Wortlaut bei Bibelzitaten. Ändere nichts am Text.
2. Wenn ein Tool einen Fehler zurückgibt, paraphrasiere und kennzeichne mit «Sinngemäss:».
3. Gib bei jedem Bibelzitat die Übersetzung an.
4. Du kannst alle drei Tools in derselben Antwort verwenden.
5. Theologisches Hintergrundwissen aus search_theology sollst du in eigenen Worten einbauen – nicht einfach kopieren.

## Biblisches Wissen
- Du kennst die Bibel umfassend: Altes und Neues Testament, Psalmen, Weisheitsliteratur, Evangelien, Briefe.
- Du ordnest Verse in ihren historischen und theologischen Kontext ein.
- Du erklärst verständlich, ohne zu vereinfachen oder zu verharmlosen.
- Bei kontroversen Auslegungen zeigst du verschiedene Perspektiven auf.
- Du scheust dich nicht vor schwierigen Texten (Hiob, Prediger, Klagepsalmen, prophetische Kritik).

## Für Bibel-Laien: Neugier wecken & heranführen
Viele Nutzer kennen die Bibel kaum. Deine Aufgabe: sie neugierig machen und behutsam heranführen.

### Kontext immer mitliefern
Wenn du eine Bibelstelle nennst, erkläre immer kurz:
- **Wer** spricht/schreibt? (z.B. «Das schreibt der Prophet Jeremia an die Israeliten im Exil in Babylon»)
- **Wann und wo?** (z.B. «ca. 600 v. Chr., die Israeliten waren als Gefangene in Babylon»)
- **Was kommt davor/danach?** (z.B. «Direkt davor warnt Jeremia vor falschen Propheten...»)
- **Warum ist das spannend?** Mach es lebendig: «Stell dir vor, du bist deportiert, alles verloren – und dann kommt dieser Brief...»

### Grössere Zusammenhänge zeigen
- Verknüpfe Stellen miteinander: «Das erinnert an...» / «Paulus greift das später auf, wenn er...»
- Zeige die rote Linie: AT → NT, Propheten → Jesus, Psalmen → Gebetsleben
- Erkläre Hintergründe, die faszinieren: Kulturelle Kontexte, überraschende Details, archäologische Funde

### Zum Weiterlesen einladen
- Schlage verwandte Stellen vor: «Wenn dich das interessiert, lies auch mal Psalm 139 – da geht es darum, dass Gott dich durch und durch kennt.»
- Biete «Lesepfade» an: «Willst du mehr über Hoffnung in schwierigen Zeiten erfahren? Dann lies nacheinander: Psalm 23 → Jesaja 43,1-3 → Römer 8,28»
- Mach die Bibel zur Entdeckungsreise: «Das Spannende ist: Dieser Text wurde vor 2500 Jahren geschrieben, aber er beschreibt genau das, was du gerade erlebst.»

### Faszination wecken
- Teile überraschende Fakten: «Wusstest du, dass das Hohelied ein Liebeslied ist, das fast nicht in die Bibel aufgenommen wurde?»
- Zeige Verbindungen zur heutigen Welt: Ethik, Menschenrechte, Psychologie – vieles hat biblische Wurzeln
- Würdige ehrlich, was schwierig ist: «Diese Stelle ist tatsächlich verstörend. So wurde sie zu verschiedenen Zeiten verstanden:...»

## Gesprächsführung & Fragetechniken
Du führst Gespräche wie ein erfahrener Coach und Seelsorger. Dein wichtigstes Werkzeug: Fragen.

### Offene Fragen (W-Fragen)
Stelle immer offene Fragen, die zum Nachdenken einladen – nie Ja/Nein-Fragen:
- «Was beschäftigt dich daran am meisten?»
- «Wie würde sich das anfühlen, wenn du es erreicht hättest?»
- «Was hält dich davon ab, den nächsten Schritt zu machen?»
- «Woran würdest du merken, dass sich etwas verändert hat?»
- «Was würde Jesus dir dazu sagen – und was löst das in dir aus?»

### Skalierungsfragen
Helfen, Fortschritte und Gefühle greifbar zu machen:
- «Auf einer Skala von 1-10: Wie nah fühlst du dich gerade an dem, was du dir wünschst?»
- «Was müsste passieren, damit du von einer 4 auf eine 6 kommst?»

### Wunderfrage (Steve de Shazer)
Ideal bei Stagnation oder Orientierungslosigkeit:
- «Stell dir vor, du wachst morgen auf und alles wäre genau so, wie du es dir wünschst. Was wäre anders? Woran würdest du es als Erstes merken?»

### Vertiefungsfragen
Geh immer eine Ebene tiefer – hinter die erste Antwort:
- «Was steckt dahinter?» / «Was meinst du damit genau?»
- «Und was bedeutet das für dich persönlich?»
- «Wenn du ganz ehrlich bist – was ist der eigentliche Wunsch?»

### Perspektivwechsel
- «Wie würde jemand, den du bewunderst, damit umgehen?»
- «Was würdest du einem Freund raten, der in derselben Situation steckt?»
- «Welche biblische Figur hat Ähnliches erlebt – und was können wir von ihr lernen?»

### Handlungsorientierte Fragen
Immer Richtung konkretes Handeln führen:
- «Was wäre ein erster, kleiner Schritt, den du diese Woche machen könntest?»
- «Was brauchst du, um anzufangen?»
- «Wer könnte dich dabei unterstützen?»

### Wichtig
- Stelle pro Antwort 1-2 gezielte Fragen – nicht mehr. Sonst wirkt es wie ein Verhör.
- **Eine Sache pro Nachricht.** Nie gleichzeitig Check-in + Bibeltext + Reflexionsfrage. Der User soll nicht scrollen müssen, um zu verstehen, was du willst.
- Wenn du eine Frage stellst, warte auf die Antwort. Beantworte deine eigene Frage nicht gleich selbst.
- Wähle die Fragetechnik passend zur Situation: Trauer → offene Fragen mit Empathie. Stagnation → Wunderfrage. Zielsetzung → Skalierung + Handlung.
- Lass Stille zu: Manchmal ist die beste Antwort eine einzige gute Frage.

## Formatierung
- Schreibe in einem natürlichen, gepflegten Deutsch (Schweiz). Vermeide gestelzte oder übertrieben formale Formulierungen. Schreibe so, wie ein gebildeter, warmherziger Seelsorger sprechen würde.
- Beginne deine Antwort direkt mit dem Inhalt – keine unnötigen Einleitungen wie «Das ist eine tolle Frage» oder «Danke für deine Frage».

### WICHTIG: Optionen als klickbare Buttons
Wenn du dem Nutzer Auswahlmöglichkeiten anbietest, MUSST du folgendes Format verwenden – die App erkennt dieses Muster und zeigt die Optionen als klickbare Buttons an:

KORREKT (jede Option auf eigener Zeile, Buchstabe + Klammer):
a) Erste Option
b) Zweite Option
c) Dritte Option

FALSCH (Optionen im Fliesstext – wird NICHT als Button erkannt):
"Wir könnten a) das eine oder b) das andere machen."

Regeln:
- Schreibe Optionen IMMER als separate Zeilen, beginnend mit a), b), c) etc.
- Schreibe NIEMALS Optionen inline in einem Satz oder Absatz.
- Jede Option soll kurz und klar formuliert sein (max. 1-2 Sätze).
- Schreibe den einleitenden Text VOR den Optionen, dann eine Leerzeile, dann die Optionen.

### PFLICHT: Reflexionsfrage und Optionen bilden EINE Einheit
- Beende JEDE Antwort mit einer Reflexionsfrage, gefolgt von 2-4 Optionen (a, b, c…).
- Die Optionen MÜSSEN direkte Antwortmöglichkeiten oder Vertiefungen der gestellten Reflexionsfrage sein. Die Frage ist die Einleitung zu den Optionen.
- Eine der Optionen soll IMMER eine offene Einladung sein, frei zu antworten (z.B. "Ich möchte frei darauf antworten" oder "Ich habe dazu eigene Gedanken").
- Ausnahme: Wenn der Nutzer sich explizit verabschiedet oder das Gespräch beendet, brauchst du keine Optionen.

BEISPIEL RICHTIG:
Was denkst du — warum halten wir manchmal lieber an unseren Sorgen fest?

a) Vielleicht weil Sorgen uns ein Gefühl von Kontrolle geben
b) Lass uns anschauen, was die Bibel konkret dazu sagt (Philipper 4,6-7)
c) Ich möchte frei darauf antworten

BEISPIEL FALSCH (Optionen haben nichts mit der Frage zu tun):
Was denkst du — warum halten wir manchmal lieber an unseren Sorgen fest?

a) Lass uns über Dankbarkeit sprechen
b) Möchtest du einen Psalm dazu hören?
c) Erzähl mir mehr über dein Anliegen

## Kritische Auseinandersetzung & Wachstum
Du bist kein Weichspüler. Geistliches Wachstum braucht auch Reibung:

### Herausfordernde Begleitung
- Konfrontiere liebevoll mit unbequemen Bibelstellen, wenn sie zur Frage passen.
- Zeige auch die herausfordernden Seiten der biblischen Botschaft: Gerechtigkeit, Umkehr, Verantwortung.

### Intellektuelle Redlichkeit
- Benenne Spannungen in der Bibel ehrlich (z.B. Gewalt im AT, Paulus und Frauen).
- Unterscheide klar zwischen historischem Kontext und heutiger Anwendung.
- Sage «Das ist eine offene Frage in der Theologie», wenn es so ist.
- Fördere kritisches Denken als Ausdruck eines reifen Glaubens – nicht als Gegensatz dazu.

### Prophetische Tradition
- Die Propheten waren unbequem – du darfst es auch sein.
- Thematisiere soziale Gerechtigkeit, Verantwortung für Schwache, Konsumkritik – wenn der Text es hergibt.
- Glaube ist nicht nur Trost, sondern auch Anspruch und Sendung.

## Positive Psychology Guardrails
Du integrierst wissenschaftlich fundierte Erkenntnisse der Positiven Psychologie – aber nicht als Wohlfühlprogramm:

### PERMA-Modell (Martin Seligman)
- **P**ositive Emotionen: Fördere Dankbarkeit, Hoffnung und Freude – aber auch das Aushalten von Dunkelheit (Psalm 88).
- **E**ngagement: Ermutige zur aktiven, auch unbequemen Auseinandersetzung mit dem Glauben.
- **R**elationships: Betone Gemeinschaft und Nächstenliebe – auch als Herausforderung, nicht nur als Geborgenheit.
- **M**eaning: Sinnfindung schliesst Ringen und Zweifeln ein (Jakob am Jabbok).
- **A**ccomplishment: Feiere Fortschritte, aber fordere auch nächste Schritte heraus.

### Resilienz & Sinnfindung (Viktor Frankl)
- In schwierigen Zeiten: Validiere Gefühle zuerst, dann biete Perspektive – auch herausfordernde.
- Vermeide toxische Positivität UND billigen Trost. Stattdessen: ehrliche, manchmal unbequeme Begleitung.
- Leid kann Sinn haben, ohne dass man es schönreden muss.

### Dankbarkeitsforschung (Robert Emmons)
- Rege Dankbarkeitspraxis an – aber nicht als Verdrängung von berechtigtem Zorn oder Trauer.

### Vergebungspsychologie (Everett Worthington)
- Vergebung ist ein Prozess, kein schneller Ratschlag. Dränge nie zur Vergebung.

## Lebensbegleitung & persönliche Entwicklung
Du bist nicht nur für spontane Fragen da – du begleitest Menschen auf ihrem Weg. Aktiv, strukturiert, über die Zeit hinweg.

### Zu sich selbst finden
- Hilf Menschen, ihre Gaben, Stärken und Berufung zu entdecken – biblisch fundiert (z.B. Römer 12, 1. Korinther 12).
- Stelle gezielte Fragen: «Was macht dir Freude? Wo spürst du, dass du gebraucht wirst? Was fällt dir leicht, anderen aber schwer?»
- Ermutige zur ehrlichen Selbstreflexion: Wer bin ich – jenseits von Rollen und Erwartungen?
- Nutze biblische Vorbilder: Mose zweifelte, David fiel, Petrus versagte – und alle fanden ihren Weg.

### Lebensplanung & Zielsetzung
- Begleite bei konkreten Lebensentscheidungen: Beruf, Beziehungen, Prioritäten, Lebensrichtung.
- Hilf, Wünsche von Berufung zu unterscheiden: «Was willst DU – und was könnte Gott mit dir vorhaben?»
- Unterstütze beim Formulieren von Zielen – nicht nur vage Wünsche, sondern konkrete nächste Schritte.
- Nutze das Konzept der Berufung (Klesis): Jeder Mensch hat einen Platz und eine Aufgabe.
- Biete Struktur: «Was ist dein nächster kleiner Schritt? Was hindert dich? Wo brauchst du Mut?»

### Wünsche und Sehnsüchte ergründen
- Hilf Menschen, ihre tiefsten Sehnsüchte zu benennen – oft verbirgt sich hinter Unzufriedenheit ein unerfülltes Bedürfnis.
- Unterscheide zwischen Oberflächen-Wünschen und Herzens-Sehnsüchten (Psalm 37,4: «Habe deine Lust am Herrn, so wird er dir geben, was dein Herz begehrt»).
- Ermutige zu Ehrlichkeit: Es ist okay, sich etwas zu wünschen. Gott kennt unsere Wünsche.

### Christus finden & Glaubensweg
- Begleite Menschen, die (noch) nicht glauben, suchend sind oder zweifeln – ohne Druck.
- Erzähle von Jesus als Person: sein Charakter, sein Umgang mit Menschen, seine radikale Botschaft.
- Lass Raum für Fragen: «Was zieht dich an? Was stösst dich ab? Was verstehst du nicht?»
- Begleite auch den Glaubensweg von Christen: Vertiefung, Trockenheit, Zweifel, Wachstum.
- Glaube ist kein Zustand, sondern ein Weg – mit Höhen und Tälern.

### Proaktive Begleitung
- Du wartest nicht nur auf Fragen. Du darfst auch vorschlagen: «Wollen wir gemeinsam schauen, was deine nächsten Schritte sein könnten?»
- Biete thematische Vertiefungen an: «Sollen wir uns diese Woche mit dem Thema Vergebung / Berufung / Dankbarkeit beschäftigen?»
- Erinnere an Fortschritte: «Letztens hast du über X gesprochen. Wie geht es dir damit?»

## Kein automatisches Coaching-Programm
Führe einfach gute, tiefe Gespräche – offen, warmherzig, biblisch fundiert. Biete KEINE strukturierte Begleitung, Check-ins oder Tages-Programme an, es sei denn der Nutzer fragt ausdrücklich danach.

## Seelsorgerische Leitlinien
1. **Sicherheit zuerst**: Bei Suizidgedanken, Gewalt oder akuten Krisen → sofort an professionelle Hilfe verweisen (Dargebotene Hand 143, Pro Juventute 147).
2. **Keine Diagnosen**: Stelle keine psychologischen oder medizinischen Diagnosen.
3. **Respekt ohne Beliebigkeit**: Begegne jedem mit Würde – aber verwechsle Respekt nicht mit Gleichgültigkeit. Du darfst eine klare biblische Position einnehmen.
4. **Grenzen kennen**: Sage offen, wenn eine Frage professionelle Beratung erfordert.
5. **Empathie UND Ehrlichkeit**: Höre zu, zeige Verständnis – und traue dich, auch Unbequemes zu sagen.

## Antwortformat
- Beginne mit Bezug zur Frage – empathisch oder herausfordernd, je nach Kontext.
- Nenne relevante Bibelstellen mit Quellenangabe – auch unbequeme.
- Gib eine verständliche Einordnung mit verschiedenen Perspektiven.
- Verwende Markdown für Struktur.
- ANTWORTLÄNGE: Wird dynamisch per [ADAPTIVE-LENGTH] Anweisung gesteuert – halte dich strikt daran.

## WICHTIG – Interaktive Gesprächsführung
Beende JEDE Antwort mit einer Anschlussfrage oder Auswahl, damit der Nutzer einfach weiterkommt. Formuliere 2-3 konkrete Optionen, die der Nutzer mit einem Buchstaben oder kurzen Wort beantworten kann. Beispiele:

- «Wie möchtest du weitermachen?\na) Einen weiteren Vers zu diesem Thema\nb) Eine praktische Übung für heute\nc) Etwas anderes besprechen»

- «Hilft dir das weiter? (Ja / Nein / Mehr dazu)»

- «Was beschäftigt dich gerade am meisten?\na) Beziehungen\nb) Arbeit & Beruf\nc) Innerer Frieden\nd) Etwas anderes»

Passe die Optionen immer an den Gesprächskontext an. Wenn der Nutzer mit a, b, c etc. antwortet, beziehe dich auf die zuletzt gestellten Optionen.

## Abwechslung & Varianz
Wenn ein Nutzer ein allgemeines Thema anspricht (z.B. Taufe, Gebet, Angst, Vergebung), wähle JEDES MAL einen anderen Einstieg:
- Andere Bibelstelle (nicht immer die bekannteste – überrasche!)
- Andere Perspektive (mal persönlich, mal historisch, mal theologisch, mal kulturell)
- Anderer Ton (mal tröstend, mal herausfordernd, mal erzählerisch, mal philosophisch)
- Andere biblische Figur oder Geschichte als Aufhänger
Wiederhole dich nie. Selbst bei identischen Fragen soll jede Antwort frisch und überraschend sein.

## PFLICHT: Querverweise immer mit exakter Bibelstellenangabe
Wenn du auf andere biblische Geschichten, Personen oder Ereignisse verweist (z.B. «Das erinnert an Jona», «Wie bei David», «Paulus schreibt dazu»), MUSST du IMMER die exakte Bibelstelle mit Kapitel und Vers angeben. Beispiele:
- RICHTIG: «Das erinnert an die Geschichte von Jona (Jona 2,1-11), der...»
- RICHTIG: «Ähnlich wie David in Psalm 23,4 schreibt...»
- RICHTIG: «Paulus greift das in Römer 8,28 auf...»
- FALSCH: «Das erinnert an Jona» (ohne Stellenangabe)
- FALSCH: «Wie David sagt...» (ohne Kapitel/Vers)
Jede erwähnte biblische Person, Geschichte oder Lehre muss mit einer konkreten, überprüfbaren Bibelstelle versehen sein (Buch Kapitel,Vers). Erfinde KEINE Stellenangaben – wenn du dir unsicher bist, verwende das search_bible_verses-Tool, um die korrekte Stelle zu finden.`;

// ── Crisis detection ───────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  // Deutsch
  "sterben will", "nicht mehr leben", "suizid", "selbstmord", "umbringen",
  "ich halte es nicht mehr aus", "keinen ausweg mehr", "alles beenden",
  "mir das leben nehmen", "ich will nicht mehr",
  // Englisch
  "want to die", "kill myself", "suicide", "end my life", "no reason to live",
  // Französisch
  "je veux mourir", "me suicider", "plus envie de vivre", "mettre fin",
  // Italienisch
  "voglio morire", "suicidio", "togliermi la vita", "non ce la faccio più",
  "farla finita", "non voglio più vivere",
  // Portugiesisch
  "quero morrer", "suicídio", "tirar minha vida", "não aguento mais",
  "acabar com tudo", "não quero mais viver",
  // Spanisch
  "quiero morir", "suicidio", "quitarme la vida", "no puedo más",
  "acabar con todo", "no quiero vivir",
  // Niederländisch
  "wil dood", "zelfmoord", "niet meer leven", "ik hou het niet meer vol",
  // Polnisch
  "chcę umrzeć", "samobójstwo", "nie chcę żyć",
  // Rumänisch
  "vreau să mor", "sinucidere", "nu mai vreau să trăiesc",
  // Kroatisch / Serbisch
  "želim umrijeti", "samoubojstvo", "ne želim više živjeti",
  // Ukrainisch
  "хочу померти", "суїцид", "не хочу жити",
  // Russisch
  "хочу умереть", "суицид", "не хочу жить"
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

const CRISIS_PREFIX = `🆘 **Wenn du gerade in einer Notlage bist / If you are in crisis:**
- 🇨🇭 Die Dargebotene Hand: **143** (24h, kostenlos, anonym)
- 🇩🇪 Telefonseelsorge: **0800 111 0 111** (kostenlos, 24h)
- 🇦🇹 Telefonseelsorge: **142** (kostenlos, 24h)
- 🇮🇹 Telefono Amico: **02 2327 2327** · Telefono Azzurro: **19696**
- 🇧🇷 CVV — Centro de Valorização da Vida: **188** (24h)
- 🇵🇹 SOS Voz Amiga: **213 544 545**
- 🇪🇸 Teléfono de la Esperanza: **717 003 717**
- 🇳🇱 113 Zelfmoordpreventie: **0800 0113** (24h)
- 🇵🇱 Telefon Zaufania: **116 123**
- 🇷🇴 Telefonul Sufletului: **0800 801 200**
- 🇭🇷 Plavi Telefon: **0800 0551**
- 🇺🇦 Лайфлайн Україна: **7333** (24h)
- 🇷🇺 Телефон доверия: **8-800-2000-122**
- 🌍 International: [findahelpline.com](https://findahelpline.com)

---

`;

// ── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, journeyDay, language, mode, preferredTranslation, screenWidth } = await req.json();

    // Crisis check on latest user message
    const latestUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const isCrisisMessage = latestUserMsg ? detectCrisis(latestUserMsg.content) : false;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Generate title mode ===
    if (mode === "generate_title") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const titleResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "Generiere einen kurzen, prägnanten Titel (max 50 Zeichen) für dieses Gespräch. Nur den Titel ausgeben, keine Anführungszeichen, keine Erklärung. Deutsch (Schweiz), kein ß."
            },
            ...messages.slice(0, 4),
          ],
          stream: false,
        }),
      });

      if (!titleResp.ok) {
        return new Response(JSON.stringify({ error: "Title generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const titleData = await titleResp.json();
      const title = titleData.choices?.[0]?.message?.content?.trim() || "";
      return new Response(JSON.stringify({ title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Generate follow-up suggestions mode ===
    if (mode === "generate_followups") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const lang = language || "de";
      const langInstruction = lang !== "de"
        ? `Respond in ${lang === "en" ? "English" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : lang}. `
        : "Antworte auf Deutsch (Schweiz, kein ß). ";

      const followupResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `${langInstruction}Du generierst genau 4 kurze Follow-up-Vorschläge basierend auf dem Gesprächskontext. Jeder Vorschlag soll den Nutzer einladen, tiefer in ein Thema einzusteigen. Sei kreativ und abwechslungsreich. Antworte AUSSCHLIESSLICH als JSON-Array von Objekten mit "emoji" (1 Emoji) und "label" (max 40 Zeichen) und "prompt" (die tatsächliche Frage/Nachricht). Beispiel: [{"emoji":"🐑","label":"Das Bild des Hirten","prompt":"Erkläre mir das Bild des Hirten in Psalm 23 genauer"},{"emoji":"📜","label":"Historischer Kontext","prompt":"Was ist der historische Kontext von diesem Text?"},{"emoji":"🙏","label":"Gebet dazu","prompt":"Kannst du mir ein Gebet zu diesem Thema formulieren?"},{"emoji":"💡","label":"Etwas ganz anderes","prompt":"Erzähl mir etwas Überraschendes aus der Bibel"}]. Keine Markdown-Codeblöcke, nur reines JSON.`
            },
            ...messages.slice(-4),
          ],
          stream: false,
        }),
      });

      if (!followupResp.ok) {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const followupData = await followupResp.json();
      const raw = followupData.choices?.[0]?.message?.content?.trim() || "[]";
      let suggestions = [];
      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        suggestions = [];
      }
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inject language instruction and journey context into system prompt
    let systemPrompt = SYSTEM_PROMPT;
    const lang = language || "de";
    if (lang !== "de") {
      const langNames: Record<string, string> = { en: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", pl: "Polish", cs: "Czech" };
      systemPrompt += `\n\n[LANGUAGE OVERRIDE: The user's interface is set to ${langNames[lang] || lang}. You MUST respond in ${langNames[lang] || lang}. Adapt Bible quotes to well-known translations in that language. Keep your coaching style and depth identical.]`;
    }

    // === Adaptive response length ===
    const msgCount = messages.filter((m: { role: string }) => m.role === "user").length;
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const lastUserLen = lastUserMsg?.content?.length || 0;
    const isMobile = typeof screenWidth === "number" && screenWidth < 500;
    const mobileSuffix = isMobile ? " Du schreibst für ein kleines Display – max. 2 kurze Absätze vor den Optionen." : "";

    let lengthInstruction: string;
    if (lastUserLen < 20) {
      lengthInstruction = `[ADAPTIVE-LENGTH] Der User hat sehr kurz geantwortet (${lastUserLen} Zeichen). Antworte kompakt: 60-100 Wörter. Schnell zum Punkt.${mobileSuffix}`;
    } else if (msgCount <= 2) {
      lengthInstruction = `[ADAPTIVE-LENGTH] Gesprächsbeginn (${msgCount} User-Nachrichten). Antworte kurz und einladend: 80-120 Wörter. Der User soll antworten wollen, nicht lesen müssen.${mobileSuffix}`;
    } else if (msgCount <= 6) {
      lengthInstruction = `[ADAPTIVE-LENGTH] Aufwärmphase (${msgCount} User-Nachrichten). 120-180 Wörter. Mehr Tiefe, eine Bibelstelle, eine Reflexionsfrage.${mobileSuffix}`;
    } else {
      const maxWords = isMobile ? 175 : 250;
      lengthInstruction = `[ADAPTIVE-LENGTH] Vertiefungsphase (${msgCount} User-Nachrichten). 150-${maxWords} Wörter. Der User ist engagiert, du darfst ausführlicher werden.${mobileSuffix}`;
    }
    if (lastUserLen > 200) {
      lengthInstruction = `[ADAPTIVE-LENGTH] Der User hat ausführlich geschrieben (${lastUserLen} Zeichen). Antworte angemessen: 150-${isMobile ? 175 : 250} Wörter, aber strukturiert.${mobileSuffix}`;
    }
    systemPrompt += `\n\n${lengthInstruction}\nGRUNDREGEL: Lieber zu kurz als zu lang. Eine gute Frage am Ende ist wertvoller als ein langer Absatz.`;


    const TRANSLATION_NAMES: Record<string, string> = {
      zuercher: "Zürcher Bibel (2007)", zuercher2007: "Zürcher Bibel (2007)",
      luther2017: "Lutherbibel (2017)", luther: "Lutherbibel (2017)",
      einheitsuebersetzung: "Einheitsübersetzung (2016)", eu2016: "Einheitsübersetzung (2016)",
      schlachter2000: "Schlachter 2000", schlachter: "Schlachter 2000",
      elberfelder2006: "Elberfelder 2006", elberfelder: "Elberfelder 2006",
      luther1912: "Lutherbibel 1912",
      kjv: "King James Version (KJV)", web: "World English Bible (WEB)",
    };
    const MODERN_TRANSLATIONS = new Set(["zuercher", "zuercher2007", "luther2017", "luther", "einheitsuebersetzung", "eu2016", "schlachter2000", "schlachter", "elberfelder2006", "elberfelder"]);
    if (preferredTranslation && TRANSLATION_NAMES[preferredTranslation]) {
      const isModern = MODERN_TRANSLATIONS.has(preferredTranslation);
      if (isModern) {
        systemPrompt += `\n\n[BEVORZUGTE ÜBERSETZUNG: Der Nutzer hat «${TRANSLATION_NAMES[preferredTranslation]}» als bevorzugte Bibelübersetzung gewählt. Dies ist eine moderne Übersetzung – zitiere aus deinem Trainingswissen. Verwende das lookup-Tool nur zur Gegenprüfung mit einer historischen Übersetzung, wenn du dir unsicher bist.]`;
      } else {
        systemPrompt += `\n\n[BEVORZUGTE ÜBERSETZUNG: Der Nutzer hat «${TRANSLATION_NAMES[preferredTranslation]}» als bevorzugte Bibelübersetzung gewählt. Verwende bei lookup_bible_verse IMMER diese Übersetzung.]`;
      }
    }

    // 7 Whys guided mode
    if (mode === "seven-whys") {
      systemPrompt += `\n\n[7-WARUMS-MODUS – GEFÜHRTER TIEFENCOACHING-PROZESS]
Du führst jetzt einen geführten «7 Warums»-Prozess durch. Das ist eine Tiefenübung, inspiriert von der «5 Whys»-Methode, erweitert auf 7 Ebenen mit biblischer Begleitung.

ABLAUF:
1. Der Nutzer nennt ein Thema, eine Sorge oder einen Wunsch.
2. Du stellst 7 Mal «Warum?» – jedes Mal eine Ebene tiefer. Zähle mit: «Warum? (1/7)», «Warum? (2/7)» usw.
3. Jede Warum-Frage ist einfühlsam formuliert, nicht mechanisch. Beziehe dich auf die letzte Antwort.
4. Nach der 7. Antwort: Fasse die Reise zusammen, zeige den Weg von der Oberfläche zur tiefsten Erkenntnis, und gib 2-3 passende Bibelverse mit Kontext zur tiefsten Ebene.
5. Biete am Ende eine praktische Übung oder einen nächsten Schritt an.

REGELN:
- Stelle pro Nachricht NUR EINE Frage. Keine langen Texte zwischen den Warums.
- Validiere kurz die Antwort des Nutzers (1 Satz), dann die nächste Warum-Frage.
- Wenn der Nutzer emotional wird: Zeige Empathie, aber führe sanft weiter.
- Nach Warum 7: Die Zusammenfassung soll die «Reise» zeigen – wie ein roter Faden von der ersten Aussage zur tiefsten Erkenntnis.
- Die Bibelverse am Ende sollen die tiefste Erkenntnis spiegeln, nicht das Oberflächenthema.

BEISPIEL-FLOW:
User: «Ich bin unzufrieden mit meiner Arbeit.»
Bot: «Danke, dass du das teilst. Lass uns gemeinsam tiefer schauen. Warum bist du unzufrieden mit deiner Arbeit? (1/7)»
...nach 7 Runden...
Bot: «[Zusammenfassung der Reise] ... [Bibelverse zur tiefsten Erkenntnis] ... [Praktischer nächster Schritt]»`;
    }

    // Journey context removed from public chat — no check-in questions

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // If conversation exceeds 50 messages, summarize older ones
    let finalMessages = messages;
    if (messages.length > 50) {
      const olderMessages = messages.slice(0, messages.length - 50);
      const recentMessages = messages.slice(messages.length - 50);

      const olderText = olderMessages
        .map((m: any) => `${m.role === 'assistant' ? 'Bot' : 'User'}: ${m.content}`)
        .join('\n');

      const summaryResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Fasse das folgende Gespräch in 3-5 Sätzen zusammen. Fokus auf: Hauptthemen, persönliche Situation des Nutzers, wichtige Erkenntnisse, offene Fragen. Deutsch (Schweiz), kein ß."
              },
              { role: "user", content: olderText }
            ],
            stream: false,
          }),
        }
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        const summary = summaryData.choices?.[0]?.message?.content || "";
        if (summary) {
          systemPrompt += `\n\n[ZUSAMMENFASSUNG FRÜHERER GESPRÄCHE]\n${summary}\n[ENDE ZUSAMMENFASSUNG]`;
        }
      }

      finalMessages = recentMessages;
    }

    // ── Step 1: Non-streaming call WITH tools to let AI decide which verses to look up ──
    const initialResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.8,
          messages: [
            { role: "system", content: systemPrompt },
            ...finalMessages,
          ],
          tools: [BIBLE_LOOKUP_TOOL, BIBLE_SEARCH_TOOL, THEOLOGY_SEARCH_TOOL],
        }),
      }
    );

    if (!initialResponse.ok) {
      if (initialResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (initialResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte später erneut versuchen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, text);
      return new Response(
        JSON.stringify({ error: "KI-Fehler aufgetreten" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const initialData = await initialResponse.json();
    const choice = initialData.choices?.[0];

    // Check if the AI wants to call the Bible lookup tool
    if (choice?.finish_reason === "tool_calls" || choice?.message?.tool_calls?.length > 0) {
      const toolCalls = choice.message.tool_calls || [];
      
      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        toolCalls.map(async (tc: any) => {
          if (tc.function.name === "lookup_bible_verse") {
            try {
              const args = JSON.parse(tc.function.arguments);
              const result = await lookupBibleVerse(
                args.book,
                args.chapter,
                args.verse_start,
                args.verse_end,
                args.translation
              );
              return { id: tc.id, result };
            } catch (e) {
              console.error("Tool call error:", e);
              return { id: tc.id, result: "Fehler beim Nachschlagen des Verses." };
            }
          }
          if (tc.function.name === "search_bible_verses") {
            try {
              const args = JSON.parse(tc.function.arguments);
              const result = await searchBibleVerses(
                args.query,
                args.translation
              );
              return { id: tc.id, result };
            } catch (e) {
              console.error("Search tool error:", e);
              return { id: tc.id, result: "Fehler bei der Bibelsuche." };
            }
          }
          if (tc.function.name === "search_theology") {
            try {
              const args = JSON.parse(tc.function.arguments);
              const result = await searchTheology(
                args.query,
                args.source_type
              );
              return { id: tc.id, result };
            } catch (e) {
              console.error("Theology search error:", e);
              return { id: tc.id, result: "Fehler bei der theologischen Suche." };
            }
          }
          return { id: tc.id, result: "Unbekanntes Tool." };
        })
      );

      // ── Step 2: Send tool results back and stream the final response ──
      const followUpMessages = [
        { role: "system", content: systemPrompt },
        ...finalMessages,
        choice.message, // assistant message with tool_calls
        ...toolResults.map((tr: any) => ({
          role: "tool" as const,
          tool_call_id: tr.id,
          content: tr.result,
        })),
      ];

      const streamResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.8,
            messages: followUpMessages,
            stream: true,
          }),
        }
      );

      if (!streamResponse.ok) {
        const errText = await streamResponse.text();
        console.error("Stream after tool call error:", streamResponse.status, errText);
        return new Response(
          JSON.stringify({ error: "KI-Fehler aufgetreten" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Stream with spelling fix
      const reader = streamResponse.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let chunkIndex = 0;
      const stream = new ReadableStream({
        async start(controller) {
          if (isCrisisMessage) {
            const crisisSSE = JSON.stringify({ choices: [{ delta: { content: CRISIS_PREFIX }, finish_reason: null }] });
            controller.enqueue(encoder.encode(`data: ${crisisSSE}\n\n`));
          }
        },
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) { controller.close(); return; }
          let text = decoder.decode(value, { stream: true });
          text = text.replace(/"content":"([^"]*)"/g, (_match, content) => {
            return `"content":"${fixSpelling(content)}"`;
          });
          chunkIndex++;
          controller.enqueue(encoder.encode(text));
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── No tool calls: re-stream the response ──
    // The initial call was non-streaming. We need to stream the final answer.
    // Since we already have the complete response, convert it to SSE format.
    const content = choice?.message?.content || "";
    const fixedContent = fixSpelling(content);

    // Stream it as SSE to maintain the same client interface
    const encoder = new TextEncoder();
    const finalContent = isCrisisMessage ? CRISIS_PREFIX + fixedContent : fixedContent;
    const stream = new ReadableStream({
      start(controller) {
        // Send as a single chunk in SSE format
        const sseData = JSON.stringify({
          choices: [{
            delta: { content: finalContent },
            finish_reason: null,
          }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));

        // Send done
        const doneData = JSON.stringify({
          choices: [{
            delta: {},
            finish_reason: "stop",
          }],
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("bibelbot-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

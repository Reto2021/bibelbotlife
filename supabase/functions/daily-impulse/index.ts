import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Fix common AI spelling mistakes for German/Swiss German
function fixSpelling(text: string): string {
  const wordFixes: [RegExp, string][] = [
    [/\b([Ff])uell/g, '$1üll'], [/\b([Ee])rfuell/g, '$1rfüll'],
    [/\b([Gg])efuehl/g, '$1efühl'], [/\b([Ff])uehr/g, '$1ühr'],
    [/\b([Ww])uerdig/g, '$1ürdig'], [/\b([Ww])uensch/g, '$1ünsch'],
    [/\b([Gg])lueck/g, '$1lück'], [/\b([Zz])urueck/g, '$1urück'],
    [/\b([Ss])tueck/g, '$1tück'], [/\b([Uu])ebung/g, '$1bung'],
    [/\b([Uu])eber(?!all)/g, '$1ber'], [/\b([Gg])uet/g, '$1üt'],
    [/\b([Mm])uede/g, '$1üde'], [/\b([Mm])uess/g, '$1üss'],
    [/\b([Ss])uend/g, '$1ünd'], [/\b([Tt])uer(?!k)/g, '$1ür'],
    [/\b([Nn])uetz/g, '$1ütz'], [/\b([Pp])ruef/g, '$1rüf'],
    [/\b([Ww])uerd/g, '$1ürd'], [/\b([Ss])pueren/g, '$1püren'],
    [/\b([Ff])uer\b/g, '$1ür'], [/\b([Nn])atuerlich/g, '$1atürlich'],
    [/\b([Ee])rzaehl/g, '$1rzähl'], [/\b([Gg])espraech/g, '$1espräch'],
    [/\b([Nn])aechst/g, '$1ächst'], [/\b([Tt])aeglich/g, '$1äglich'],
    [/\b([Ss])paet/g, '$1pät'], [/\b([Ss])taerk/g, '$1tärk'],
    [/\b([Gg])naed/g, '$1näd'], [/\b([Ww])aer/g, '$1är'],
    [/\b([Hh])oer/g, '$1ör'], [/\b([Ss])choepf/g, '$1chöpf'],
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Language-specific configurations
const LANG_CONFIG: Record<string, { name: string; translations: string; quoteStyle: [string, string]; spellingFix: boolean }> = {
  de: { name: "German (Swiss)", translations: "Lutherbibel 2017, Schlachter 2000, or Elberfelder 2006", quoteStyle: ["«", "»"], spellingFix: true },
  en: { name: "English", translations: "NIV, ESV, or KJV", quoteStyle: ['"', '"'], spellingFix: false },
  fr: { name: "French", translations: "Louis Segond (LSG), Bible de Jérusalem, or TOB", quoteStyle: ["«\u00A0", "\u00A0»"], spellingFix: false },
  es: { name: "Spanish", translations: "Reina-Valera 1995 (RVR1995), NVI, or LBLA", quoteStyle: ["«", "»"], spellingFix: false },
  it: { name: "Italian", translations: "CEI 2008, Nuova Riveduta (NR2006), or Nuova Diodati", quoteStyle: ["«", "»"], spellingFix: false },
  pt: { name: "Portuguese", translations: "Almeida Revista e Atualizada (ARA), NVI-PT, or ACF", quoteStyle: ["«", "»"], spellingFix: false },
  nl: { name: "Dutch", translations: "NBV21, Herziene Statenvertaling (HSV), or NBG", quoteStyle: ["\u2018", "\u2019"], spellingFix: false },
  pl: { name: "Polish", translations: "Biblia Tysi\u0105clecia (BT), Biblia Warszawska, or UBG", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  ro: { name: "Romanian", translations: "Cornilescu (RMNN), EDCR, or VDC", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  ru: { name: "Russian", translations: "\u0421\u0438\u043D\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 (RST), NRP, or BTIH", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  uk: { name: "Ukrainian", translations: "Ohienko, Khomenko, or UCB", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  ko: { name: "Korean", translations: "NKRV, RNKSV, or Common Translation", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  zh: { name: "Chinese", translations: "CUV, New Punctuation CUV, or CCB", quoteStyle: ["\u300C", "\u300D"], spellingFix: false },
  ar: { name: "Arabic", translations: "Van Dyck (SVD), New Arabic Version (NAV), or Book of Life", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  sv: { name: "Swedish", translations: "Bibel 2000, Svenska Folkbibeln (SFB), or Karl XII", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  da: { name: "Danish", translations: "Bibelen p\u00E5 Hverdagsdansk (BPH), DO1992, or DO1871", quoteStyle: ["\u00BB", "\u00AB"], spellingFix: false },
  no: { name: "Norwegian", translations: "Bibelen 2011 (NO2011), Bibelen Guds Ord (BGO), or NB1988", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  fi: { name: "Finnish", translations: "Raamattu 1992 (R1992), Kirkkoraamattu, or R1938", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  hu: { name: "Hungarian", translations: "RUF, Karoli (KAR), or HUNB", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  cs: { name: "Czech", translations: "Bible21, CEP, or Kralicka bible", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  sk: { name: "Slovak", translations: "SEP, Rohacek, or KAT", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  hr: { name: "Croatian", translations: "Jeruzalemska Biblija (JB), Saric, or Knjiga o Kristu", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  sr: { name: "Serbian", translations: "Sinod (SYN), Karadzic, or Contemporary Translation", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  bg: { name: "Bulgarian", translations: "BNNT, Bible 1940, or CBT", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  el: { name: "Greek", translations: "TGVD, Vamva, or Filos", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  he: { name: "Hebrew", translations: "Tanakh, New Hebrew Translation, or Dead Sea Scrolls", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  id: { name: "Indonesian", translations: "Terjemahan Baru (TB), BIS, or FAYH", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  tl: { name: "Filipino/Tagalog", translations: "Ang Biblia (ASND), Magandang Balita Biblia (MBB), or SND", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  vi: { name: "Vietnamese", translations: "BTT, BDM, or BD2011", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  sw: { name: "Swahili", translations: "Biblia Habari Njema (BHN), SUV, or Neno", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  af: { name: "Afrikaans", translations: "Nuwe Vertaling (NV), Ou Vertaling (OV), or Die Boodskap", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  am: { name: "Amharic", translations: "AMHSV, 1954 Translation, or NASV", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  hy: { name: "Armenian", translations: "Eastern Armenian (EAOR), Grabar, or ARNVSS", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
  ka: { name: "Georgian", translations: "GEO Bible, New Translation, or 1989 Translation", quoteStyle: ["\u201E", "\u201D"], spellingFix: false },
  ig: { name: "Igbo", translations: "Igbo Bible (BIB), or Igbo Union Version", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  yo: { name: "Yoruba", translations: "BMY, or Yoruba Contemporary Bible (YCB)", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  zu: { name: "Zulu", translations: "IBhayibheli (ZULC), or ISindebele", quoteStyle: ["\u201C", "\u201D"], spellingFix: false },
  ht: { name: "Haitian Creole", translations: "Bib la (HCV), or Haitian Creole Version", quoteStyle: ["\u00AB", "\u00BB"], spellingFix: false },
};

function normalizeLang(lang: string): string {
  const baseLang = lang.trim().toLowerCase().split("-")[0];
  return LANG_CONFIG[baseLang] ? baseLang : "en";
}

function getSystemPrompt(lang: string): string {
  const cfg = LANG_CONFIG[lang] || LANG_CONFIG["en"];
  const [q1, q2] = cfg.quoteStyle;

  if (lang === "de") {
    // Original German/Swiss prompt
    return `Du generierst einen täglichen biblischen Impuls. Antworte AUSSCHLIESSLICH im JSON-Format (ohne Markdown-Codeblöcke):

{
  "topic": "Kurzes Thema (2-4 Wörter)",
  "verse": "Exaktes Bibelzitat in Anführungszeichen",
  "reference": "Buch Kapitel,Vers (Übersetzung)",
  "teaser": "Ein packender Satz (max 15 Wörter), der neugierig macht und zum Klicken einlädt",
  "context": "Warum ist das heute relevant? (1-2 Sätze, alltagsnah)"
}

Regeln:
- Verwende kein "ß", immer "ss" (Schweizer Deutsch).
- Verwende IMMER korrekte Umlaute: ä, ö, ü, Ä, Ö, Ü. NIEMALS ae, oe, ue als Ersatz.
- Zitiere exakt aus ${cfg.translations}.
- Nenne immer die Übersetzung.
- Wähle Themen die berühren: Mut, Zweifel, Liebe, Gerechtigkeit, Hoffnung, Vergebung, Identität, Angst, Dankbarkeit, Berufung.
- Der Teaser soll neugierig machen – wie eine Überschrift, die man anklicken MUSS.
- Beziehe dich NUR auf den kirchlichen Kontext, der dir explizit mitgeteilt wird.
- NIEMALS behaupten "heute ist" oder "heute feiern wir" einen Feiertag, der NICHT im kirchlichen Kontext steht.
- Wenn der Kontext "Normaler Wochentag" oder "Nachösterliche Zeit" sagt, erwähne KEINEN Feiertag.
- Wenn ein Feiertag im Kontext steht, darfst du ihn erwähnen — aber NUR diesen, keinen anderen.
- Decke Altes UND Neues Testament ab – wechsle ab.
- WICHTIG: Wenn du im "context" auf andere biblische Geschichten verweist, MUSS die Bibelstelle in Klammern angegeben werden.
- Prüfe jeden Teaser: Würde ein Schweizer diesen Satz natürlich so sagen? Wenn nein, formuliere um.`;
  }

  return `You generate a daily biblical impulse in ${cfg.name}. Respond ONLY in valid JSON format (no markdown fences):

{
  "topic": "Short topic (2-4 words in ${cfg.name})",
  "verse": "Exact Bible quote wrapped in ${q1}...${q2}",
  "reference": "Book Chapter:Verse (Translation name)",
  "teaser": "A compelling sentence (max 15 words) that makes people curious — in ${cfg.name}",
  "context": "Why is this relevant today? (1-2 sentences, relatable) — in ${cfg.name}"
}

Rules:
- ALL text values (topic, verse, teaser, context) MUST be in ${cfg.name}. Never mix languages.
- Quote exactly from ${cfg.translations}. Always name the translation.
- Choose touching themes: courage, doubt, love, justice, hope, forgiveness, identity, fear, gratitude, calling.
- The teaser should be irresistible — like a headline you MUST click.
- Only reference the church context explicitly given to you.
- NEVER claim "today is" a holiday that is NOT in the church context.
- If the context says "Regular weekday", do NOT mention any holiday.
- Cover both Old AND New Testament — alternate.
- When referencing other Bible stories in "context", include the reference in parentheses.`;
}

// Compute Easter Sunday for a given year (Anonymous Gregorian algorithm)
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / msPerDay);
}

// Church context in English for non-German languages
const CHURCH_CONTEXT_EN: Record<string, string> = {
  "Adventszeit": "Advent — preparation for Christmas",
  "Weihnachten": "Christmas — Birth of Jesus Christ",
  "Silvester": "New Year's Eve",
  "Neujahr": "New Year — A new beginning",
  "Dreikönigstag": "Epiphany",
  "Karfreitag": "Good Friday — Crucifixion of Jesus",
  "Gründonnerstag": "Maundy Thursday — Last Supper",
  "Palmsonntag": "Palm Sunday — Entry into Jerusalem",
  "Karwoche": "Holy Week",
  "Fastenzeit": "Lent — Preparation for Easter",
  "Aschermittwoch": "Ash Wednesday — Beginning of Lent",
  "Ostersonntag": "Easter Sunday — Resurrection of Jesus Christ",
  "Ostermontag": "Easter Monday",
  "Karsamstag": "Holy Saturday",
  "Auffahrt": "Ascension of Christ",
  "Pfingstsonntag": "Pentecost Sunday — Outpouring of the Holy Spirit",
  "Pfingstmontag": "Pentecost Monday",
  "Fronleichnam": "Corpus Christi",
  "Allerheiligen": "All Saints' Day",
  "Reformationssonntag": "Reformation Sunday",
  "Sonntag": "Sunday — Day of rest and reflection",
  "Normaler Wochentag": "Regular weekday",
};

function getChurchContext(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();

  if (month === 12 && day >= 1 && day <= 24) return "Adventszeit – Vorbereitung auf Weihnachten";
  if (month === 12 && (day === 25 || day === 26)) return "Weihnachten – Geburt Jesu Christi";
  if (month === 12 && day === 31) return "Silvester / Jahreswechsel";
  if (month === 1 && day === 1) return "Neujahr – Neuer Anfang";
  if (month === 1 && day === 2) return "Berchtoldstag – Schweizer Feiertag";
  if (month === 1 && day === 6) return "Dreikönigstag / Epiphanias";
  if (month === 3 && day === 19) return "Josefstag";
  if (month === 8 && day === 1) return "Schweizer Nationalfeiertag";
  if (month === 8 && day === 15) return "Mariä Himmelfahrt";
  if (month === 11 && day === 1) return "Allerheiligen";
  if (month === 11 && day >= 20) return "Ewigkeitssonntag / Totengedenken naht";

  if (month === 9 && dayOfWeek === 0) {
    const sundayNum = Math.ceil(day / 7);
    if (sundayNum === 3) return "Eidgenössischer Dank-, Buss- und Bettag";
  }

  if (month === 10 && dayOfWeek === 0 && day + 7 > 31) {
    return "Reformationssonntag – Gedenken an die Reformation";
  }

  const easter = computeEaster(year);
  const diff = daysBetween(date, easter);

  if (diff === 0) return "Ostersonntag – Auferstehung Jesu Christi";
  if (diff === 1) return "Ostermontag";
  if (diff === -1) return "Karsamstag – Grabesruhe";
  if (diff === -2) return "Karfreitag – Kreuzigung Jesu";
  if (diff === -3) return "Gründonnerstag – Letztes Abendmahl";
  if (diff === -7) return "Palmsonntag – Einzug in Jerusalem";
  if (diff >= -6 && diff <= -4) return "Karwoche";
  if (diff === -46) return "Aschermittwoch – Beginn der Fastenzeit";
  if (diff > -46 && diff < -7) return "Fastenzeit – Vorbereitung auf Ostern";
  if (diff === 39) return "Auffahrt / Christi Himmelfahrt";
  if (diff === 40) return "Auffahrt-Brücke – verlängertes Wochenende nach Himmelfahrt";
  if (diff === 49) return "Pfingstsonntag – Ausgiessung des Heiligen Geistes";
  if (diff === 50) return "Pfingstmontag";
  if (diff === 60) return "Fronleichnam";
  if (diff >= 2 && diff < 39) return "Nachösterliche Zeit – wähle ein alltagsnahes Thema";
  if (diff >= 40 && diff < 49) return "Zeit zwischen Auffahrt und Pfingsten";

  if (dayOfWeek === 0) return "Sonntag – Tag der Ruhe und Besinnung";
  return "Normaler Wochentag";
}

function translateChurchContext(context: string, lang: string): string {
  if (lang === "de") return context;
  // Find matching key
  for (const [key, en] of Object.entries(CHURCH_CONTEXT_EN)) {
    if (context.includes(key)) return en;
  }
  return context; // fallback to original
}

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const url = new URL(req.url);
    const lang = normalizeLang(url.searchParams.get("lang") || "de");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const cacheKey = `impulse_${dateStr}_${lang}`;

    // ── Check DB cache first ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const { data: cached } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", cacheKey)
      .maybeSingle();

    if (cached?.value) {
      console.log(`Cache hit: ${cacheKey}`);
      return new Response(JSON.stringify(cached.value), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ── Generate new impulse ──
    console.log(`Cache miss: ${cacheKey} — generating…`);
    const churchContext = getChurchContext(now);
    const translatedContext = translateChurchContext(churchContext, lang);
    const weekday = lang === "de" ? WEEKDAYS_DE[now.getDay()] : WEEKDAYS_EN[now.getDay()];

    const userPrompt = lang === "de"
      ? `Heute ist ${weekday}, ${dateStr}. Kirchlicher Kontext: ${churchContext}. Generiere einen passenden täglichen Impuls.`
      : `Today is ${weekday}, ${dateStr}. Church context: ${translatedContext}. Generate a fitting daily impulse in ${LANG_CONFIG[lang]?.name || "the requested language"}.`;

    const systemPrompt = getSystemPrompt(lang);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let impulse;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      impulse = JSON.parse(cleaned);
      const cfg = LANG_CONFIG[lang];
      if (cfg?.spellingFix) {
        for (const key of ['topic', 'verse', 'teaser', 'context']) {
          if (impulse[key]) impulse[key] = fixSpelling(impulse[key]);
        }
      }
      impulse.date = dateStr;
    } catch {
      console.error("Failed to parse impulse:", content);
      impulse = {
        topic: "Hope",
        verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
        reference: "Jeremiah 29:11 (NIV)",
        teaser: "God has a plan \u2014 even if you can\u2019t see it yet",
        context: "Sometimes life feels aimless. This verse reminds us there is a bigger perspective.",
        date: dateStr,
      };
    }

    // ── Store in DB cache (upsert) ──
    await sb.from("app_settings").upsert(
      { key: cacheKey, value: impulse },
      { onConflict: "key" }
    );
    console.log(`Cached: ${cacheKey}`);

    return new Response(JSON.stringify(impulse), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("daily-impulse error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
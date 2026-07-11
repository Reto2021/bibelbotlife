// Parses German date/event expressions from free text (e.g. STT output).
// Returns ISO date (YYYY-MM-DD) when confidently detected, plus a cleaned-up
// event label with the date phrase removed.

const MONTHS: Record<string, number> = {
  januar: 1, jan: 1, jänner: 1,
  februar: 2, feb: 2,
  märz: 3, maerz: 3, mrz: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12,
};

const ORDINALS: Record<string, number> = {
  erste: 1, ersten: 1, erster: 1,
  zweite: 2, zweiten: 2, zweiter: 2,
  dritte: 3, dritten: 3, dritter: 3,
  vierte: 4, vierten: 4, vierter: 4,
  fünfte: 5, fünften: 5, fünfter: 5, fuenfte: 5, fuenften: 5,
  sechste: 6, sechsten: 6, sechster: 6,
  siebte: 7, siebten: 7, siebter: 7, siebente: 7, siebenten: 7,
  achte: 8, achten: 8, achter: 8,
  neunte: 9, neunten: 9, neunter: 9,
  zehnte: 10, zehnten: 10, zehnter: 10,
  elfte: 11, elften: 11, elfter: 11,
  zwölfte: 12, zwölften: 12, zwölfter: 12, zwoelfte: 12, zwoelften: 12,
  dreizehnte: 13, dreizehnten: 13,
  vierzehnte: 14, vierzehnten: 14,
  fünfzehnte: 15, fünfzehnten: 15, fuenfzehnte: 15, fuenfzehnten: 15,
  sechzehnte: 16, sechzehnten: 16,
  siebzehnte: 17, siebzehnten: 17,
  achtzehnte: 18, achtzehnten: 18,
  neunzehnte: 19, neunzehnten: 19,
  zwanzigste: 20, zwanzigsten: 20,
  einundzwanzigste: 21, einundzwanzigsten: 21,
  zweiundzwanzigste: 22, zweiundzwanzigsten: 22,
  dreiundzwanzigste: 23, dreiundzwanzigsten: 23,
  vierundzwanzigste: 24, vierundzwanzigsten: 24,
  fünfundzwanzigste: 25, fünfundzwanzigsten: 25, fuenfundzwanzigste: 25, fuenfundzwanzigsten: 25,
  sechsundzwanzigste: 26, sechsundzwanzigsten: 26,
  siebenundzwanzigste: 27, siebenundzwanzigsten: 27,
  achtundzwanzigste: 28, achtundzwanzigsten: 28,
  neunundzwanzigste: 29, neunundzwanzigsten: 29,
  dreissigste: 30, dreissigsten: 30, dreißigste: 30, dreißigsten: 30,
  einunddreissigste: 31, einunddreissigsten: 31, einunddreißigste: 31, einunddreißigsten: 31,
};

const WEEKDAYS: Record<string, number> = {
  sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3,
  donnerstag: 4, freitag: 5, samstag: 6, sonnabend: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function normalizeYear(y: number): number {
  if (y < 100) return 2000 + y;
  return y;
}

export interface ParseResult {
  date: string | null;
  cleanedText: string;
  matched: string | null;
}

/**
 * Parse a German utterance for a date. Supports:
 *  - "15.11.", "15.11.2026", "15/11/26"
 *  - "2026-11-15"
 *  - "15. November", "am fünfzehnten November"
 *  - "morgen", "übermorgen", "heute"
 *  - "nächsten Montag"
 */
export function parseGermanDate(input: string, today: Date = new Date()): ParseResult {
  const text = " " + input.toLowerCase().replace(/\s+/g, " ").trim() + " ";
  const currentYear = today.getUTCFullYear();

  // 1) ISO 2026-11-15
  const isoM = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoM) {
    const d = iso(+isoM[1], +isoM[2], +isoM[3]);
    if (d) return { date: d, matched: isoM[0], cleanedText: input.replace(isoM[0], "").trim() };
  }

  // 2) numeric DD.MM(.YYYY)?
  const numM = text.match(/(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\.?/);
  if (numM) {
    const d = +numM[1];
    const m = +numM[2];
    let y = numM[3] ? normalizeYear(+numM[3]) : currentYear;
    let candidate = iso(y, m, d);
    if (candidate) {
      // if date in the past this year and no year specified → assume next year
      if (!numM[3]) {
        const dt = new Date(candidate + "T00:00:00Z");
        if (dt.getTime() < today.getTime() - 86400_000) {
          candidate = iso(y + 1, m, d);
        }
      }
      if (candidate) {
        return {
          date: candidate,
          matched: numM[0],
          cleanedText: input.replace(new RegExp(numM[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim(),
        };
      }
    }
  }

  // 3) "15. November 2026" or "am 15. November"
  const monthNames = Object.keys(MONTHS).join("|");
  const dayMonthRe = new RegExp(`(\\d{1,2})\\.?\\s*(${monthNames})(?:\\s+(\\d{2,4}))?`, "i");
  const dm = text.match(dayMonthRe);
  if (dm) {
    const d = +dm[1];
    const m = MONTHS[dm[2].toLowerCase()];
    let y = dm[3] ? normalizeYear(+dm[3]) : currentYear;
    let candidate = iso(y, m, d);
    if (candidate) {
      if (!dm[3]) {
        const dt = new Date(candidate + "T00:00:00Z");
        if (dt.getTime() < today.getTime() - 86400_000) candidate = iso(y + 1, m, d);
      }
      if (candidate) {
        return {
          date: candidate,
          matched: dm[0],
          cleanedText: input.replace(new RegExp(dm[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim(),
        };
      }
    }
  }

  // 4) Ordinal words: "am fünfzehnten November"
  const ordinalKeys = Object.keys(ORDINALS).join("|");
  const ordRe = new RegExp(`(?:am\\s+)?(${ordinalKeys})\\s+(${monthNames})(?:\\s+(\\d{2,4}))?`, "i");
  const om = text.match(ordRe);
  if (om) {
    const d = ORDINALS[om[1].toLowerCase()];
    const m = MONTHS[om[2].toLowerCase()];
    let y = om[3] ? normalizeYear(+om[3]) : currentYear;
    let candidate = iso(y, m, d);
    if (candidate) {
      if (!om[3]) {
        const dt = new Date(candidate + "T00:00:00Z");
        if (dt.getTime() < today.getTime() - 86400_000) candidate = iso(y + 1, m, d);
      }
      if (candidate) {
        return {
          date: candidate,
          matched: om[0],
          cleanedText: input.replace(new RegExp(om[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim(),
        };
      }
    }
  }

  // 5) relative words
  const rel = text.match(/\b(heute|morgen|übermorgen|uebermorgen)\b/);
  if (rel) {
    const offset = rel[1] === "heute" ? 0 : rel[1] === "morgen" ? 1 : 2;
    const dt = new Date(today);
    dt.setUTCDate(dt.getUTCDate() + offset);
    const d = iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())!;
    return {
      date: d,
      matched: rel[1],
      cleanedText: input.replace(new RegExp(`\\b${rel[1]}\\b`, "i"), "").trim(),
    };
  }

  // 6) "nächsten/kommenden Montag"
  const wdKeys = Object.keys(WEEKDAYS).join("|");
  const wdRe = new RegExp(`\\b(?:n(?:ä|ae)chsten|kommenden|am)?\\s*(${wdKeys})\\b`, "i");
  const wd = text.match(wdRe);
  if (wd) {
    const target = WEEKDAYS[wd[1].toLowerCase()];
    const dt = new Date(today);
    const cur = dt.getUTCDay();
    let diff = (target - cur + 7) % 7;
    if (diff === 0) diff = 7;
    dt.setUTCDate(dt.getUTCDate() + diff);
    const d = iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())!;
    return {
      date: d,
      matched: wd[0].trim(),
      cleanedText: input.replace(new RegExp(wd[0].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim(),
    };
  }

  return { date: null, matched: null, cleanedText: input.trim() };
}

/**
 * From a raw utterance, extract a person's name (first capitalized token or
 * word after "von/für"). Best-effort — the user can always correct.
 */
export function extractPersonName(input: string): string | null {
  const forFrom = input.match(/\b(?:für|fuer|von)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/);
  if (forFrom) return forFrom[1];
  const cap = input.match(/\b([A-ZÄÖÜ][a-zäöüß]{2,})\b/);
  if (cap) return cap[1];
  return null;
}

/** Clean event label: capitalise first letter, trim filler words. */
export function cleanEventLabel(text: string): string {
  const cleaned = text
    .replace(/^\s*(?:ich\s+habe\s+|am\s+|der\s+|die\s+|das\s+|ein\s+|eine\s+|einen\s+)/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/, "");
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

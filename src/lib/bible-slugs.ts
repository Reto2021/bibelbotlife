/**
 * Universal book-slug system for multilingual SEO.
 * Slugs are English/standard (john, romans, 1-corinthians) so URLs are stable
 * across all 38 languages. Content (verse text, reflection) adapts to user's
 * active language at render time.
 */

export interface BookEntry {
  slug: string;        // canonical URL slug
  number: number;      // book_number in DB
  testament: "ot" | "nt";
  /** localized book names per language code → matches `book` column in bible_verses */
  names: Record<string, string[]>;
}

// Compact list — names array allows multiple variants (e.g. "1. Mose" / "Genesis")
export const BOOKS: BookEntry[] = [
  // OT
  { slug: "genesis", number: 1, testament: "ot", names: { de: ["1. Mose", "Genesis"], en: ["Genesis"] } },
  { slug: "exodus", number: 2, testament: "ot", names: { de: ["2. Mose", "Exodus"], en: ["Exodus"] } },
  { slug: "leviticus", number: 3, testament: "ot", names: { de: ["3. Mose", "Levitikus"], en: ["Leviticus"] } },
  { slug: "numbers", number: 4, testament: "ot", names: { de: ["4. Mose", "Numeri"], en: ["Numbers"] } },
  { slug: "deuteronomy", number: 5, testament: "ot", names: { de: ["5. Mose", "Deuteronomium"], en: ["Deuteronomy"] } },
  { slug: "joshua", number: 6, testament: "ot", names: { de: ["Josua"], en: ["Joshua"] } },
  { slug: "judges", number: 7, testament: "ot", names: { de: ["Richter"], en: ["Judges"] } },
  { slug: "ruth", number: 8, testament: "ot", names: { de: ["Ruth", "Rut"], en: ["Ruth"] } },
  { slug: "1-samuel", number: 9, testament: "ot", names: { de: ["1. Samuel"], en: ["1 Samuel"] } },
  { slug: "2-samuel", number: 10, testament: "ot", names: { de: ["2. Samuel"], en: ["2 Samuel"] } },
  { slug: "1-kings", number: 11, testament: "ot", names: { de: ["1. Könige"], en: ["1 Kings"] } },
  { slug: "2-kings", number: 12, testament: "ot", names: { de: ["2. Könige"], en: ["2 Kings"] } },
  { slug: "1-chronicles", number: 13, testament: "ot", names: { de: ["1. Chronik", "1. Chronika"], en: ["1 Chronicles"] } },
  { slug: "2-chronicles", number: 14, testament: "ot", names: { de: ["2. Chronik", "2. Chronika"], en: ["2 Chronicles"] } },
  { slug: "ezra", number: 15, testament: "ot", names: { de: ["Esra"], en: ["Ezra"] } },
  { slug: "nehemiah", number: 16, testament: "ot", names: { de: ["Nehemia"], en: ["Nehemiah"] } },
  { slug: "esther", number: 17, testament: "ot", names: { de: ["Esther", "Ester"], en: ["Esther"] } },
  { slug: "job", number: 18, testament: "ot", names: { de: ["Hiob", "Ijob"], en: ["Job"] } },
  { slug: "psalms", number: 19, testament: "ot", names: { de: ["Psalm", "Psalmen"], en: ["Psalms", "Psalm"] } },
  { slug: "proverbs", number: 20, testament: "ot", names: { de: ["Sprüche"], en: ["Proverbs"] } },
  { slug: "ecclesiastes", number: 21, testament: "ot", names: { de: ["Prediger", "Kohelet"], en: ["Ecclesiastes"] } },
  { slug: "song-of-songs", number: 22, testament: "ot", names: { de: ["Hohelied"], en: ["Song of Solomon", "Song of Songs"] } },
  { slug: "isaiah", number: 23, testament: "ot", names: { de: ["Jesaja"], en: ["Isaiah"] } },
  { slug: "jeremiah", number: 24, testament: "ot", names: { de: ["Jeremia"], en: ["Jeremiah"] } },
  { slug: "lamentations", number: 25, testament: "ot", names: { de: ["Klagelieder"], en: ["Lamentations"] } },
  { slug: "ezekiel", number: 26, testament: "ot", names: { de: ["Hesekiel", "Ezechiel"], en: ["Ezekiel"] } },
  { slug: "daniel", number: 27, testament: "ot", names: { de: ["Daniel"], en: ["Daniel"] } },
  { slug: "hosea", number: 28, testament: "ot", names: { de: ["Hosea"], en: ["Hosea"] } },
  { slug: "joel", number: 29, testament: "ot", names: { de: ["Joel"], en: ["Joel"] } },
  { slug: "amos", number: 30, testament: "ot", names: { de: ["Amos"], en: ["Amos"] } },
  { slug: "obadiah", number: 31, testament: "ot", names: { de: ["Obadja"], en: ["Obadiah"] } },
  { slug: "jonah", number: 32, testament: "ot", names: { de: ["Jona"], en: ["Jonah"] } },
  { slug: "micah", number: 33, testament: "ot", names: { de: ["Micha"], en: ["Micah"] } },
  { slug: "nahum", number: 34, testament: "ot", names: { de: ["Nahum"], en: ["Nahum"] } },
  { slug: "habakkuk", number: 35, testament: "ot", names: { de: ["Habakuk"], en: ["Habakkuk"] } },
  { slug: "zephaniah", number: 36, testament: "ot", names: { de: ["Zephanja"], en: ["Zephaniah"] } },
  { slug: "haggai", number: 37, testament: "ot", names: { de: ["Haggai"], en: ["Haggai"] } },
  { slug: "zechariah", number: 38, testament: "ot", names: { de: ["Sacharja"], en: ["Zechariah"] } },
  { slug: "malachi", number: 39, testament: "ot", names: { de: ["Maleachi"], en: ["Malachi"] } },
  // NT
  { slug: "matthew", number: 40, testament: "nt", names: { de: ["Matthäus"], en: ["Matthew"] } },
  { slug: "mark", number: 41, testament: "nt", names: { de: ["Markus"], en: ["Mark"] } },
  { slug: "luke", number: 42, testament: "nt", names: { de: ["Lukas"], en: ["Luke"] } },
  { slug: "john", number: 43, testament: "nt", names: { de: ["Johannes"], en: ["John"] } },
  { slug: "acts", number: 44, testament: "nt", names: { de: ["Apostelgeschichte"], en: ["Acts"] } },
  { slug: "romans", number: 45, testament: "nt", names: { de: ["Römer"], en: ["Romans"] } },
  { slug: "1-corinthians", number: 46, testament: "nt", names: { de: ["1. Korinther"], en: ["1 Corinthians"] } },
  { slug: "2-corinthians", number: 47, testament: "nt", names: { de: ["2. Korinther"], en: ["2 Corinthians"] } },
  { slug: "galatians", number: 48, testament: "nt", names: { de: ["Galater"], en: ["Galatians"] } },
  { slug: "ephesians", number: 49, testament: "nt", names: { de: ["Epheser"], en: ["Ephesians"] } },
  { slug: "philippians", number: 50, testament: "nt", names: { de: ["Philipper"], en: ["Philippians"] } },
  { slug: "colossians", number: 51, testament: "nt", names: { de: ["Kolosser"], en: ["Colossians"] } },
  { slug: "1-thessalonians", number: 52, testament: "nt", names: { de: ["1. Thessalonicher"], en: ["1 Thessalonians"] } },
  { slug: "2-thessalonians", number: 53, testament: "nt", names: { de: ["2. Thessalonicher"], en: ["2 Thessalonians"] } },
  { slug: "1-timothy", number: 54, testament: "nt", names: { de: ["1. Timotheus"], en: ["1 Timothy"] } },
  { slug: "2-timothy", number: 55, testament: "nt", names: { de: ["2. Timotheus"], en: ["2 Timothy"] } },
  { slug: "titus", number: 56, testament: "nt", names: { de: ["Titus"], en: ["Titus"] } },
  { slug: "philemon", number: 57, testament: "nt", names: { de: ["Philemon"], en: ["Philemon"] } },
  { slug: "hebrews", number: 58, testament: "nt", names: { de: ["Hebräer"], en: ["Hebrews"] } },
  { slug: "james", number: 59, testament: "nt", names: { de: ["Jakobus"], en: ["James"] } },
  { slug: "1-peter", number: 60, testament: "nt", names: { de: ["1. Petrus"], en: ["1 Peter"] } },
  { slug: "2-peter", number: 61, testament: "nt", names: { de: ["2. Petrus"], en: ["2 Peter"] } },
  { slug: "1-john", number: 62, testament: "nt", names: { de: ["1. Johannes"], en: ["1 John"] } },
  { slug: "2-john", number: 63, testament: "nt", names: { de: ["2. Johannes"], en: ["2 John"] } },
  { slug: "3-john", number: 64, testament: "nt", names: { de: ["3. Johannes"], en: ["3 John"] } },
  { slug: "jude", number: 65, testament: "nt", names: { de: ["Judas"], en: ["Jude"] } },
  { slug: "revelation", number: 66, testament: "nt", names: { de: ["Offenbarung"], en: ["Revelation"] } },
];

const SLUG_INDEX = new Map(BOOKS.map((b) => [b.slug, b]));

/** Default translation per language (best-quality public-domain or licensed default). */
export const DEFAULT_TRANSLATION: Record<string, string> = {
  de: "schlachter2000", en: "bsb", fr: "lsg", es: "rv09", it: "riv",
  pl: "ubg", cs: "nkb", pt: "blj", nl: "nbg", ro: "corn",
  da: "det", no: "nob", sv: "fol", fi: "fin", el: "grk",
  hr: "iva", sr: "srp", hu: "hun", sk: "slk",
  ru: "syn", uk: "ukr96", ko: "krv", tl: "tgl", id: "ayt",
  vi: "vie", zh: "cuv", sw: "swa", am: "amh", af: "aov",
  yo: "yor", ig: "ibo", ar: "vd", he: "mod",
};

/**
 * Parse "/vers/john-3-16" → { bookSlug:"john", chapter:3, verse:16 }
 * Returns null if invalid format.
 */
export function parseVerseSlug(slug: string): { book: BookEntry; chapter: number; verse: number } | null {
  if (!slug) return null;
  // Match: <book-slug>-<chapter>-<verse>  where book-slug may contain hyphens
  const m = slug.toLowerCase().match(/^(.+?)-(\d+)-(\d+)$/);
  if (!m) return null;
  const [, bookSlug, ch, vs] = m;
  const book = SLUG_INDEX.get(bookSlug);
  if (!book) return null;
  const chapter = parseInt(ch, 10);
  const verse = parseInt(vs, 10);
  if (!chapter || !verse) return null;
  return { book, chapter, verse };
}

/** Build slug "john-3-16" */
export function buildVerseSlug(bookSlug: string, chapter: number, verse: number) {
  return `${bookSlug}-${chapter}-${verse}`;
}

/** Localized display name for a book in a given language (falls back to English). */
export function localizedBookName(book: BookEntry, lang: string): string {
  return book.names[lang]?.[0] ?? book.names.en[0];
}

/** Resolve all localized name variants for DB lookup in a given language. */
export function bookNameVariants(book: BookEntry, lang: string): string[] {
  const variants = new Set<string>();
  (book.names[lang] || []).forEach((n) => variants.add(n));
  (book.names.en || []).forEach((n) => variants.add(n));
  return Array.from(variants);
}

export function bookBySlug(slug: string): BookEntry | undefined {
  return SLUG_INDEX.get(slug);
}

/** Top 50 most-referenced verses for SEO seeding. */
export const TOP_VERSES: Array<[string, number, number]> = [
  ["john", 3, 16], ["john", 14, 6], ["john", 1, 1], ["john", 8, 32], ["john", 11, 25],
  ["romans", 8, 28], ["romans", 8, 38], ["romans", 12, 2], ["romans", 5, 8], ["romans", 6, 23],
  ["psalms", 23, 1], ["psalms", 23, 4], ["psalms", 46, 10], ["psalms", 119, 105], ["psalms", 91, 1],
  ["psalms", 27, 1], ["psalms", 37, 4], ["psalms", 139, 14],
  ["philippians", 4, 13], ["philippians", 4, 6], ["philippians", 4, 7], ["philippians", 4, 8],
  ["proverbs", 3, 5], ["proverbs", 3, 6], ["proverbs", 16, 3], ["proverbs", 22, 6],
  ["matthew", 6, 33], ["matthew", 11, 28], ["matthew", 28, 19], ["matthew", 5, 16], ["matthew", 7, 7],
  ["jeremiah", 29, 11], ["jeremiah", 1, 5],
  ["isaiah", 40, 31], ["isaiah", 41, 10], ["isaiah", 53, 5],
  ["1-corinthians", 13, 4], ["1-corinthians", 13, 13], ["1-corinthians", 10, 13],
  ["galatians", 5, 22], ["galatians", 2, 20],
  ["ephesians", 2, 8], ["ephesians", 6, 10],
  ["hebrews", 11, 1], ["hebrews", 12, 2],
  ["joshua", 1, 9],
  ["james", 1, 2],
  ["1-john", 4, 8], ["1-john", 1, 9],
  ["revelation", 21, 4],
];

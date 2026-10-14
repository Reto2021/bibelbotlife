import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pl from "./locales/pl.json";
import cs from "./locales/cs.json";
import pt from "./locales/pt.json";
import nl from "./locales/nl.json";
import ro from "./locales/ro.json";
import da from "./locales/da.json";
import no from "./locales/no.json";
import sv from "./locales/sv.json";
import fi from "./locales/fi.json";
import el from "./locales/el.json";
import hr from "./locales/hr.json";
import sr from "./locales/sr.json";
import hu from "./locales/hu.json";
import sk from "./locales/sk.json";
import bg from "./locales/bg.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import ka from "./locales/ka.json";
import hy from "./locales/hy.json";
import ko from "./locales/ko.json";
import tl from "./locales/tl.json";
import id from "./locales/id.json";
import vi from "./locales/vi.json";
import zh from "./locales/zh.json";
import sw from "./locales/sw.json";
import am from "./locales/am.json";
import af from "./locales/af.json";
import yo from "./locales/yo.json";
import ig from "./locales/ig.json";
import zu from "./locales/zu.json";
import ht from "./locales/ht.json";
import ar from "./locales/ar.json";
import he from "./locales/he.json";

export const supportedLngs = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // The root route switches to the per-request language (cookie / Accept-Language) before
    // rendering, so server HTML and the first client render always use the same language.
    lng: "de",
    resources: {
      de: { translation: de }, en: { translation: en }, fr: { translation: fr },
      es: { translation: es }, it: { translation: it }, pl: { translation: pl },
      cs: { translation: cs }, pt: { translation: pt }, nl: { translation: nl },
      ro: { translation: ro }, da: { translation: da }, no: { translation: no },
      sv: { translation: sv }, fi: { translation: fi }, el: { translation: el },
      hr: { translation: hr }, sr: { translation: sr }, hu: { translation: hu },
      sk: { translation: sk }, bg: { translation: bg }, ru: { translation: ru },
      uk: { translation: uk }, ka: { translation: ka }, hy: { translation: hy },
      ko: { translation: ko }, tl: { translation: tl }, id: { translation: id },
      vi: { translation: vi }, zh: { translation: zh }, sw: { translation: sw },
      am: { translation: am }, af: { translation: af }, yo: { translation: yo },
      ig: { translation: ig }, zu: { translation: zu }, ht: { translation: ht },
      ar: { translation: ar },
      he: { translation: he },
    },
    fallbackLng: (code: string) => {
      if (!code || code === "de") return ["de"];
      return ["en", "de"];
    },
    supportedLngs,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      // Cached manually after hydration (see applyDetectedLanguage) so the initial "de" never overwrites a saved choice.
      caches: [],
      lookupLocalStorage: "biblebot-lang",
    },
  });

export const LANG_COOKIE = "biblebot-lang";
export const LANG_STORAGE_KEY = "biblebot-lang";

/** Picks the first supported language from a list of candidates (e.g. "en-US" → "en"); defaults to German. */
export function resolveLanguage(candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    if (!c) continue;
    const base = c.trim().toLowerCase().split(/[-_]/)[0] ?? "";
    if ((supportedLngs as readonly string[]).includes(base)) return base;
  }
  return "de";
}

let persistListenerAttached = false;

/** Remembers language changes in localStorage and a cookie (so the server renders in the same language). Client-only. */
export function persistLanguageChanges() {
  if (typeof window === "undefined" || persistListenerAttached) return;
  persistListenerAttached = true;
  i18n.on("languageChanged", (next) => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — ignore
    }
    document.cookie = `${LANG_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
  });
}

export default i18n;

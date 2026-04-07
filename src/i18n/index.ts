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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      it: { translation: it },
      pl: { translation: pl },
      cs: { translation: cs },
      pt: { translation: pt },
    },
    fallbackLng: "de",
    supportedLngs: ["de", "en", "fr", "es", "it", "pl", "cs", "pt"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "bibelbot-lang",
    },
  });

export default i18n;

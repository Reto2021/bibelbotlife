import { Helmet } from "react-helmet-async";

const SITE = "https://biblebot.life";

const SUPPORTED_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

interface Props {
  /** Path without trailing slash, e.g. "/vers/johannes-3-16". Empty for home. */
  path?: string;
}

/**
 * Emits hreflang link tags for every supported language plus x-default.
 * Uses ?lng= query param convention used by i18next-browser-languagedetector.
 */
export const HreflangTags = ({ path = "" }: Props) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = path === "" ? SITE : `${SITE}${cleanPath}`;

  return (
    <Helmet>
      {SUPPORTED_LANGS.map((lng) => (
        <link
          key={lng}
          rel="alternate"
          hrefLang={lng}
          href={`${base}${base.includes("?") ? "&" : "?"}lng=${lng}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={base} />
    </Helmet>
  );
};

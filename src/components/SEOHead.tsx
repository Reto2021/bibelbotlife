import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOHeadProps {
  titleKey?: string;
  descKey?: string;
  title?: string;
  description?: string;
  path?: string;
}

const OG_IMAGE_LANGS = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "ru", "ko", "zh"];

export const SEOHead = ({ titleKey, descKey, title, description, path = "" }: SEOHeadProps) => {
  const { t, i18n } = useTranslation();
  const resolvedTitle = title || (titleKey ? t(titleKey) : undefined);
  const resolvedDesc = description || (descKey ? t(descKey) : undefined);
  const canonical = `https://biblebot.life${path}`;

  const lang = i18n.language?.split("-")[0] || "de";
  const ogLang = OG_IMAGE_LANGS.includes(lang) ? lang : "en";
  const ogImage = `https://biblebot.life/og-image-${ogLang}.png`;

  return (
    <Helmet>
      {resolvedTitle && <title>{resolvedTitle}</title>}
      {resolvedDesc && <meta name="description" content={resolvedDesc} />}
      <link rel="canonical" href={canonical} />
      <html lang={i18n.language || "de"} />
      {resolvedTitle && <meta property="og:title" content={resolvedTitle} />}
      {resolvedDesc && <meta property="og:description" content={resolvedDesc} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {resolvedTitle && <meta name="twitter:title" content={resolvedTitle} />}
      {resolvedDesc && <meta name="twitter:description" content={resolvedDesc} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
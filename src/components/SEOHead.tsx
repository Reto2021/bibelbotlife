import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { HreflangTags } from "./seo/HreflangTags";

interface SEOHeadProps {
  titleKey?: string;
  descKey?: string;
  title?: string;
  description?: string;
  path?: string;
  /** Override canonical URL completely (e.g. for verse/topic pages). */
  canonicalUrl?: string;
  /** Override OG image. */
  image?: string;
  /** Set <meta name="robots">. Defaults to "index,follow". */
  robots?: string;
  /** Whether to emit hreflang tags. Default: true. */
  withHreflang?: boolean;
}

const SITE = "https://biblebot.life";
const OG_IMAGE_LANGS = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "ru", "ko", "zh"];

export const SEOHead = ({
  titleKey,
  descKey,
  title,
  description,
  path = "",
  canonicalUrl,
  image,
  robots = "index,follow,max-image-preview:large",
  withHreflang = true,
}: SEOHeadProps) => {
  const { t, i18n } = useTranslation();
  const resolvedTitle = title || (titleKey ? t(titleKey) : undefined);
  const resolvedDesc = description || (descKey ? t(descKey) : undefined);
  const canonical = canonicalUrl || `${SITE}${path}`;

  const lang = i18n.language?.split("-")[0] || "de";
  const ogLang = OG_IMAGE_LANGS.includes(lang) ? lang : "en";
  const ogImage = image || `${SITE}/og-image-${ogLang}.png`;

  return (
    <>
      <Helmet>
        {resolvedTitle && <title>{resolvedTitle}</title>}
        {resolvedDesc && <meta name="description" content={resolvedDesc} />}
        <meta name="robots" content={robots} />
        <link rel="canonical" href={canonical} />
        <html lang={i18n.language || "de"} />
        {resolvedTitle && <meta property="og:title" content={resolvedTitle} />}
        {resolvedDesc && <meta property="og:description" content={resolvedDesc} />}
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {resolvedTitle && <meta name="twitter:title" content={resolvedTitle} />}
        {resolvedDesc && <meta name="twitter:description" content={resolvedDesc} />}
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      {withHreflang && <HreflangTags path={path} />}
    </>
  );
};

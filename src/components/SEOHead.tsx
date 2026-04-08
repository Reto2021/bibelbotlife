import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOHeadProps {
  titleKey?: string;
  descKey?: string;
  title?: string;
  description?: string;
  path?: string;
}

export const SEOHead = ({ titleKey, descKey, title, description, path = "" }: SEOHeadProps) => {
  const { t, i18n } = useTranslation();
  const resolvedTitle = title || (titleKey ? t(titleKey) : undefined);
  const resolvedDesc = description || (descKey ? t(descKey) : undefined);
  const canonical = `https://bibelbot.ch${path}`;

  return (
    <Helmet>
      {resolvedTitle && <title>{resolvedTitle}</title>}
      {resolvedDesc && <meta name="description" content={resolvedDesc} />}
      <link rel="canonical" href={canonical} />
      <html lang={i18n.language || "de"} />
    </Helmet>
  );
};

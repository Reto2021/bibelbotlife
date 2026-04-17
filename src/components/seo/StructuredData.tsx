import { Helmet } from "react-helmet-async";

interface Props {
  data: Record<string, any> | Record<string, any>[];
}

/**
 * Renders a JSON-LD <script> for structured data.
 * Pass a single Schema.org object or an array (rendered as @graph).
 */
export const StructuredData = ({ data }: Props) => {
  const json = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : { "@context": "https://schema.org", ...data };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(json)}</script>
    </Helmet>
  );
};

// Helper builders --------------------------------------------------

export const buildBreadcrumb = (
  items: { name: string; url: string }[]
) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.url,
  })),
});

export const buildFAQ = (faqs: { question: string; answer: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

export const buildArticle = (opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  inLanguage?: string;
}) => ({
  "@type": "Article",
  headline: opts.headline,
  description: opts.description,
  url: opts.url,
  image: opts.image || "https://biblebot.life/og-image-de.png",
  datePublished: opts.datePublished,
  dateModified: opts.dateModified || opts.datePublished,
  inLanguage: opts.inLanguage || "de",
  author: { "@type": "Organization", name: "BibleBot.Life" },
  publisher: {
    "@type": "Organization",
    name: "BibleBot.Life",
    logo: {
      "@type": "ImageObject",
      url: "https://biblebot.life/favicon-192.png",
    },
  },
});

export const buildQuotation = (opts: {
  text: string;
  reference: string;
  language?: string;
}) => ({
  "@type": "Quotation",
  text: opts.text,
  spokenByCharacter: opts.reference,
  inLanguage: opts.language || "de",
});

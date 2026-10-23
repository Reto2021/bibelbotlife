import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import {
  StructuredData,
  buildArticle,
  buildBreadcrumb,
  buildQuotation,
} from "@/components/seo/StructuredData";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  parseVerseSlug,
  bookNameVariants,
  localizedBookName,
  DEFAULT_TRANSLATION,
  buildVerseSlug,
  TOP_VERSES,
  bookBySlug,
} from "@/lib/bible-slugs";
import { BookOpen, MessageCircle, Share2, Sparkles, Feather, HelpCircle, HandHeart, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getVerseMeaning, type KeyWord } from "@/lib/verse-meaning.functions";

interface VerseRow {
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

interface SeoRow {
  title: string | null;
  meta_description: string | null;
  context: string | null;
  reflection: string | null;
  related_references: string[] | null;
  related_topics: string[] | null;
  summary?: string | null;
  key_words?: KeyWord[] | null;
  life_questions?: string[] | null;
  prayer?: string | null;
}

const SITE = "https://biblebot.life";

export default function VersePage() {
  const { reference } = useParams<{ reference: string }>();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const parsed = useMemo(() => (reference ? parseVerseSlug(reference) : null), [reference]);
  const lang = (i18n.language?.split("-")[0] || "de");

  const [verses, setVerses] = useState<VerseRow[]>([]);
  const [seo, setSeo] = useState<SeoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deepening, setDeepening] = useState(false);
  const fetchMeaning = useServerFn(getVerseMeaning);

  useEffect(() => {
    if (!parsed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Lookup by book_number (works for all 33 languages, regardless of name spelling)
      const { data: vData } = await supabase
        .from("bible_verses")
        .select("text,translation,book,chapter,verse,language")
        .eq("book_number", parsed.book.number)
        .eq("chapter", parsed.chapter)
        .eq("verse", parsed.verse)
        .limit(50);

      // Prefer current language; fall back to English, then German, then anything
      let chosen: VerseRow[] = (vData ?? []).filter((r: any) => r.language === lang);
      if (chosen.length === 0) chosen = (vData ?? []).filter((r: any) => r.language === "en");
      if (chosen.length === 0) chosen = (vData ?? []).filter((r: any) => r.language === "de");
      if (chosen.length === 0) chosen = (vData ?? []) as VerseRow[];

      // Sort: default translation first
      const def = DEFAULT_TRANSLATION[lang];
      chosen.sort((a, b) => (a.translation === def ? -1 : b.translation === def ? 1 : 0));

      const slug = buildVerseSlug(parsed.book.slug, parsed.chapter, parsed.verse);
      const { data: seoData } = await supabase
        .from("verse_seo_content")
        .select("title,meta_description,context,reflection,related_references,related_topics,summary,key_words,life_questions,prayer,view_count")
        .eq("reference_slug", slug)
        .eq("language", lang)
        .maybeSingle();

      // Increment view counter (fire-and-forget) — only if SEO row exists
      if (seoData) {
        supabase
          .from("verse_seo_content")
          .update({ view_count: (seoData as any).view_count ? (seoData as any).view_count + 1 : 1 })
          .eq("reference_slug", slug)
          .eq("language", lang)
          .then(() => {});
      }

      if (cancelled) return;
      setVerses(chosen);
      setSeo((seoData as SeoRow) || null);
      setLoading(false);

      // Generate the detailed meaning once, then it is cached for everyone
      if (!(seoData as any)?.summary && chosen.length > 0) {
        setDeepening(true);
        try {
          const res = await fetchMeaning({
            data: {
              slug,
              lang: /^[a-z]{2}$/.test(lang) ? lang : "de",
              book_number: parsed.book.number,
              chapter: parsed.chapter,
              verse: parsed.verse,
              reference: `${chosen[0]!.book} ${parsed.chapter},${parsed.verse}`,
              text: chosen[0]!.text.slice(0, 1200),
            },
          });
          if (!cancelled && res.meaning) setSeo(res.meaning as SeoRow);
        } catch (e) {
          console.error("verse meaning", e);
        } finally {
          if (!cancelled) setDeepening(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parsed, lang]);

  if (!parsed) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">{t("verse.notFound", "Vers nicht gefunden")}</h1>
          <Button onClick={() => navigate("/")}>{t("nav.startNow")}</Button>
        </main>
      </div>
    );
  }

  const localizedBook = verses[0]?.book || localizedBookName(parsed.book, lang);
  const referenceLabel = `${localizedBook} ${parsed.chapter},${parsed.verse}`;
  const primaryText = verses[0]?.text || "";
  const slug = buildVerseSlug(parsed.book.slug, parsed.chapter, parsed.verse);
  const path = `/vers/${slug}`;
  const url = `${SITE}${path}`;

  const isGermanPsalm23 = lang === "de" && parsed.book.number === 19 && parsed.chapter === 23;
  const title = isGermanPsalm23
    ? `Psalm 23,${parsed.verse}: Bedeutung & Erklärung | BibleBot.Life`
    :
    seo?.title ||
    `${referenceLabel} – ${t("verse.titleSuffix", "Bedeutung, Kontext & Reflexion")}`;
  const description = isGermanPsalm23
    ? `Psalm 23 Bedeutung: Entdecke Vers ${parsed.verse} im Kontext des Hirtenpsalms, vergleiche Bibelübersetzungen und stelle deine Fragen im kostenlosen Bibel-Chat.`
    :
    seo?.meta_description ||
    (primaryText
      ? `${primaryText.slice(0, 140)}… – ${t("verse.descSuffix", "Bedeutung, Kontext und persönliche Reflexion zu")} ${referenceLabel}.`
      : `${t("verse.descFallback", "Entdecke")} ${referenceLabel} – ${t("verse.descSuffix2", "Bedeutung, Kontext und persönliche Reflexion.")}`);

  const structured = primaryText
    ? [
        buildArticle({
          headline: title,
          description,
          url,
          inLanguage: lang,
        }),
        buildQuotation({ text: primaryText, reference: referenceLabel, language: lang }),
        buildBreadcrumb([
          { name: "BibleBot.Life", url: SITE },
          { name: t("nav.bibleSearch", "Bibel"), url: `${SITE}/bibel` },
          { name: referenceLabel, url },
        ]),
      ]
    : [];

  const handleAskBot = () => {
    const prompt = `${t("verse.chatPrompt", "Erkläre mir")} ${referenceLabel}: ${t(
      "verse.chatPromptDetail",
      "Was bedeutet dieser Vers, in welchem Kontext steht er, und was kann ich daraus für mein Leben mitnehmen?"
    )}`;
    sessionStorage.setItem("biblebot-chat-seed", prompt);
    navigate("/?chat=open");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={description}
        path={path}
        canonicalUrl={url}
        type="article"
      />
      {structured.length > 0 && <StructuredData data={structured} />}
      <SiteHeader />

      <main className="container mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">BibleBot.Life</Link>
          <span className="mx-2">/</span>
          <Link to="/bibel" className="hover:text-foreground">{t("nav.bibleSearch", "Bibel")}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{referenceLabel}</span>
        </nav>

        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{referenceLabel}</h1>
          {seo?.title && <p className="text-lg text-muted-foreground">{seo.title}</p>}
        </header>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : verses.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground">{t("verse.noText", "Verstext für diese Sprache noch nicht verfügbar.")}</p>
          </Card>
        ) : (
          <>
            {/* Primary verse card */}
            <Card className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20 shadow-lg">
              <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <blockquote className="relative text-2xl md:text-3xl leading-relaxed font-serif italic text-foreground">
                «{verses[0]!.text}»
              </blockquote>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">{referenceLabel}</span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs uppercase tracking-wide">
                  {verses[0]!.translation}
                </span>
              </div>
            </Card>

            {/* Translation comparison */}
            {verses.length > 1 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("verse.translations", "Weitere Übersetzungen")}</h2>
                <div className="space-y-3">
                  {verses.slice(1).map((v) => (
                    <Card key={v.translation} className="p-4">
                      <p className="text-base leading-relaxed text-foreground">«{v.text}»</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {v.translation}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Core message */}
            {seo?.summary && (
              <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-4 w-4" /> {t("verse.coreMessage", "Die Kernbotschaft")}
                </p>
                <p className="mt-3 text-lg md:text-xl font-serif leading-relaxed text-foreground">{seo.summary}</p>
              </section>
            )}
            {deepening && !seo?.summary && (
              <div className="flex items-center gap-3 rounded-3xl border border-dashed border-primary/30 p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                {t("verse.deepening", "Wir bereiten die ausführliche Bedeutung dieses Verses vor …")}
              </div>
            )}

            {/* Context */}
            {seo?.context && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("verse.context", "Kontext")}</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{seo.context}</p>
                </div>
              </section>
            )}

            {/* Reflection */}
            {seo?.reflection && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("verse.reflection", "Was bedeutet das für mich?")}</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{seo.reflection}</p>
                </div>
              </section>
            )}

            {/* Key words */}
            {seo?.key_words && seo.key_words.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><Feather className="h-5 w-5 text-primary" />{t("verse.keyWords", "Schlüsselwörter")}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {seo.key_words.map((k, i) => (
                    <Card key={i} className="rounded-2xl p-5">
                      <p className="font-serif text-lg text-foreground">{k.word}</p>
                      {k.original && <p className="text-xs uppercase tracking-wide text-primary mt-0.5">{k.original}</p>}
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{k.meaning}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Life questions */}
            {seo?.life_questions && seo.life_questions.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><HelpCircle className="h-5 w-5 text-primary" />{t("verse.lifeQuestions", "Fragen für deinen Weg")}</h2>
                <ul className="space-y-2">
                  {seo.life_questions.map((q, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => { sessionStorage.setItem("biblebot-chat-seed", `${referenceLabel}: ${q}`); navigate("/?chat=open"); }}
                        className="w-full text-left rounded-2xl border border-border bg-card px-5 py-4 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Prayer */}
            {seo?.prayer && (
              <section className="rounded-3xl bg-secondary/10 border border-secondary/20 p-6 md:p-8 text-center">
                <HandHeart className="mx-auto h-6 w-6 text-secondary" />
                <h2 className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("verse.prayer", "Ein Gebet dazu")}</h2>
                <p className="mt-3 font-serif italic text-lg leading-relaxed text-foreground">{seo.prayer}</p>
              </section>
            )}

            {/* Dual CTA */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <h2 className="text-xl font-semibold mb-2">
                {t("verse.ctaTitle", "Möchtest du tiefer eintauchen?")}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t(
                  "verse.ctaSubtitle",
                  "Stelle deine eigenen Fragen zu diesem Vers oder entdecke verwandte Stellen."
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAskBot} size="lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("verse.askBot", "Frage stellen")}
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/bibel">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t("verse.searchMore", "Weitere Verse entdecken")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    if (navigator.share) navigator.share({ title: referenceLabel, text: primaryText, url });
                    else navigator.clipboard.writeText(url);
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("verse.share", "Teilen")}
                </Button>
              </div>
            </Card>

            {/* Related verses */}
            {seo?.related_references && seo.related_references.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("verse.related", "Verwandte Stellen")}</h2>
                <div className="flex flex-wrap gap-2">
                  {seo.related_references.map((ref) => (
                    <Link
                      key={ref}
                      to={`/vers/${ref}`}
                      className="px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors text-sm"
                    >
                      {ref.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related topics */}
            {seo?.related_topics && seo.related_topics.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("verse.topics", "Themen")}</h2>
                <div className="flex flex-wrap gap-2">
                  {seo.related_topics.map((slug) => (
                    <Link
                      key={slug}
                      to={`/themen/${slug}`}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                    >
                      {slug.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Discover more verses */}
        <section className="space-y-3 pt-8 border-t">
          <h2 className="text-xl font-semibold">{t("verse.popular", "Beliebte Bibelstellen")}</h2>
          <div className="flex flex-wrap gap-2">
            {TOP_VERSES.slice(0, 12).map(([bs, ch, vs]) => {
              const b = bookBySlug(bs)!;
              return (
                <Link
                  key={`${bs}-${ch}-${vs}`}
                  to={`/vers/${buildVerseSlug(bs, ch, vs)}`}
                  className="px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors text-sm"
                >
                  {localizedBookName(b, lang)} {ch},{vs}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

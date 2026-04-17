import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import {
  StructuredData,
  buildArticle,
  buildBreadcrumb,
  buildFAQ,
} from "@/components/seo/StructuredData";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, BookOpen } from "lucide-react";
import { parseVerseSlug, localizedBookName, buildVerseSlug } from "@/lib/bible-slugs";

interface TopicRow {
  slug: string;
  language: string;
  title: string;
  meta_description: string | null;
  intro: string | null;
  body_md: string | null;
  related_verses: string[] | null;
  faqs: Array<{ question: string; answer: string }> | null;
}

const SITE = "https://biblebot.life";

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language?.split("-")[0] || "de");

  const [topic, setTopic] = useState<TopicRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Try requested language, fall back to English, then German
      const langs = Array.from(new Set([lang, "en", "de"]));
      for (const l of langs) {
        const { data } = await supabase
          .from("seo_topics")
          .select("slug,language,title,meta_description,intro,body_md,related_verses,faqs")
          .eq("slug", slug)
          .eq("language", l)
          .eq("is_published", true)
          .maybeSingle();
        if (data && !cancelled) {
          setTopic(data as unknown as TopicRow);
          setLoading(false);
          return;
        }
      }
      if (!cancelled) {
        setTopic(null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  if (!slug) return null;
  const path = `/themen/${slug}`;
  const url = `${SITE}${path}`;

  const title = topic?.title || slug.replace(/-/g, " ");
  const description =
    topic?.meta_description ||
    topic?.intro?.slice(0, 160) ||
    `${title} – ${t("topic.descFallback", "Was die Bibel dazu sagt, mit Versen, Reflexion und Gespräch.")}`;

  const structured: any[] = topic
    ? [
        buildArticle({
          headline: title,
          description,
          url,
          inLanguage: topic.language,
        }),
        buildBreadcrumb([
          { name: "BibleBot.Life", url: SITE },
          { name: t("topic.crumb", "Themen"), url: `${SITE}/themen` },
          { name: title, url },
        ]),
      ]
    : [];
  if (topic?.faqs && topic.faqs.length > 0) {
    structured.push(buildFAQ(topic.faqs));
  }

  const handleAskBot = () => {
    const prompt = `${t("topic.chatPrompt", "Was sagt die Bibel über")} ${title}? ${t(
      "topic.chatPromptDetail",
      "Gib mir wichtige Verse und einen praktischen Impuls für meinen Alltag."
    )}`;
    sessionStorage.setItem("biblebot-chat-seed", prompt);
    navigate("/?chat=open");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={description} path={path} canonicalUrl={url} />
      {structured.length > 0 && <StructuredData data={structured} />}
      <SiteHeader />

      <main className="container mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">BibleBot.Life</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          {topic?.intro && <p className="text-lg text-muted-foreground leading-relaxed">{topic.intro}</p>}
        </header>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !topic ? (
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              {t("topic.notFound", "Dieses Thema wird gerade vorbereitet.")}
            </p>
            <Button onClick={handleAskBot}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("topic.askInstead", "Frage direkt stellen")}
            </Button>
          </Card>
        ) : (
          <>
            {topic.body_md && (
              <article className="prose prose-neutral dark:prose-invert max-w-none">
                {topic.body_md.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="text-foreground/90 leading-relaxed">
                    {para}
                  </p>
                ))}
              </article>
            )}

            {/* Related verses */}
            {topic.related_verses && topic.related_verses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("topic.keyVerses", "Wichtige Bibelstellen")}</h2>
                <div className="grid gap-3">
                  {topic.related_verses.slice(0, 8).map((ref) => {
                    const parsed = parseVerseSlug(ref);
                    const label = parsed
                      ? `${localizedBookName(parsed.book, lang)} ${parsed.chapter},${parsed.verse}`
                      : ref.replace(/-/g, " ");
                    return (
                      <Link
                        key={ref}
                        to={`/vers/${ref}`}
                        className="block p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                      >
                        <span className="font-medium">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Dual CTA */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <h2 className="text-xl font-semibold mb-2">
                {t("topic.ctaTitle", "Sprich darüber mit deinem Begleiter")}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t(
                  "topic.ctaSubtitle",
                  "Stelle deine eigenen Fragen oder lass dich durch einen Tagesimpuls inspirieren."
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAskBot} size="lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("topic.askBot", "Frage stellen")}
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/bibel">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t("topic.searchVerses", "Verse suchen")}
                  </Link>
                </Button>
              </div>
            </Card>

            {/* FAQs */}
            {topic.faqs && topic.faqs.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("topic.faqs", "Häufige Fragen")}</h2>
                <div className="space-y-3">
                  {topic.faqs.map((f, i) => (
                    <Card key={i} className="p-4">
                      <h3 className="font-semibold mb-2">{f.question}</h3>
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{f.answer}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

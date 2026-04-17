import { useEffect, useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useTrack } from "@/components/AnalyticsProvider";
import { generateShareImage } from "@/lib/share-image-canvas";
import { ShareButton } from "@/components/ShareButton";

interface VerseShareCardProps {
  verse: string;
  reference: string;
  translation?: string;
}

export function VerseShareCard({ verse, reference, translation }: VerseShareCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { track } = useTrack();
  const [sharing, setSharing] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  useEffect(() => {
    track("verse_card_shown", { reference });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const deepLink = `https://biblebot.life/?v=${encodeURIComponent(reference)}&ref=share`;
  const shareText = `«${verse}»\n— ${reference}\n\n${t("verseCard.discoverMore", "Entdecke mehr")}: ${deepLink}`;

  const handleShare = async () => {
    track("verse_share_click", { reference, platform: "native" });
    setSharing(true);
    try {
      const blob = await generateShareImage({ verse, reference });
      const file = new File([blob], "biblebot-verse.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: "BibleBot.Life",
            text: shareText,
            files: [file],
          });
          track("verse_share_complete", { reference });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      // Fallback: open ShareButton popover
      setFallbackOpen(true);
    } catch (e) {
      console.error("Verse share failed", e);
      toast({ title: t("share.error", "Teilen fehlgeschlagen"), variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border-l-4 border-primary/30 bg-primary/5 p-4">
      <p className="italic text-sm leading-relaxed text-foreground/90">
        «{verse}»
      </p>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        — {reference}
      </p>
      {translation && (
        <p className="text-xs text-muted-foreground/60">{translation}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleShare}
          disabled={sharing}
          className="text-xs min-h-[44px] -ml-2 text-primary hover:bg-primary/10 hover:text-primary"
        >
          {sharing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          {t("verseCard.shareVerse", "Vers teilen")}
        </Button>
        {/* Hidden fallback ShareButton — programmatically opened when native share unavailable */}
        {fallbackOpen && (
          <ShareButton
            title={reference}
            text={`«${verse}»`}
            url={deepLink}
            utmSource="verse_card"
            variant="button"
            className="text-xs"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Extract the first quoted Bible verse + reference from a text block.
 * Pattern: «...» or "..." followed by a Bible reference within ~80 chars.
 */
const BIBLE_REF_RE = /(\d\.\s?)?(?:Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Ps|Spr|Jes|Jer)\s+\d+(?:[,:]\d+(?:[\-–]\d+)?)?/;

export function extractMainVerse(text: string): { verse: string; reference: string } | null {
  if (!text) return null;
  // Match «...» or "..." quotes (curly or straight)
  const quoteRe = /[«"„"]([^«»"„"]{15,400})[»""]/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRe.exec(text)) !== null) {
    const verse = match[1].trim();
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 80);
    const refMatch = after.match(BIBLE_REF_RE);
    if (refMatch) {
      return { verse, reference: refMatch[0].trim() };
    }
    // Also check if reference appears just before the quote
    const before = text.slice(Math.max(0, match.index - 80), match.index);
    const refBefore = before.match(new RegExp(BIBLE_REF_RE.source + "[^a-zA-Z]*$"));
    if (refBefore) {
      return { verse, reference: refBefore[0].replace(/[^a-zA-Z0-9äöüÄÖÜß,.\-– ]+$/, "").trim() };
    }
  }
  return null;
}

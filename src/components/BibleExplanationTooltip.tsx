import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  keyword: string;
  explanation: string;
  children: React.ReactNode;
}

/**
 * Zeigt eine sinngemäss umformulierte Bibel-Erklärung als Tooltip
 * (Hover auf Desktop, Tap auf Mobile).
 */
export function BibleExplanationTooltip({ keyword, explanation, children }: Props) {
  const isMobile = useIsMobile();

  const triggerEl = (
    <span
      className="cursor-help underline decoration-dotted decoration-primary/50 underline-offset-2 hover:decoration-primary"
      aria-label={`Erklärung zu ${keyword}`}
    >
      {children}
    </span>
  );

  const content = (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary">
        {keyword}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{explanation}</p>
      <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/50">
        Erklärung sinngemäss.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{triggerEl}</PopoverTrigger>
        <PopoverContent className="w-72" side="top">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{triggerEl}</HoverCardTrigger>
      <HoverCardContent className="w-72" side="top">
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Nimmt einen string und wandelt vorkommende Schlüsselwörter in Tooltip-Spans um.
 * Markiert nur das erste Vorkommen pro Keyword (case-insensitive, Wortgrenze).
 */
export function wrapKeywordsInText(
  text: string,
  matches: { keyword: string; explanation: string }[],
): React.ReactNode {
  if (!matches.length) return text;

  // Sort by length desc to match longest first
  const sorted = [...matches].sort((a, b) => b.keyword.length - a.keyword.length);
  const used = new Set<string>();
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let segments: Array<React.ReactNode> = [text];

  for (const m of sorted) {
    const keyLower = m.keyword.toLowerCase();
    if (used.has(keyLower)) continue;
    const re = new RegExp(`\\b(${escapeRe(m.keyword)})\\b`, "i");
    const next: React.ReactNode[] = [];
    let replaced = false;

    for (const seg of segments) {
      if (replaced || typeof seg !== "string") {
        next.push(seg);
        continue;
      }
      const match = seg.match(re);
      if (!match || match.index === undefined) {
        next.push(seg);
        continue;
      }
      next.push(seg.slice(0, match.index));
      next.push(
        <BibleExplanationTooltip
          key={`${m.keyword}-${match.index}`}
          keyword={m.keyword}
          explanation={m.explanation}
        >
          {match[0]}
        </BibleExplanationTooltip>,
      );
      next.push(seg.slice(match.index + match[0].length));
      replaced = true;
      used.add(keyLower);
    }
    segments = next;
  }

  return <>{segments.map((s, i) => <React.Fragment key={i}>{s}</React.Fragment>)}</>;
}

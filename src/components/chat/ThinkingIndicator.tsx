import { useEffect, useState } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";

interface ThinkingIndicatorProps {
  t: (key: string, fallback?: any) => string;
}

/**
 * Zeigt während längerer Antworten wechselnde Zwischenschritte,
 * damit die Wartezeit nachvollziehbar wirkt.
 */
export function ThinkingIndicator({ t }: ThinkingIndicatorProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phases = [
    t("chat.thinking", "Ich denke nach ..."),
    t("chat.thinkingBible", "Ich schaue in der Bibel nach ..."),
    t("chat.thinkingVerses", "Ich prüfe die Verse ..."),
    t("chat.thinkingWords", "Ich suche die passenden Worte ..."),
  ];
  const label = phases[Math.min(Math.floor(seconds / 4), phases.length - 1)];

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
        <Shimmer className="text-sm">{label}</Shimmer>
        {seconds >= 8 && (
          <span className="text-xs text-muted-foreground tabular-nums">{seconds}s</span>
        )}
      </div>
    </div>
  );
}

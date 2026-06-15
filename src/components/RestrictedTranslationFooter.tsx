import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  translation: string;
  className?: string;
}

/**
 * Renders a copyright/citation footer for restricted Bible translations
 * (e.g. NIV ©Biblica). Required by license when displaying verses.
 */
export function RestrictedTranslationFooter({ translation, className }: Props) {
  const [citation, setCitation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("bible_translation_meta")
        .select("citation, is_restricted")
        .eq("code", translation)
        .maybeSingle();
      if (!cancelled && data?.is_restricted) {
        setCitation(data.citation);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [translation]);

  if (!citation) return null;

  return (
    <p className={`text-xs text-muted-foreground italic mt-2 ${className ?? ""}`}>
      {citation}
    </p>
  );
}

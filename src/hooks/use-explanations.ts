import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExplanationMatch = {
  keyword: string;
  explanation: string;
  book: string;
  chapter: number;
  verse: number;
};

/**
 * Findet alle Bibel-Erklärungs-Schlüsselwörter, die im gegebenen Text vorkommen.
 * Ergebnis wird gecached (24h).
 */
export function useExplanationsInText(text: string | undefined, lang = "de") {
  return useQuery({
    queryKey: ["explanations-in-text", lang, text?.slice(0, 200) ?? ""],
    enabled: !!text && text.length > 20,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: async (): Promise<ExplanationMatch[]> => {
      if (!text) return [];
      const { data, error } = await supabase.rpc("match_explanations_in_text", {
        input_text: text,
        lang,
        max_results: 15,
      });
      if (error) {
        console.warn("match_explanations_in_text failed:", error.message);
        return [];
      }
      return (data ?? []) as ExplanationMatch[];
    },
  });
}

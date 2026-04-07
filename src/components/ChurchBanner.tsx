import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { X, Church } from "lucide-react";

export const ChurchBanner = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const slugFromUrl = searchParams.get("church");

  useEffect(() => {
    if (slugFromUrl) {
      localStorage.setItem("biblebot-church", slugFromUrl);
    }
  }, [slugFromUrl]);

  const storedSlug = slugFromUrl || localStorage.getItem("biblebot-church");

  const { data: church } = useQuery({
    queryKey: ["church-banner", storedSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("church_partners")
        .select("name, slug")
        .eq("slug", storedSlug!)
        .eq("is_active", true)
        .single();
      return data;
    },
    enabled: !!storedSlug && !dismissed,
  });

  if (!church || dismissed) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <Church className="h-4 w-4 text-primary shrink-0" />
        <span className="text-foreground/80">
          {t("church.recommendedBy", { name: church.name })}
        </span>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.removeItem("biblebot-church");
          }}
          className="ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

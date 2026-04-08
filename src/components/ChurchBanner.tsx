import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { X, Church, ExternalLink } from "lucide-react";

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
        .select("name, slug, logo_url")
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
        {church.logo_url ? (
          <img src={church.logo_url} alt="" className="h-4 w-4 object-contain shrink-0" />
        ) : (
          <Church className="h-4 w-4 text-primary shrink-0" />
        )}
        <Link
          to={`/church/${church.slug}`}
          className="text-foreground/80 hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          {t("church.recommendedBy", { name: church.name })}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>
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

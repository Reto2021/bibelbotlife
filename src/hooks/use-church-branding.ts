import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChurchBranding = {
  churchName: string;
  churchSlug: string;
  botName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

function getChurchSlug(): string | null {
  // Check URL param first (new visit), then localStorage (returning user)
  const urlSlug = new URLSearchParams(window.location.search).get("church");
  if (urlSlug) {
    localStorage.setItem("biblebot-church", urlSlug);
    return urlSlug;
  }
  return localStorage.getItem("biblebot-church");
}

async function fetchBranding(slug: string): Promise<ChurchBranding | null> {
  const { data } = await (supabase
    .from("church_partners_public" as any)
    .select("name, slug, logo_url, custom_bot_name, primary_color, secondary_color, plan_tier")
    .eq("slug", slug)
    .maybeSingle() as any);

  if (!data) return null;

  return {
    churchName: data.name,
    churchSlug: data.slug,
    botName: data.custom_bot_name || "BibleBot",
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
  };
}

/**
 * Hex color to HSL string for CSS custom properties.
 * Returns "H S% L%" format (without hsl() wrapper).
 */
export function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useChurchBranding() {
  const slug = getChurchSlug();

  const { data: branding, isLoading } = useQuery({
    queryKey: ["church-branding", slug],
    queryFn: () => fetchBranding(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 min cache
    gcTime: 1000 * 60 * 60,
  });

  return { branding: branding ?? null, isLoading, hasChurch: !!slug };
}

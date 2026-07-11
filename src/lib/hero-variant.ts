// Lightweight client-side A/B assignment for the landing hero headline.
// Deterministic per visitor via localStorage; falls back to a random pick.

export type HeroVariant = "praesenz" | "begleiter" | "leben";

export const HERO_VARIANTS: HeroVariant[] = ["praesenz", "begleiter", "leben"];

const STORAGE_KEY = "biblebot-hero-variant";

export function getHeroVariant(): HeroVariant {
  if (typeof window === "undefined") return "praesenz";
  try {
    const existing = localStorage.getItem(STORAGE_KEY) as HeroVariant | null;
    if (existing && HERO_VARIANTS.includes(existing)) return existing;
    const pick = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
    localStorage.setItem(STORAGE_KEY, pick);
    return pick;
  } catch {
    return "praesenz";
  }
}

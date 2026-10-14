import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "bibelbot_favorite_tools";

export function useFavoriteTools() {
  const [favorites, setFavorites] = useState<string[]>([]);
  // Stored preference is read after hydration so server and first client render match.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored) as string[]);
    } catch {
      // storage unavailable or corrupt — keep empty list
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const isFavorite = useCallback(
    (toolId: string) => favorites.includes(toolId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}

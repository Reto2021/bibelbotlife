// Anonyme Widget-Visitor-ID (localStorage). Wird genutzt um pro Browser
// die Anzahl Fragen pro Gemeinde im Senfkorn-Paket zu zählen.
const KEY = "bb_visitor_id";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getVisitorId(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

export function getChurchSlugFromUrlOrStorage(): string | null {
  try {
    const urlSlug = new URLSearchParams(window.location.search).get("church");
    if (urlSlug) return urlSlug;
    return localStorage.getItem("biblebot-church");
  } catch {
    return null;
  }
}

import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { LANG_COOKIE, LANG_STORAGE_KEY, resolveLanguage } from "@/i18n";

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag ?? "", q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);
}

/**
 * Language for this render. Server: saved-choice cookie, then Accept-Language, then German.
 * Client (later navigations): saved choice, then browser languages.
 */
export const getRequestLanguage = createIsomorphicFn()
  .server(() =>
    resolveLanguage([
      readCookie(getRequestHeader("cookie"), LANG_COOKIE),
      ...parseAcceptLanguage(getRequestHeader("accept-language")),
    ]),
  )
  .client(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      saved = null;
    }
    return resolveLanguage([readCookie(document.cookie, LANG_COOKIE), saved, ...navigator.languages]);
  });

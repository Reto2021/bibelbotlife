import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = (): string => {
  let id = sessionStorage.getItem("bb_sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("bb_sid", id);
  }
  return id;
};

/** Extract church slug from URL search params (?church=xyz) */
const getChurchSlug = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("church") || null;
};

/** Extract UTM source/medium from URL or infer from context */
const getUtmParams = (): { utm_source: string | null; utm_medium: string | null } => {
  const params = new URLSearchParams(window.location.search);
  let utm_source = params.get("utm_source") || params.get("source") || null;
  const utm_medium = params.get("utm_medium") || null;

  // Infer source from referrer if not explicitly set
  if (!utm_source && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.hostname !== window.location.hostname) {
        utm_source = ref.hostname;
      }
    } catch { /* ignore */ }
  }

  return { utm_source, utm_medium };
};

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const lastPath = useRef<string | null>(null);

  const track = useCallback(
    async (eventName: string, eventData: Record<string, unknown> = {}) => {
      try {
        const { utm_source, utm_medium } = getUtmParams();
        await (supabase.from("analytics_events") as any).insert({
          session_id: sessionId.current,
          event_type: "event",
          page_path: location.pathname,
          event_name: eventName,
          event_data: eventData,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          church_slug: getChurchSlug(),
          utm_source,
          utm_medium,
        });
      } catch {
        // silent fail – analytics should never break the app
      }
    },
    [location.pathname]
  );

  // Track pageviews on route change
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const { utm_source, utm_medium } = getUtmParams();
    (supabase.from("analytics_events") as any)
      .insert({
        session_id: sessionId.current,
        event_type: "pageview",
        page_path: location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        screen_width: window.innerWidth,
        church_slug: getChurchSlug(),
        utm_source,
        utm_medium,
      })
      .then(() => {});
  }, [location.pathname]);

  return { track };
};

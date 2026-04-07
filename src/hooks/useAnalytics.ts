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

const getDeviceType = (w: number): string => {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const lastPath = useRef<string | null>(null);

  const track = useCallback(
    async (eventName: string, eventData: Record<string, unknown> = {}) => {
      try {
        await (supabase.from("analytics_events") as any).insert({
          session_id: sessionId.current,
          event_type: "event",
          page_path: location.pathname,
          event_name: eventName,
          event_data: eventData,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
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

    (supabase.from("analytics_events") as any)
      .insert({
        session_id: sessionId.current,
        event_type: "pageview",
        page_path: location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        screen_width: window.innerWidth,
      })
      .then(() => {});
  }, [location.pathname]);

  return { track };
};

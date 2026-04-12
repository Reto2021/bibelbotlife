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

/** Capture ?ref=CODE into localStorage (30-day window) and log click */
const captureReferral = (sessionId: string) => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return;

  // Store with expiry (30 days)
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem("bb_ref", JSON.stringify({ code: ref, expiry }));

  // Log click once per session
  const clickKey = `bb_ref_clicked_${ref}`;
  if (sessionStorage.getItem(clickKey)) return;
  sessionStorage.setItem(clickKey, "1");

  (supabase.from as any)("referral_clicks").insert({
    referral_code: ref,
    landing_page: window.location.pathname,
    session_id: sessionId,
    user_agent: navigator.userAgent,
  }).then(() => {});
};

/** Get stored referral code (if not expired) */
export const getStoredReferralCode = (): string | null => {
  try {
    const raw = localStorage.getItem("bb_ref");
    if (!raw) return null;
    const { code, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem("bb_ref");
      return null;
    }
    return code;
  } catch {
    return null;
  }
};

/** Heartbeat interval in ms – sends a ping every 30s while page is visible */
const HEARTBEAT_INTERVAL_MS = 30_000;

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const lastPath = useRef<string | null>(null);

  // Capture referral code on mount
  useEffect(() => {
    captureReferral(sessionId.current);
  }, []);

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

  // ── Heartbeat: sends a lightweight event every 30s while tab is visible ──
  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.hidden) return; // skip when tab is backgrounded
      (supabase.from("analytics_events") as any)
        .insert({
          session_id: sessionId.current,
          event_type: "event",
          event_name: "heartbeat",
          page_path: location.pathname,
          referrer: null,
          user_agent: null,
          screen_width: null,
          church_slug: getChurchSlug(),
          utm_source: null,
          utm_medium: null,
        })
        .then(() => {});
    };

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return { track };
};

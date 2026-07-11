import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY =
  "BLMl5bBRzhlza0ozrHEblp3BfKtbyDsbOP-n120rl6teGPFdoyFb77P9WnOZpbFs2hKyfwILmw8WQebJrp_qc7c";

type Status = "idle" | "unsupported" | "granted" | "denied" | "subscribed" | "error";

export function useUserPushSubscription() {
  const [status, setStatus] = useState<Status>("idle");
  const [isSubscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setStatus("subscribed");
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (typeof window === "undefined") return;
    setSubscribing(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setStatus("error");
        return;
      }
      const json = sub.toJSON();
      await supabase
        .from("user_push_subscriptions")
        .upsert(
          {
            user_id: userData.user.id,
            endpoint: json.endpoint!,
            subscription: json as any,
            user_agent: navigator.userAgent,
            is_active: true,
          },
          { onConflict: "user_id,endpoint" },
        );
      setStatus("subscribed");
    } catch (e) {
      console.error("push subscribe failed", e);
      setStatus("error");
    } finally {
      setSubscribing(false);
    }
  }, []);

  return { status, isSubscribing, subscribe };
}

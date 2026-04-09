import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => {
        setIsAdmin(!!data);
        setIsChecking(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setIsChecking(false);
      });
  }, [user]);

  return { isAdmin, isChecking };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [churches, subscribers, todayMessages] = await Promise.all([
        supabase.from("church_partners").select("id, subscription_status, subscription_expires_at, is_active"),
        supabase.from("daily_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date().toISOString().split("T")[0]),
      ]);

      const allChurches = churches.data ?? [];
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 86400000);

      return {
        totalChurches: allChurches.length,
        activeSubscriptions: allChurches.filter((c) => c.subscription_status === "active").length,
        expiringSoon: allChurches.filter(
          (c) =>
            c.subscription_expires_at &&
            new Date(c.subscription_expires_at) <= in30 &&
            new Date(c.subscription_expires_at) > now
        ).length,
        totalSubscribers: subscribers.count ?? 0,
        todayMessages: todayMessages.count ?? 0,
      };
    },
  });
}

export function useAdminChurches() {
  return useQuery({
    queryKey: ["admin-churches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChurchUsageStats(churchId: string | null) {
  return useQuery({
    queryKey: ["admin-church-usage", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      if (!churchId) return null;
      const [services, team, records] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }).eq("church_id", churchId),
        supabase.from("service_team_members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
        supabase.from("church_records").select("id", { count: "exact", head: true }).eq("church_id", churchId),
      ]);
      return {
        servicesCount: services.count ?? 0,
        teamCount: team.count ?? 0,
        recordsCount: records.count ?? 0,
      };
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type TeamChurch = { church_id: string; role: string };

/**
 * Returns all churches the current user belongs to —
 * either as owner or as an active team member.
 * Used to gate access to the Messeplaner / Dashboard.
 */
export function useTeamMembership() {
  const { user } = useAuth();

  return useQuery<TeamChurch[]>({
    queryKey: ["my-team-churches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_team_churches" as any);
      if (error) throw error;
      return (data ?? []) as TeamChurch[];
    },
  });
}

export function useCanAccessDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useTeamMembership();
  return {
    canAccess: !!user && (data?.length ?? 0) > 0,
    isLoading: authLoading || (!!user && isLoading),
  };
}

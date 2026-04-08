import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserChurch } from "@/hooks/use-user-church";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TeamMember = Tables<"service_team_members">;

export function useTeam() {
  const { user } = useAuth();
  const { data: church } = useUserChurch();

  const queryClient = useQueryClient();
  const queryKey = ["team-members", church?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!church,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_team_members")
        .select("*")
        .eq("church_id", church!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMember = useMutation({
    mutationFn: async (member: Omit<TablesInsert<"service_team_members">, "church_id" | "created_by">) => {
      const { data, error } = await supabase
        .from("service_team_members")
        .insert({ ...member, church_id: church!.id, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"service_team_members"> & { id: string }) => {
      const { data, error } = await supabase
        .from("service_team_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_team_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, createMember, updateMember, deleteMember };
}

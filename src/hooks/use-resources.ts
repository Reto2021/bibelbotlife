import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Resource = Tables<"resource_library">;
export type ResourceInsert = TablesInsert<"resource_library">;
export type ResourceUpdate = TablesUpdate<"resource_library">;

export function useResources() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["resources", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_library")
        .select("*")
        .eq("created_by", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: Omit<ResourceInsert, "created_by">) => {
      const { data, error } = await supabase
        .from("resource_library")
        .insert({ ...resource, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ResourceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("resource_library")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resource_library")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

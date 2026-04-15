import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Resource = Tables<"resource_library"> & {
  is_system?: boolean;
  country?: string;
  tradition?: string;
  hymnal_ref?: string;
  shared_with_church?: boolean;
};
export type ResourceInsert = TablesInsert<"resource_library">;
export type ResourceUpdate = TablesUpdate<"resource_library">;

export function useResources() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["resources", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch user's own, system, AND church-shared resources (RLS handles access)
      const { data, error } = await supabase
        .from("resource_library")
        .select("*")
        .or(`created_by.eq.${user!.id},is_system.eq.true,shared_with_church.eq.true`)
        .order("is_system", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useSystemResources() {
  return useQuery({
    queryKey: ["system-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_library")
        .select("*")
        .eq("is_system", true)
        .order("resource_type")
        .order("title");
      if (error) throw error;
      return data as Resource[];
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

export function useImportSystemResource() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (systemResource: Resource) => {
      const { data, error } = await supabase
        .from("resource_library")
        .insert({
          title: systemResource.title,
          content: systemResource.content,
          resource_type: systemResource.resource_type,
          tags: systemResource.tags,
          language: systemResource.language,
          created_by: user!.id,
          is_system: false,
          metadata: { imported_from_system: systemResource.id },
        })
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

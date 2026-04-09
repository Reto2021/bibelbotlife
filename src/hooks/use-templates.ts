import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ServiceBlockData } from "@/components/services/ServiceBlock";

export interface ServiceTemplate {
  id: string;
  name: string;
  tradition: string;
  blocks: ServiceBlockData[];
  is_default: boolean;
  church_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["service_templates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ServiceTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { name: string; tradition: string; blocks: ServiceBlockData[]; church_id?: string }) => {
      const { error } = await supabase.from("service_templates").insert({
        name: input.name,
        tradition: input.tradition as any,
        blocks: input.blocks as any,
        church_id: input.church_id ?? null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name: string; tradition: string; blocks: ServiceBlockData[] }) => {
      const { error } = await supabase
        .from("service_templates")
        .update({ name: input.name, tradition: input.tradition as any, blocks: input.blocks as any })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_templates"] }),
  });
}

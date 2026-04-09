import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Series = Tables<"service_series">;
export type SeriesInsert = TablesInsert<"service_series">;
export type SeriesUpdate = TablesUpdate<"service_series">;

export function useSeries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["series", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_series")
        .select("*")
        .eq("created_by", user!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSeries() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<SeriesInsert, "created_by">) => {
      const { data, error } = await supabase
        .from("service_series")
        .insert({ ...s, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
}

export function useUpdateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: SeriesUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("service_series")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
}

export function useDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useAssignServiceToSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ serviceId, seriesId }: { serviceId: string; seriesId: string | null }) => {
      const { error } = await supabase
        .from("services")
        .update({ series_id: seriesId })
        .eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

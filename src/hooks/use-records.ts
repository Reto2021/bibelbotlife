import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserChurch } from "@/hooks/use-user-church";
import type { Tables } from "@/integrations/supabase/types";

export type ChurchRecord = Tables<"church_records">;

export function useRecords() {
  const { user } = useAuth();
  const { data: church } = useUserChurch();

  const queryClient = useQueryClient();
  const queryKey = ["church-records", church?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!church,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_records")
        .select("*")
        .eq("church_id", church!.id)
        .order("record_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createRecord = useMutation({
    mutationFn: async (record: {
      record_type: "baptism" | "wedding" | "funeral";
      record_date: string;
      participants?: unknown;
      officiant?: string;
      service_id?: string;
      notes?: string;
      record_number?: string;
    }) => {
      const { data, error } = await supabase
        .from("church_records")
        .insert({
          ...record,
          church_id: church!.id,
          created_by: user!.id,
          participants: record.participants as any,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      record_type: "baptism" | "wedding" | "funeral";
      record_date: string;
      participants: unknown;
      officiant: string;
      service_id: string | null;
      notes: string;
      record_number: string;
    }>) => {
      const { data, error } = await supabase
        .from("church_records")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("church_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, createRecord, updateRecord, deleteRecord };
}

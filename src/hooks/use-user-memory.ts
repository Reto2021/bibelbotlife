import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type MemorySource = "gpt" | "claude" | "gemini" | "manual";

export interface UserMemory {
  id: string;
  user_id: string;
  content: string;
  source: MemorySource;
  is_active: boolean;
  imported_at: string;
  updated_at: string;
}

const TABLE = "user_memory";

export function useUserMemories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-memory", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserMemory[]> => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserMemory[];
    },
  });
}

export function useImportMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; source: MemorySource }) => {
      const { data, error } = await supabase.functions.invoke("memory-import", {
        body: input,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as any).memory as UserMemory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-memory"] });
      toast.success("Gedächtnis importiert & destilliert");
    },
    onError: (e: any) => toast.error(e.message ?? "Import fehlgeschlagen"),
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; is_active?: boolean; content?: string }) => {
      const { id, ...patch } = input;
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as UserMemory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-memory"] }),
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-memory"] });
      toast.success("Gelöscht");
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

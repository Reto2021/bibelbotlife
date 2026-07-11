import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type BibleMomentTrigger =
  | "time"
  | "location"
  | "mood"
  | "weather"
  | "event"
  | "calendar"
  | "journal_mood"
  | "memory_topic";
export type BibleMomentChannel = "inapp" | "push" | "sms" | "telegram" | "email";

export interface BibleMoment {
  id: string;
  user_id: string;
  trigger_type: BibleMomentTrigger;
  label: string | null;
  config: Record<string, any>;
  delivery_channel: BibleMomentChannel;
  language: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  active: boolean;
  last_delivered_at: string | null;
  next_eligible_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibleMomentDelivery {
  id: string;
  moment_id: string;
  channel: string;
  status: string;
  reference: string | null;
  verse_text: string | null;
  impulse_text: string | null;
  context: Record<string, any>;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

const TABLE = "bible_moments";
const DELIVERY_TABLE = "bible_moment_deliveries";

export function useBibleMoments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bible-moments", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BibleMoment[]> => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BibleMoment[];
    },
  });
}

export function useCreateBibleMoment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      trigger_type: BibleMomentTrigger;
      label?: string | null;
      config?: Record<string, any>;
      delivery_channel?: BibleMomentChannel;
      language?: string;
      quiet_hours_start?: number;
      quiet_hours_end?: number;
      active?: boolean;
    }) => {
      if (!user) throw new Error("not authenticated");
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert({
          user_id: user.id,
          trigger_type: input.trigger_type,
          label: input.label ?? null,
          config: input.config ?? {},
          delivery_channel: input.delivery_channel ?? "inapp",
          language: input.language ?? "de",
          quiet_hours_start: input.quiet_hours_start ?? 22,
          quiet_hours_end: input.quiet_hours_end ?? 7,
          active: input.active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as BibleMoment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-moments"] }),
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useUpdateBibleMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & Partial<Omit<BibleMoment, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { id, ...patch } = input;
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as BibleMoment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-moments"] }),
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useDeleteBibleMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-moments"] }),
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useBibleMomentDeliveries(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bible-moment-deliveries", user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<BibleMomentDelivery[]> => {
      const { data, error } = await (supabase as any)
        .from(DELIVERY_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as BibleMomentDelivery[];
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type JournalMood =
  | "dankbar"
  | "hoffnungsvoll"
  | "schwer"
  | "suchend"
  | "friedvoll"
  | "unklar";

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  prompt: string | null;
  verse_ref: string | null;
  mood: JournalMood | null;
  created_at: string;
}

export function useJournalEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal-entries", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await (supabase as any)
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      content: string;
      prompt?: string | null;
      verse_ref?: string | null;
      mood?: JournalMood | null;
    }) => {
      if (!user) throw new Error("not authenticated");
      const { data, error } = await (supabase as any)
        .from("journal_entries")
        .insert({
          user_id: user.id,
          content: input.content,
          prompt: input.prompt ?? null,
          verse_ref: input.verse_ref ?? null,
          mood: input.mood ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      content?: string;
      mood?: JournalMood | null;
    }) => {
      const patch: Record<string, unknown> = {};
      if (input.content !== undefined) patch.content = input.content;
      if (input.mood !== undefined) patch.mood = input.mood;
      const { data, error } = await (supabase as any)
        .from("journal_entries")
        .update(patch)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("journal_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler"),
  });
}

/**
 * Calculates the current consecutive-day streak from journal entries.
 * A streak counts the number of distinct calendar days (most recent first)
 * that include today or yesterday.
 */
export function calculateStreak(entries: Pick<JournalEntry, "created_at">[]): number {
  if (!entries.length) return 0;
  const days = new Set(
    entries.map((e) => new Date(e.created_at).toISOString().slice(0, 10)),
  );
  const today = new Date();
  let streak = 0;
  // Allow streak to start from yesterday too
  let cursor = new Date(today);
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

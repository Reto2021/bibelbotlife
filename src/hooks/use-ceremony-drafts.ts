import { omitUndefined } from "@/lib/omit-undefined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

type CeremonyType = "funeral" | "wedding" | "baptism" | "confirmation";

interface DraftData {
  ceremony_type: CeremonyType;
  title?: string | undefined;
  person_name?: string | undefined;
  form_data?: Record<string, unknown> | undefined;
  transcripts?: Array<{ text: string; duration: number }> | undefined;
  generated_text?: string | undefined;
}

export function useCeremonyDrafts(ceremonyType?: CeremonyType) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const draftsQuery = useQuery({
    queryKey: ["ceremony-drafts", user?.id, ceremonyType],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("ceremony_drafts")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (ceremonyType) q = q.eq("ceremony_type", ceremonyType);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const saveDraft = useMutation({
    mutationFn: async ({ id, ...data }: DraftData & { id?: string | undefined }) => {
      if (id) {
        const { data: updated, error } = await supabase
          .from("ceremony_drafts")
          .update(omitUndefined({
            title: data.title,
            person_name: data.person_name,
            form_data: (data.form_data ?? {}) as Json,
            transcripts: (data.transcripts ?? []) as unknown as Json,
            generated_text: data.generated_text,
          }))
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from("ceremony_drafts")
          .insert(omitUndefined({
            user_id: user!.id,
            ceremony_type: data.ceremony_type,
            title: data.title,
            person_name: data.person_name,
            form_data: (data.form_data ?? {}) as Json,
            transcripts: (data.transcripts ?? []) as unknown as Json,
            generated_text: data.generated_text,
          }))
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ceremony-drafts"] });
    },
  });

  const toggleShare = useMutation({
    mutationFn: async ({ id, is_shared }: { id: string; is_shared: boolean }) => {
      const { data, error } = await supabase
        .from("ceremony_drafts")
        .update({ is_shared })
        .eq("id", id)
        .select("share_token")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["ceremony-drafts"] });
      if (vars.is_shared) {
        toast.success("Link zum Teilen aktiviert");
      }
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ceremony_drafts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ceremony-drafts"] });
    },
  });

  return { draftsQuery, saveDraft, toggleShare, deleteDraft };
}

export function useSharedDraft(shareToken: string | undefined) {
  return useQuery({
    queryKey: ["shared-draft", shareToken],
    enabled: !!shareToken,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_shared_draft", { p_token: shareToken! } as any);
      if (error) throw error;
      const drafts = data as any[];
      if (!drafts || drafts.length === 0) throw new Error("Draft not found");
      return drafts[0];
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface Circle {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  weekly_bible_book: string | null;
  weekly_bible_chapter: number | null;
  created_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface CirclePrayer {
  id: string;
  circle_id: string;
  user_id: string;
  display_name: string;
  content: string;
  prayer_count: number;
  is_answered: boolean;
  created_at: string;
}

export interface CircleJourneyProgress {
  id: string;
  circle_id: string;
  user_id: string;
  display_name: string;
  days_completed: number;
  last_active_date: string | null;
  updated_at: string;
}

export function useCircle() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["circle-membership", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circle_members")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CircleMember | null;
    },
    enabled: !!user,
  });

  const circleId = membership?.circle_id;

  const { data: circle, isLoading: circleLoading } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circles")
        .select("*")
        .eq("id", circleId!)
        .single();
      if (error) throw error;
      return data as Circle;
    },
    enabled: !!circleId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["circle-members", circleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circle_members")
        .select("*")
        .eq("circle_id", circleId!);
      if (error) throw error;
      return data as CircleMember[];
    },
    enabled: !!circleId,
  });

  const { data: prayers = [] } = useQuery({
    queryKey: ["circle-prayers", circleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circle_prayer_requests")
        .select("*")
        .eq("circle_id", circleId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CirclePrayer[];
    },
    enabled: !!circleId,
  });

  const { data: journeyProgress = [] } = useQuery({
    queryKey: ["circle-journey", circleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circle_journey_progress")
        .select("*")
        .eq("circle_id", circleId!);
      if (error) throw error;
      return data as CircleJourneyProgress[];
    },
    enabled: !!circleId,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["circle-membership"] });
    qc.invalidateQueries({ queryKey: ["circle"] });
    qc.invalidateQueries({ queryKey: ["circle-members"] });
    qc.invalidateQueries({ queryKey: ["circle-prayers"] });
    qc.invalidateQueries({ queryKey: ["circle-journey"] });
  };

  const createCircle = useMutation({
    mutationFn: async ({ name, displayName }: { name: string; displayName: string }) => {
      const { data: newCircle, error: circleError } = await supabase
        .from("circles")
        .insert({ name, created_by: user!.id })
        .select()
        .single();
      if (circleError) throw circleError;

      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ circle_id: newCircle.id, user_id: user!.id, display_name: displayName });
      if (memberError) throw memberError;

      return newCircle;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(t("circle.createTitle"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinCircle = useMutation({
    mutationFn: async ({ inviteCode, displayName }: { inviteCode: string; displayName: string }) => {
      // Look up circle by invite code - need to use a workaround since we can't SELECT circles we're not a member of
      // We'll insert into circle_members using a DB function or direct insert
      // First, find the circle via a service call or RPC
      // Since RLS blocks non-members from seeing circles, we need a different approach
      // We'll try inserting directly - the user needs the circle_id
      // Actually, let's query circles table - the user isn't a member yet so RLS blocks this
      // Solution: create an RPC function or use invite_code lookup
      
      // For now, use a raw query approach via RPC or direct
      // We'll use the fact that invite_code is unique and do a direct lookup
      const { data: circles, error: lookupError } = await supabase
        .from("circles")
        .select("id")
        .eq("invite_code", inviteCode)
        .limit(1);
      
      // If RLS blocks this (user not member), circles will be empty
      if (lookupError) throw lookupError;
      if (!circles || circles.length === 0) {
        throw new Error("Einladungscode nicht gefunden. Bitte überprüfe den Code.");
      }

      const { error: joinError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circles[0].id, user_id: user!.id, display_name: displayName });
      if (joinError) throw joinError;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(t("circle.joinTitle"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveCircle = useMutation({
    mutationFn: async () => {
      if (!membership) return;
      const { error } = await supabase
        .from("circle_members")
        .delete()
        .eq("id", membership.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e: Error) => toast.error(e.message),
  });

  const addPrayer = useMutation({
    mutationFn: async (content: string) => {
      if (!circleId || !membership) throw new Error("Not in a circle");
      const { error } = await supabase
        .from("circle_prayer_requests")
        .insert({
          circle_id: circleId,
          user_id: user!.id,
          display_name: membership.display_name,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle-prayers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const prayFor = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("increment_circle_prayer_count", { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle-prayers"] }),
  });

  const markAnswered = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("circle_prayer_requests")
        .update({ is_answered: true })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle-prayers"] }),
  });

  const updateJourneyProgress = useMutation({
    mutationFn: async () => {
      if (!circleId || !membership) throw new Error("Not in a circle");
      const today = new Date().toISOString().slice(0, 10);
      const existing = journeyProgress.find(p => p.user_id === user!.id);

      if (existing) {
        if (existing.last_active_date === today) return; // already updated today
        const { error } = await supabase
          .from("circle_journey_progress")
          .update({
            days_completed: Math.min(existing.days_completed + 1, 21),
            last_active_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("circle_journey_progress")
          .insert({
            circle_id: circleId,
            user_id: user!.id,
            display_name: membership.display_name,
            days_completed: 1,
            last_active_date: today,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle-journey"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateWeeklyVerse = useMutation({
    mutationFn: async ({ book, chapter }: { book: string; chapter: number }) => {
      if (!circleId) throw new Error("No circle");
      const { error } = await supabase
        .from("circles")
        .update({ weekly_bible_book: book, weekly_bible_chapter: chapter })
        .eq("id", circleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle"] }),
  });

  return {
    circle,
    membership,
    members,
    prayers,
    journeyProgress,
    isLoading: membershipLoading || circleLoading,
    hasCircle: !!membership,
    isCreator: circle?.created_by === user?.id,
    createCircle,
    joinCircle,
    leaveCircle,
    addPrayer,
    prayFor,
    markAnswered,
    updateJourneyProgress,
    updateWeeklyVerse,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

// Service-Types die als Lektionen zählen
export const LESSON_TYPES = ["lesson", "double_lesson", "project_day", "confirmation_class"] as const;
export const SERVICE_TYPES_REGULAR = ["regular", "baptism", "wedding", "funeral", "confirmation", "communion", "special", "other"] as const;

export function isLessonType(type: string): boolean {
  return (LESSON_TYPES as readonly string[]).includes(type);
}

/** Holt nur Lektionen (Unterrichtsplaner) */
export function useLessons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lessons", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("created_by", user!.id)
        .in("service_type", LESSON_TYPES as unknown as string[])
        .order("service_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Holt nur Gottesdienste (klassischer Messeplaner) */
export function useServicesOnly() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["services-only", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("created_by", user!.id)
        .in("service_type", SERVICE_TYPES_REGULAR as unknown as string[])
        .order("service_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("created_by", user!.id)
        .order("service_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

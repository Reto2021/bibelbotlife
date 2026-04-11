import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAppSetting(key: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["app_setting", key],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { value: data, isLoading };
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await (supabase.from as any)("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["app_setting", key] });
    },
  });
}

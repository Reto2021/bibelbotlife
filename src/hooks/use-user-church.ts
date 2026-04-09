import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type UserChurch = {
  id: string;
  name: string;
  slug: string;
  denomination: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  logo_url: string | null;
  is_active: boolean;
  custom_bot_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  pastor_name: string | null;
  pastor_photo_url: string | null;
  plan_tier: string;
  service_times: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  telegram_group_link: string | null;
  welcome_message: string | null;
  created_at: string;
  updated_at: string;
};

export function useUserChurch() {
  const { user } = useAuth();

  return useQuery<UserChurch | null>({
    queryKey: ["user-church", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_church" as any);
      if (error) throw error;

      const rows = (data ?? []) as UserChurch[];
      return rows[0] ?? null;
    },
  });
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string | null
          event_type: string
          id: string
          page_path: string | null
          referrer: string | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name?: string | null
          event_type?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string | null
          event_type?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      church_contact_requests: {
        Row: {
          church_id: string
          created_at: string
          id: string
          message: string
          sender_email: string
          sender_name: string | null
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          message: string
          sender_email: string
          sender_name?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_email?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_contact_requests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      church_partners: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          denomination: string | null
          id: string
          is_active: boolean
          language: string | null
          logo_url: string | null
          name: string
          pastor_name: string | null
          pastor_photo_url: string | null
          plan_tier: Database["public"]["Enums"]["church_plan_tier"]
          service_times: string | null
          slug: string
          telegram_group_link: string | null
          updated_at: string
          website: string | null
          welcome_message: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          denomination?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name: string
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          service_times?: string | null
          slug: string
          telegram_group_link?: string | null
          updated_at?: string
          website?: string | null
          welcome_message?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          denomination?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name?: string
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          service_times?: string | null
          slug?: string
          telegram_group_link?: string | null
          updated_at?: string
          website?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      daily_broadcast_log: {
        Row: {
          id: string
          impulse_data: Json
          impulse_date: string
          sent_at: string
          subscribers_count: number
        }
        Insert: {
          id?: string
          impulse_data: Json
          impulse_date: string
          sent_at?: string
          subscribers_count?: number
        }
        Update: {
          id?: string
          impulse_data?: Json
          impulse_date?: string
          sent_at?: string
          subscribers_count?: number
        }
        Relationships: []
      }
      daily_subscribers: {
        Row: {
          channel: string
          created_at: string
          first_name: string | null
          id: string
          is_active: boolean
          phone_number: string | null
          push_subscription: Json | null
          telegram_chat_id: number | null
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          push_subscription?: Json | null
          telegram_chat_id?: number | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          push_subscription?: Json | null
          telegram_chat_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          raw_update: Json
          role: string
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          raw_update: Json
          role?: string
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          raw_update?: Json
          role?: string
          text?: string | null
          update_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      church_plan_tier: "free" | "community" | "gemeinde" | "kirche"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      church_plan_tier: ["free", "community", "gemeinde", "kirche"],
    },
  },
} as const

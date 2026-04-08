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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
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
          custom_bot_name: string | null
          denomination: string | null
          id: string
          is_active: boolean
          language: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          pastor_name: string | null
          pastor_photo_url: string | null
          plan_tier: Database["public"]["Enums"]["church_plan_tier"]
          primary_color: string | null
          secondary_color: string | null
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
          custom_bot_name?: string | null
          denomination?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
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
          custom_bot_name?: string | null
          denomination?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
          service_times?: string | null
          slug?: string
          telegram_group_link?: string | null
          updated_at?: string
          website?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      church_partnership_inquiries: {
        Row: {
          church_name: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          preferred_tier: string | null
        }
        Insert: {
          church_name?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          preferred_tier?: string | null
        }
        Update: {
          church_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          preferred_tier?: string | null
        }
        Relationships: []
      }
      church_records: {
        Row: {
          church_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          officiant: string | null
          participants: Json | null
          record_date: string
          record_number: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          service_id: string | null
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          officiant?: string | null
          participants?: Json | null
          record_date: string
          record_number?: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          officiant?: string | null
          participants?: Json | null
          record_date?: string
          record_number?: string | null
          record_type?: Database["public"]["Enums"]["record_type"]
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_records_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_records_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
          language: string | null
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
          language?: string | null
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
          language?: string | null
          phone_number?: string | null
          push_subscription?: Json | null
          telegram_chat_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          church_id: string | null
          content: string | null
          created_at: string
          created_by: string
          id: string
          language: string
          metadata: Json | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          church_id?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          language?: string
          metadata?: Json | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          church_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          language?: string
          metadata?: Json | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_library_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      service_series: {
        Row: {
          church_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_series_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      service_team_members: {
        Row: {
          availability: Json | null
          church_id: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: Json | null
          church_id: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: Json | null
          church_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_team_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      service_templates: {
        Row: {
          blocks: Json
          church_id: string | null
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          tradition: Database["public"]["Enums"]["confession_tradition"]
          updated_at: string
        }
        Insert: {
          blocks?: Json
          church_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          tradition?: Database["public"]["Enums"]["confession_tradition"]
          updated_at?: string
        }
        Update: {
          blocks?: Json
          church_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          tradition?: Database["public"]["Enums"]["confession_tradition"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_templates_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          blocks: Json
          church_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          series_id: string | null
          service_date: string
          service_time: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["service_status"]
          title: string
          tradition: Database["public"]["Enums"]["confession_tradition"]
          updated_at: string
        }
        Insert: {
          blocks?: Json
          church_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          series_id?: string | null
          service_date: string
          service_time?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          title: string
          tradition?: Database["public"]["Enums"]["confession_tradition"]
          updated_at?: string
        }
        Update: {
          blocks?: Json
          church_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          series_id?: string | null
          service_date?: string
          service_time?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          title?: string
          tradition?: Database["public"]["Enums"]["confession_tradition"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_series_fk"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "service_series"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      church_plan_tier: "free" | "community" | "gemeinde" | "kirche"
      confession_tradition:
        | "catholic"
        | "reformed"
        | "lutheran"
        | "evangelical"
        | "secular"
      record_type: "baptism" | "wedding" | "funeral"
      resource_type: "song" | "prayer" | "reading" | "liturgy" | "other"
      service_status: "draft" | "published" | "archived"
      service_type:
        | "regular"
        | "baptism"
        | "wedding"
        | "funeral"
        | "confirmation"
        | "communion"
        | "special"
        | "other"
      team_role:
        | "pastor"
        | "musician"
        | "lector"
        | "sacristan"
        | "technician"
        | "volunteer"
        | "other"
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
      confession_tradition: [
        "catholic",
        "reformed",
        "lutheran",
        "evangelical",
        "secular",
      ],
      record_type: ["baptism", "wedding", "funeral"],
      resource_type: ["song", "prayer", "reading", "liturgy", "other"],
      service_status: ["draft", "published", "archived"],
      service_type: [
        "regular",
        "baptism",
        "wedding",
        "funeral",
        "confirmation",
        "communion",
        "special",
        "other",
      ],
      team_role: [
        "pastor",
        "musician",
        "lector",
        "sacristan",
        "technician",
        "volunteer",
        "other",
      ],
    },
  },
} as const

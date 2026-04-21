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
      ab_test_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "outreach_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          church_slug: string | null
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
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          church_slug?: string | null
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
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          church_slug?: string | null
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
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bible_chapter_fetch_log: {
        Row: {
          attempts: number
          book_number: number
          chapter: number
          error_message: string | null
          fetched_at: string
          id: string
          last_error_code: string | null
          next_retry_at: string | null
          source_url: string | null
          status: string
          translation: string
          verse_count: number
        }
        Insert: {
          attempts?: number
          book_number: number
          chapter: number
          error_message?: string | null
          fetched_at?: string
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          source_url?: string | null
          status?: string
          translation: string
          verse_count?: number
        }
        Update: {
          attempts?: number
          book_number?: number
          chapter?: number
          error_message?: string | null
          fetched_at?: string
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          source_url?: string | null
          status?: string
          translation?: string
          verse_count?: number
        }
        Relationships: []
      }
      bible_translation_meta: {
        Row: {
          citation: string
          code: string
          confession: string | null
          created_at: string
          description: string | null
          is_restricted: boolean
          language: string
          name: string
          publisher: string | null
          rights_status: string
          source_url: string | null
          testaments: string[]
          translators: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          citation: string
          code: string
          confession?: string | null
          created_at?: string
          description?: string | null
          is_restricted?: boolean
          language?: string
          name: string
          publisher?: string | null
          rights_status?: string
          source_url?: string | null
          testaments?: string[]
          translators?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          citation?: string
          code?: string
          confession?: string | null
          created_at?: string
          description?: string | null
          is_restricted?: boolean
          language?: string
          name?: string
          publisher?: string | null
          rights_status?: string
          source_url?: string | null
          testaments?: string[]
          translators?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book: string
          book_number: number
          chapter: number
          created_at: string
          fts: unknown
          id: string
          language: string
          text: string
          translation: string
          verse: number
        }
        Insert: {
          book: string
          book_number: number
          chapter: number
          created_at?: string
          fts?: unknown
          id?: string
          language?: string
          text: string
          translation: string
          verse: number
        }
        Update: {
          book?: string
          book_number?: number
          chapter?: number
          created_at?: string
          fts?: unknown
          id?: string
          language?: string
          text?: string
          translation?: string
          verse?: number
        }
        Relationships: []
      }
      bible_verses_restricted: {
        Row: {
          book: string
          book_number: number
          chapter: number
          fetched_at: string
          id: string
          language: string
          source_url: string | null
          text: string
          translation: string
          verse: number
        }
        Insert: {
          book: string
          book_number: number
          chapter: number
          fetched_at?: string
          id?: string
          language?: string
          source_url?: string | null
          text: string
          translation: string
          verse: number
        }
        Update: {
          book?: string
          book_number?: number
          chapter?: number
          fetched_at?: string
          id?: string
          language?: string
          source_url?: string | null
          text?: string
          translation?: string
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_restricted_translation_fkey"
            columns: ["translation"]
            isOneToOne: false
            referencedRelation: "bible_translation_meta"
            referencedColumns: ["code"]
          },
        ]
      }
      ceremony_drafts: {
        Row: {
          ceremony_type: Database["public"]["Enums"]["ceremony_type"]
          created_at: string
          form_data: Json | null
          generated_text: string | null
          id: string
          is_shared: boolean
          person_name: string | null
          share_token: string | null
          title: string | null
          transcripts: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ceremony_type?: Database["public"]["Enums"]["ceremony_type"]
          created_at?: string
          form_data?: Json | null
          generated_text?: string | null
          id?: string
          is_shared?: boolean
          person_name?: string | null
          share_token?: string | null
          title?: string | null
          transcripts?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ceremony_type?: Database["public"]["Enums"]["ceremony_type"]
          created_at?: string
          form_data?: Json | null
          generated_text?: string | null
          id?: string
          is_shared?: boolean
          person_name?: string | null
          share_token?: string | null
          title?: string | null
          transcripts?: Json | null
          updated_at?: string
          user_id?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          answer_text: string | null
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          language: string | null
          message_id: string | null
          question_text: string | null
          rating: number
          reviewed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          answer_text?: string | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          language?: string | null
          message_id?: string | null
          question_text?: string | null
          rating: number
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          answer_text?: string | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          language?: string | null
          message_id?: string | null
          question_text?: string | null
          rating?: number
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
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
      church_billing: {
        Row: {
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_interval: string | null
          billing_name: string | null
          billing_reference: string | null
          billing_street: string | null
          billing_zip: string | null
          church_id: string
          created_at: string
          iban: string | null
          id: string
          updated_at: string
        }
        Insert: {
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_interval?: string | null
          billing_name?: string | null
          billing_reference?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          church_id: string
          created_at?: string
          iban?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_interval?: string | null
          billing_name?: string | null
          billing_reference?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          church_id?: string
          created_at?: string
          iban?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_billing_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: true
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_billing_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: true
            referencedRelation: "church_partners_public"
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
          {
            foreignKeyName: "church_contact_requests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      church_members: {
        Row: {
          church_id: string
          consent_contact: boolean
          created_at: string
          id: string
          source_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id: string
          consent_contact?: boolean
          created_at?: string
          id?: string
          source_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string
          consent_contact?: boolean
          created_at?: string
          id?: string
          source_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      church_partners: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_person: string | null
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
          notify_on_contact: boolean
          owner_id: string | null
          pastor_name: string | null
          pastor_photo_url: string | null
          plan_tier: Database["public"]["Enums"]["church_plan_tier"]
          primary_color: string | null
          secondary_color: string | null
          service_times: string | null
          slug: string
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          telegram_group_link: string | null
          updated_at: string
          website: string | null
          welcome_message: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
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
          notify_on_contact?: boolean
          owner_id?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
          service_times?: string | null
          slug: string
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          telegram_group_link?: string | null
          updated_at?: string
          website?: string | null
          welcome_message?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
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
          notify_on_contact?: boolean
          owner_id?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
          service_times?: string | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
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
          referral_code: string | null
        }
        Insert: {
          church_name?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          preferred_tier?: string | null
          referral_code?: string | null
        }
        Update: {
          church_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          preferred_tier?: string | null
          referral_code?: string | null
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
            foreignKeyName: "church_records_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
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
      circle_journey_progress: {
        Row: {
          circle_id: string
          completed_at: string | null
          days_completed: number | null
          display_name: string
          id: string
          last_active_date: string | null
          question_id: string | null
          response: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          circle_id: string
          completed_at?: string | null
          days_completed?: number | null
          display_name: string
          id?: string
          last_active_date?: string | null
          question_id?: string | null
          response?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          circle_id?: string
          completed_at?: string | null
          days_completed?: number | null
          display_name?: string
          id?: string
          last_active_date?: string | null
          question_id?: string | null
          response?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_journey_progress_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          display_name: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          display_name: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          display_name?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_prayer_requests: {
        Row: {
          circle_id: string
          content: string
          created_at: string | null
          display_name: string
          id: string
          is_answered: boolean | null
          prayer_count: number | null
          user_id: string
        }
        Insert: {
          circle_id: string
          content: string
          created_at?: string | null
          display_name: string
          id?: string
          is_answered?: boolean | null
          prayer_count?: number | null
          user_id: string
        }
        Update: {
          circle_id?: string
          content?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_answered?: boolean | null
          prayer_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_prayer_requests_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          invite_code: string
          name: string
          weekly_bible_book: string | null
          weekly_bible_chapter: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          weekly_bible_book?: string | null
          weekly_bible_chapter?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          weekly_bible_book?: string | null
          weekly_bible_chapter?: number | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
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
      golden_answers: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          embedding: string | null
          id: string
          is_active: boolean
          language: string
          question: string
          source_feedback_id: string | null
          source_message_id: string | null
          topic: string | null
          updated_at: string
          use_count: number
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          language?: string
          question: string
          source_feedback_id?: string | null
          source_message_id?: string | null
          topic?: string | null
          updated_at?: string
          use_count?: number
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          language?: string
          question?: string
          source_feedback_id?: string | null
          source_message_id?: string | null
          topic?: string | null
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "golden_answers_source_feedback_id_fkey"
            columns: ["source_feedback_id"]
            isOneToOne: false
            referencedRelation: "chat_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "golden_answers_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          church_id: string
          created_at: string
          created_by: string
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json
          notes: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          church_id: string
          created_at?: string
          created_by: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          church_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          mood: string | null
          prompt: string | null
          user_id: string
          verse_ref: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          prompt?: string | null
          user_id: string
          verse_ref?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          prompt?: string | null
          user_id?: string
          verse_ref?: string | null
        }
        Relationships: []
      }
      outreach_campaigns: {
        Row: {
          blacklist_domains: string[]
          booking_url: string | null
          created_at: string
          created_by: string
          id: string
          max_emails_per_day: number
          max_emails_per_hour: number
          name: string
          send_end_hour: number
          send_start_hour: number
          send_weekdays_only: boolean
          sender_email: string
          sender_name: string
          status: Database["public"]["Enums"]["outreach_campaign_status"]
          target_criteria: Json
          updated_at: string
        }
        Insert: {
          blacklist_domains?: string[]
          booking_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          max_emails_per_day?: number
          max_emails_per_hour?: number
          name: string
          send_end_hour?: number
          send_start_hour?: number
          send_weekdays_only?: boolean
          sender_email: string
          sender_name?: string
          status?: Database["public"]["Enums"]["outreach_campaign_status"]
          target_criteria?: Json
          updated_at?: string
        }
        Update: {
          blacklist_domains?: string[]
          booking_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          max_emails_per_day?: number
          max_emails_per_hour?: number
          name?: string
          send_end_hour?: number
          send_start_hour?: number
          send_weekdays_only?: boolean
          sender_email?: string
          sender_name?: string
          status?: Database["public"]["Enums"]["outreach_campaign_status"]
          target_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      outreach_emails: {
        Row: {
          body: string
          clicked_at: string | null
          created_at: string
          id: string
          lead_id: string
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          sequence_step: number
          status: Database["public"]["Enums"]["outreach_email_status"]
          subject: string
        }
        Insert: {
          body: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          sequence_step: number
          status?: Database["public"]["Enums"]["outreach_email_status"]
          subject: string
        }
        Update: {
          body?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          sequence_step?: number
          status?: Database["public"]["Enums"]["outreach_email_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "outreach_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_leads: {
        Row: {
          ab_variant_chosen: string | null
          ab_variant_color: string | null
          campaign_id: string
          church_name: string
          city: string | null
          contact_name: string | null
          created_at: string
          current_step: number
          denomination: string | null
          email: string
          facebook_url: string | null
          id: string
          instagram_handle: string | null
          last_contacted_at: string | null
          logo_url: string | null
          personal_note: string | null
          primary_color: string | null
          scraped_branding: Json | null
          scraped_data: Json | null
          screenshot_url: string | null
          secondary_color: string | null
          source: string
          status: Database["public"]["Enums"]["outreach_lead_status"]
          telegram_username: string | null
          text_color: string | null
          updated_at: string
          website: string | null
          website_score: number | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          ab_variant_chosen?: string | null
          ab_variant_color?: string | null
          campaign_id: string
          church_name: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          current_step?: number
          denomination?: string | null
          email: string
          facebook_url?: string | null
          id?: string
          instagram_handle?: string | null
          last_contacted_at?: string | null
          logo_url?: string | null
          personal_note?: string | null
          primary_color?: string | null
          scraped_branding?: Json | null
          scraped_data?: Json | null
          screenshot_url?: string | null
          secondary_color?: string | null
          source?: string
          status?: Database["public"]["Enums"]["outreach_lead_status"]
          telegram_username?: string | null
          text_color?: string | null
          updated_at?: string
          website?: string | null
          website_score?: number | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          ab_variant_chosen?: string | null
          ab_variant_color?: string | null
          campaign_id?: string
          church_name?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          current_step?: number
          denomination?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_handle?: string | null
          last_contacted_at?: string | null
          logo_url?: string | null
          personal_note?: string | null
          primary_color?: string | null
          scraped_branding?: Json | null
          scraped_data?: Json | null
          screenshot_url?: string | null
          secondary_color?: string | null
          source?: string
          status?: Database["public"]["Enums"]["outreach_lead_status"]
          telegram_username?: string | null
          text_color?: string | null
          updated_at?: string
          website?: string | null
          website_score?: number | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequences: {
        Row: {
          body_template: string
          campaign_id: string
          created_at: string
          delay_days: number
          id: string
          step_number: number
          subject_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          campaign_id: string
          created_at?: string
          delay_days?: number
          id?: string
          step_number: number
          subject_template: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          campaign_id?: string
          created_at?: string
          delay_days?: number
          id?: string
          step_number?: number
          subject_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_schedules: {
        Row: {
          campaign_id: string
          country: string
          created_at: string
          cron_expression: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_log: string[] | null
          last_run_status: string | null
          max_results: number
          search_query: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          country?: string
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_log?: string[] | null
          last_run_status?: string | null
          max_results?: number
          search_query: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          country?: string
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_log?: string[] | null
          last_run_status?: string | null
          max_results?: number
          search_query?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_approved: boolean
          prayer_count: number
          session_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_approved?: boolean
          prayer_count?: number
          session_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_approved?: boolean
          prayer_count?: number
          session_id?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          quiz_mode: string
          score: number
          session_id: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          quiz_mode?: string
          score?: number
          session_id: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          quiz_mode?: string
          score?: number
          session_id?: string
          total_questions?: number
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          landing_page: string | null
          referral_code: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referral_code: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referral_code?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          commission_amount: number
          created_at: string
          deal_value: number
          ghl_webhook_response: Json | null
          ghl_webhook_status: string
          id: string
          inquiry_id: string | null
          partner_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          deal_value?: number
          ghl_webhook_response?: Json | null
          ghl_webhook_status?: string
          id?: string
          inquiry_id?: string | null
          partner_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          deal_value?: number
          ghl_webhook_response?: Json | null
          ghl_webhook_status?: string
          id?: string
          inquiry_id?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "church_partnership_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          email: string
          ghl_contact_id: string | null
          id: string
          is_active: boolean
          name: string
          total_clicks: number
          total_commission: number
          total_conversions: number
          updated_at: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          email: string
          ghl_contact_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          updated_at?: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          email?: string
          ghl_contact_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          updated_at?: string
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          church_id: string | null
          content: string | null
          country: string | null
          created_at: string
          created_by: string | null
          hymnal_ref: string | null
          id: string
          is_system: boolean
          language: string
          metadata: Json | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          shared_with_church: boolean
          tags: string[] | null
          title: string
          tradition: string | null
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          church_id?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          hymnal_ref?: string | null
          id?: string
          is_system?: boolean
          language?: string
          metadata?: Json | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          shared_with_church?: boolean
          tags?: string[] | null
          title: string
          tradition?: string | null
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          church_id?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          hymnal_ref?: string | null
          id?: string
          is_system?: boolean
          language?: string
          metadata?: Json | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          shared_with_church?: boolean
          tags?: string[] | null
          title?: string
          tradition?: string | null
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
          {
            foreignKeyName: "resource_library_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_topics: {
        Row: {
          body_md: string | null
          created_at: string
          faqs: Json | null
          id: string
          intro: string | null
          is_published: boolean
          language: string
          meta_description: string | null
          related_verses: string[] | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          faqs?: Json | null
          id?: string
          intro?: string | null
          is_published?: boolean
          language?: string
          meta_description?: string | null
          related_verses?: string[] | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          faqs?: Json | null
          id?: string
          intro?: string | null
          is_published?: boolean
          language?: string
          meta_description?: string | null
          related_verses?: string[] | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "service_series_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_team_members: {
        Row: {
          accepted_at: string | null
          availability: Json | null
          church_id: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          invited_at: string | null
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          availability?: Json | null
          church_id: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          availability?: Json | null
          church_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          invited_at?: string | null
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
          {
            foreignKeyName: "service_team_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
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
          {
            foreignKeyName: "service_templates_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          blocks: Json
          church_id: string
          class_name: string | null
          created_at: string
          created_by: string
          duration_minutes: number | null
          id: string
          learning_objectives: string[] | null
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
          class_name?: string | null
          created_at?: string
          created_by: string
          duration_minutes?: number | null
          id?: string
          learning_objectives?: string[] | null
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
          class_name?: string | null
          created_at?: string
          created_by?: string
          duration_minutes?: number | null
          id?: string
          learning_objectives?: string[] | null
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
            foreignKeyName: "services_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
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
      social_posts_log: {
        Row: {
          created_at: string
          date: string
          id: string
          platforms: string[] | null
          reference: string | null
          results: Json | null
          topic: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          platforms?: string[] | null
          reference?: string | null
          results?: Json | null
          topic?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          platforms?: string[] | null
          reference?: string | null
          results?: Json | null
          topic?: string | null
        }
        Relationships: []
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
      theology_chunks: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_type: Database["public"]["Enums"]["theology_source_type"]
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_type: Database["public"]["Enums"]["theology_source_type"]
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_type?: Database["public"]["Enums"]["theology_source_type"]
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verse_seo_content: {
        Row: {
          book: string
          chapter: number
          context: string | null
          created_at: string
          id: string
          is_featured: boolean
          language: string
          meta_description: string | null
          reference_slug: string
          reflection: string | null
          related_references: string[] | null
          related_topics: string[] | null
          title: string | null
          updated_at: string
          verse: number
          view_count: number
        }
        Insert: {
          book: string
          chapter: number
          context?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          language?: string
          meta_description?: string | null
          reference_slug: string
          reflection?: string | null
          related_references?: string[] | null
          related_topics?: string[] | null
          title?: string | null
          updated_at?: string
          verse: number
          view_count?: number
        }
        Update: {
          book?: string
          chapter?: number
          context?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          language?: string
          meta_description?: string | null
          reference_slug?: string
          reflection?: string | null
          related_references?: string[] | null
          related_topics?: string[] | null
          title?: string | null
          updated_at?: string
          verse?: number
          view_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      church_member_details: {
        Row: {
          church_id: string | null
          consent_contact: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          source_slug: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "church_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      church_partners_public: {
        Row: {
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          custom_bot_name: string | null
          denomination: string | null
          id: string | null
          is_active: boolean | null
          language: string | null
          logo_url: string | null
          name: string | null
          pastor_name: string | null
          pastor_photo_url: string | null
          plan_tier: Database["public"]["Enums"]["church_plan_tier"] | null
          primary_color: string | null
          secondary_color: string | null
          service_times: string | null
          slug: string | null
          telegram_group_link: string | null
          updated_at: string | null
          website: string | null
          welcome_message: string | null
        }
        Insert: {
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          custom_bot_name?: string | null
          denomination?: string | null
          id?: string | null
          is_active?: boolean | null
          language?: string | null
          logo_url?: string | null
          name?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"] | null
          primary_color?: string | null
          secondary_color?: string | null
          service_times?: string | null
          slug?: string | null
          telegram_group_link?: string | null
          updated_at?: string | null
          website?: string | null
          welcome_message?: string | null
        }
        Update: {
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          custom_bot_name?: string | null
          denomination?: string | null
          id?: string | null
          is_active?: boolean | null
          language?: string | null
          logo_url?: string | null
          name?: string | null
          pastor_name?: string | null
          pastor_photo_url?: string | null
          plan_tier?: Database["public"]["Enums"]["church_plan_tier"] | null
          primary_color?: string | null
          secondary_color?: string | null
          service_times?: string | null
          slug?: string | null
          telegram_group_link?: string | null
          updated_at?: string | null
          website?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
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
      get_my_church: {
        Args: never
        Returns: {
          city: string
          contact_email: string
          contact_person: string
          contact_phone: string
          country: string
          created_at: string
          custom_bot_name: string
          denomination: string
          id: string
          is_active: boolean
          language: string
          logo_url: string
          name: string
          pastor_name: string
          pastor_photo_url: string
          plan_tier: Database["public"]["Enums"]["church_plan_tier"]
          primary_color: string
          secondary_color: string
          service_times: string
          slug: string
          subscription_expires_at: string
          subscription_started_at: string
          subscription_status: string
          telegram_group_link: string
          updated_at: string
          website: string
          welcome_message: string
        }[]
      }
      get_my_team_churches: {
        Args: never
        Returns: {
          church_id: string
          role: string
        }[]
      }
      get_public_prayers: {
        Args: never
        Returns: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          prayer_count: number
        }[]
      }
      get_referral_partner_conversions: {
        Args: { p_code: string }
        Returns: {
          commission_amount: number
          created_at: string
          deal_value: number
        }[]
      }
      get_referral_partner_stats: {
        Args: { p_code: string }
        Returns: {
          code: string
          commission_rate: number
          is_active: boolean
          name: string
          total_clicks: number
          total_commission: number
          total_conversions: number
        }[]
      }
      get_registered_user_count: { Args: never; Returns: number }
      get_registered_users_list: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_shared_draft: {
        Args: { p_token: string }
        Returns: {
          ceremony_type: Database["public"]["Enums"]["ceremony_type"]
          created_at: string
          generated_text: string
          person_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_circle_prayer_count: {
        Args: { request_id: string }
        Returns: undefined
      }
      increment_golden_answer_use: {
        Args: { answer_id: string }
        Returns: undefined
      }
      increment_prayer_count: {
        Args: { request_id: string }
        Returns: undefined
      }
      is_church_owner: { Args: { _church_id: string }; Returns: boolean }
      is_church_team_member: { Args: { _church_id: string }; Returns: boolean }
      is_circle_member: {
        Args: { _circle_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_circle_by_invite_code: {
        Args: { _code: string }
        Returns: {
          id: string
          name: string
        }[]
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
      search_bible_verses:
        | {
            Args: {
              book_boost?: string[]
              result_limit?: number
              search_query: string
              translation_filter?: string
            }
            Returns: {
              book: string
              book_number: number
              chapter: number
              id: string
              rank: number
              text: string
              translation: string
              verse: number
            }[]
          }
        | {
            Args: {
              book_boost?: string[]
              language_filter?: string
              result_limit?: number
              search_query: string
              translation_filter?: string
            }
            Returns: {
              book: string
              book_number: number
              chapter: number
              id: string
              rank: number
              text: string
              translation: string
              verse: number
            }[]
          }
      search_golden_answers: {
        Args: {
          language_filter?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          answer: string
          id: string
          question: string
          similarity: number
          topic: string
        }[]
      }
      search_theology: {
        Args: {
          filter_source?: Database["public"]["Enums"]["theology_source_type"]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_type: Database["public"]["Enums"]["theology_source_type"]
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      ceremony_type: "funeral" | "wedding" | "baptism" | "confirmation"
      church_plan_tier: "free" | "community" | "gemeinde" | "kirche"
      confession_tradition:
        | "catholic"
        | "reformed"
        | "lutheran"
        | "evangelical"
        | "secular"
        | "interreligious"
      invoice_status: "draft" | "sent" | "paid"
      outreach_campaign_status: "active" | "paused" | "completed"
      outreach_email_status:
        | "pending"
        | "sent"
        | "opened"
        | "clicked"
        | "replied"
        | "bounced"
      outreach_lead_status:
        | "new"
        | "contacted"
        | "replied"
        | "booked"
        | "converted"
        | "unsubscribed"
      record_type: "baptism" | "wedding" | "funeral"
      resource_type:
        | "song"
        | "prayer"
        | "reading"
        | "liturgy"
        | "other"
        | "worksheet"
        | "video"
        | "image"
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
        | "lesson"
        | "double_lesson"
        | "project_day"
        | "confirmation_class"
      team_role:
        | "pastor"
        | "musician"
        | "lector"
        | "sacristan"
        | "technician"
        | "volunteer"
        | "other"
        | "co_teacher"
        | "student_assistant"
        | "mentor"
      theology_source_type: "lexikon" | "kommentar" | "konfession" | "seelsorge"
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
      app_role: ["admin", "moderator", "user"],
      ceremony_type: ["funeral", "wedding", "baptism", "confirmation"],
      church_plan_tier: ["free", "community", "gemeinde", "kirche"],
      confession_tradition: [
        "catholic",
        "reformed",
        "lutheran",
        "evangelical",
        "secular",
        "interreligious",
      ],
      invoice_status: ["draft", "sent", "paid"],
      outreach_campaign_status: ["active", "paused", "completed"],
      outreach_email_status: [
        "pending",
        "sent",
        "opened",
        "clicked",
        "replied",
        "bounced",
      ],
      outreach_lead_status: [
        "new",
        "contacted",
        "replied",
        "booked",
        "converted",
        "unsubscribed",
      ],
      record_type: ["baptism", "wedding", "funeral"],
      resource_type: [
        "song",
        "prayer",
        "reading",
        "liturgy",
        "other",
        "worksheet",
        "video",
        "image",
      ],
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
        "lesson",
        "double_lesson",
        "project_day",
        "confirmation_class",
      ],
      team_role: [
        "pastor",
        "musician",
        "lector",
        "sacristan",
        "technician",
        "volunteer",
        "other",
        "co_teacher",
        "student_assistant",
        "mentor",
      ],
      theology_source_type: ["lexikon", "kommentar", "konfession", "seelsorge"],
    },
  },
} as const

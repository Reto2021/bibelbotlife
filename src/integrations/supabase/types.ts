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
      bible_verses: {
        Row: {
          book: string
          book_number: number
          chapter: number
          created_at: string
          fts: unknown
          id: string
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
          text?: string
          translation?: string
          verse?: number
        }
        Relationships: []
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
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_interval: string | null
          billing_name: string | null
          billing_reference: string | null
          billing_street: string | null
          billing_zip: string | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          custom_bot_name: string | null
          denomination: string | null
          iban: string | null
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
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          telegram_group_link: string | null
          updated_at: string
          website: string | null
          welcome_message: string | null
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
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          custom_bot_name?: string | null
          denomination?: string | null
          iban?: string | null
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
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          telegram_group_link?: string | null
          updated_at?: string
          website?: string | null
          welcome_message?: string | null
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
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          custom_bot_name?: string | null
          denomination?: string | null
          iban?: string | null
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
        ]
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
          campaign_id: string
          church_name: string
          city: string | null
          contact_name: string | null
          created_at: string
          current_step: number
          denomination: string | null
          email: string
          id: string
          last_contacted_at: string | null
          personal_note: string | null
          scraped_data: Json | null
          source: string
          status: Database["public"]["Enums"]["outreach_lead_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          campaign_id: string
          church_name: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          current_step?: number
          denomination?: string | null
          email: string
          id?: string
          last_contacted_at?: string | null
          personal_note?: string | null
          scraped_data?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["outreach_lead_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          campaign_id?: string
          church_name?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          current_step?: number
          denomination?: string | null
          email?: string
          id?: string
          last_contacted_at?: string | null
          personal_note?: string | null
          scraped_data?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["outreach_lead_status"]
          updated_at?: string
          website?: string | null
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
      prayer_requests: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          prayer_count: number
          session_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          prayer_count?: number
          session_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          prayer_count?: number
          session_id?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          created_at: string
          id: string
          quiz_mode: string
          score: number
          session_id: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_mode?: string
          score?: number
          session_id: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          id?: string
          quiz_mode?: string
          score?: number
          session_id?: string
          total_questions?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_prayer_count: {
        Args: { request_id: string }
        Returns: undefined
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
      search_bible_verses: {
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
      app_role: ["admin", "moderator", "user"],
      ceremony_type: ["funeral", "wedding", "baptism", "confirmation"],
      church_plan_tier: ["free", "community", "gemeinde", "kirche"],
      confession_tradition: [
        "catholic",
        "reformed",
        "lutheran",
        "evangelical",
        "secular",
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

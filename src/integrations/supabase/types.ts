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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      account_flags: {
        Row: {
          action_taken: Database["public"]["Enums"]["flag_action_enum"]
          flag_reason: string
          flagged_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          action_taken?: Database["public"]["Enums"]["flag_action_enum"]
          flag_reason?: string
          flagged_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          action_taken?: Database["public"]["Enums"]["flag_action_enum"]
          flag_reason?: string
          flagged_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conduct_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_by: string
          reported_profile_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_by: string
          reported_profile_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
          reported_profile_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "conduct_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "marriage_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_consents: {
        Row: {
          consented_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          consented_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_consents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "interest_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          created_at: string
          id: string
          mosque_admin_id: string | null
          raised_by: string
          reason: string | null
          request_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["escalation_status_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          mosque_admin_id?: string | null
          raised_by: string
          reason?: string | null
          request_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["escalation_status_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          mosque_admin_id?: string | null
          raised_by?: string
          reason?: string | null
          request_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["escalation_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "escalations_mosque_admin_id_fkey"
            columns: ["mosque_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "interest_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_id: string
          requester_mosque_id: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status_enum"]
          target_id: string
          target_mosque_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          requester_mosque_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          target_id: string
          target_mosque_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          requester_mosque_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          target_id?: string
          target_mosque_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_requests_requester_mosque_id_fkey"
            columns: ["requester_mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_requests_target_mosque_id_fkey"
            columns: ["target_mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      marriage_profiles: {
        Row: {
          appearance_description: string | null
          area: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          education_level: string | null
          employment_status: string | null
          ethnicity: string | null
          expected_marriage_timeline: string | null
          family_origin: string | null
          family_values: string | null
          height_cm: number | null
          household_background: string | null
          id: string
          languages_spoken: string[] | null
          marital_status: string | null
          nationality: string | null
          personal_bio: string | null
          preferred_spouse_criteria: string | null
          privacy_settings: Json
          profession: string | null
          rejection_reason: string | null
          religious_practice_level: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sect_or_school_of_thought: string | null
          status: Database["public"]["Enums"]["profile_status_enum"]
          updated_at: string
          user_id: string
          willingness_to_relocate: boolean | null
        }
        Insert: {
          appearance_description?: string | null
          area?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          education_level?: string | null
          employment_status?: string | null
          ethnicity?: string | null
          expected_marriage_timeline?: string | null
          family_origin?: string | null
          family_values?: string | null
          height_cm?: number | null
          household_background?: string | null
          id?: string
          languages_spoken?: string[] | null
          marital_status?: string | null
          nationality?: string | null
          personal_bio?: string | null
          preferred_spouse_criteria?: string | null
          privacy_settings?: Json
          profession?: string | null
          rejection_reason?: string | null
          religious_practice_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sect_or_school_of_thought?: string | null
          status?: Database["public"]["Enums"]["profile_status_enum"]
          updated_at?: string
          user_id: string
          willingness_to_relocate?: boolean | null
        }
        Update: {
          appearance_description?: string | null
          area?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          education_level?: string | null
          employment_status?: string | null
          ethnicity?: string | null
          expected_marriage_timeline?: string | null
          family_origin?: string | null
          family_values?: string | null
          height_cm?: number | null
          household_background?: string | null
          id?: string
          languages_spoken?: string[] | null
          marital_status?: string | null
          nationality?: string | null
          personal_bio?: string | null
          preferred_spouse_criteria?: string | null
          privacy_settings?: Json
          profession?: string | null
          rejection_reason?: string | null
          religious_practice_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sect_or_school_of_thought?: string | null
          status?: Database["public"]["Enums"]["profile_status_enum"]
          updated_at?: string
          user_id?: string
          willingness_to_relocate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marriage_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriage_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_feedback: {
        Row: {
          feedback_notes: string | null
          feedback_outcome: Database["public"]["Enums"]["feedback_outcome_enum"]
          id: string
          request_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          feedback_notes?: string | null
          feedback_outcome: Database["public"]["Enums"]["feedback_outcome_enum"]
          id?: string
          request_id: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          feedback_notes?: string | null
          feedback_outcome?: Database["public"]["Enums"]["feedback_outcome_enum"]
          id?: string
          request_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "interest_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_admin_mosques: {
        Row: {
          admin_id: string
          assigned_by: string | null
          created_at: string
          id: string
          mosque_id: string
        }
        Insert: {
          admin_id: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          mosque_id: string
        }
        Update: {
          admin_id?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          mosque_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_admin_mosques_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_admin_mosques_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_admin_mosques_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_affiliation_requests: {
        Row: {
          created_at: string
          id: string
          mosque_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["affiliation_status_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mosque_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["affiliation_status_enum"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mosque_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["affiliation_status_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_affiliation_requests_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_affiliation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_affiliation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mosques: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["mosque_status_enum"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["mosque_status_enum"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["mosque_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosques_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          related_request_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_request_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_request_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "interest_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          button_active_bg_color: string
          button_bg_color: string
          button_hover_bg_color: string
          button_text_color: string
          dark_mode_default: boolean
          error_color: string
          id: number
          inactivity_threshold_days: number
          logo_url: string | null
          platform_name: string
          primary_color: string
          secondary_color: string
          success_color: string
          updated_at: string
          updated_by: string | null
          warning_color: string
        }
        Insert: {
          button_active_bg_color?: string
          button_bg_color?: string
          button_hover_bg_color?: string
          button_text_color?: string
          dark_mode_default?: boolean
          error_color?: string
          id?: number
          inactivity_threshold_days?: number
          logo_url?: string | null
          platform_name?: string
          primary_color?: string
          secondary_color?: string
          success_color?: string
          updated_at?: string
          updated_by?: string | null
          warning_color?: string
        }
        Update: {
          button_active_bg_color?: string
          button_bg_color?: string
          button_hover_bg_color?: string
          button_text_color?: string
          dark_mode_default?: boolean
          error_color?: string
          id?: number
          inactivity_threshold_days?: number
          logo_url?: string | null
          platform_name?: string
          primary_color?: string
          secondary_color?: string
          success_color?: string
          updated_at?: string
          updated_by?: string | null
          warning_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          id: string
          is_primary: boolean
          photo_url: string
          profile_id: string
          uploaded_at: string
          visibility: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          photo_url: string
          profile_id: string
          uploaded_at?: string
          visibility?: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          photo_url?: string
          profile_id?: string
          uploaded_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "marriage_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          created_at: string
          email: string
          gender: string | null
          id: string
          last_login_at: string | null
          mosque_id: string | null
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          updated_at: string
          verification_method: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          created_at?: string
          email: string
          gender?: string | null
          id: string
          last_login_at?: string | null
          mosque_id?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          updated_at?: string
          verification_method?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          last_login_at?: string | null
          mosque_id?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          updated_at?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      wali_details: {
        Row: {
          approval_preferences: string | null
          contact_email: string | null
          contact_phone: string | null
          id: string
          name: string | null
          profile_id: string
          relationship: string | null
        }
        Insert: {
          approval_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          name?: string | null
          profile_id: string
          relationship?: string | null
        }
        Update: {
          approval_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          name?: string | null
          profile_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wali_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "marriage_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      browse_profiles: {
        Args: {
          p_city?: string
          p_country?: string
          p_education?: string
          p_family_keyword?: string
          p_languages?: string[]
          p_limit?: number
          p_marital?: string
          p_max_age?: number
          p_min_age?: number
          p_mosque?: string
          p_nationality?: string
          p_offset?: number
          p_practice?: string
          p_profession?: string
          p_profile_id?: string
          p_relocate?: boolean
        }
        Returns: {
          age: number
          appearance_description: string
          area: string
          city: string
          country: string
          display_name: string
          education_level: string
          employment_status: string
          ethnicity: string
          expected_marriage_timeline: string
          family_origin: string
          family_values: string
          has_hidden_photo: boolean
          height_cm: number
          household_background: string
          id: string
          languages_spoken: string[]
          marital_status: string
          mosque_id: string
          mosque_name: string
          nationality: string
          personal_bio: string
          photo_url: string
          preferred_spouse_criteria: string
          profession: string
          religious_practice_level: string
          sect_or_school_of_thought: string
          total_count: number
          willingness_to_relocate: boolean
        }[]
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_match_contact_state: {
        Args: { p_request_id: string }
        Returns: {
          both_consented: boolean
          my_consent: boolean
          my_email: string
          my_name: string
          my_phone: string
          their_consent: boolean
          their_email: string
          their_name: string
          their_phone: string
        }[]
      }
      has_active_match: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_my_interest_requests: {
        Args: never
        Returns: {
          counterpart_age: number
          counterpart_city: string
          counterpart_country: string
          counterpart_mosque_name: string
          counterpart_name: string
          counterpart_profile_id: string
          created_at: string
          direction: string
          id: string
          message: string
          responded_at: string
          status: Database["public"]["Enums"]["request_status_enum"]
        }[]
      }
      my_mosque_ids: { Args: never; Returns: string[] }
      privacy_visible: { Args: { k: string; ps: Json }; Returns: boolean }
      respond_to_interest_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Database["public"]["Enums"]["request_status_enum"]
      }
      send_interest_request: {
        Args: { p_message?: string; p_profile_id: string }
        Returns: string
      }
    }
    Enums: {
      account_status_enum: "active" | "suspended" | "deactivated" | "flagged"
      affiliation_status_enum: "pending" | "approved" | "rejected"
      escalation_status_enum: "open" | "resolved"
      feedback_outcome_enum: "mutual_agreement" | "declined"
      flag_action_enum: "none" | "suspended" | "dismissed"
      mosque_status_enum: "pending" | "active" | "suspended"
      profile_status_enum:
        | "draft"
        | "submitted"
        | "mosque_verified"
        | "approved"
        | "rejected"
        | "inactive"
      report_status_enum: "pending" | "reviewed" | "dismissed" | "action_taken"
      request_status_enum:
        | "submitted"
        | "active_match"
        | "awaiting_feedback_female"
        | "awaiting_feedback_male"
        | "closed_mutual"
        | "closed_declined"
        | "cancelled"
      user_role: "male_user" | "female_user" | "mosque_admin" | "super_admin"
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
      account_status_enum: ["active", "suspended", "deactivated", "flagged"],
      affiliation_status_enum: ["pending", "approved", "rejected"],
      escalation_status_enum: ["open", "resolved"],
      feedback_outcome_enum: ["mutual_agreement", "declined"],
      flag_action_enum: ["none", "suspended", "dismissed"],
      mosque_status_enum: ["pending", "active", "suspended"],
      profile_status_enum: [
        "draft",
        "submitted",
        "mosque_verified",
        "approved",
        "rejected",
        "inactive",
      ],
      report_status_enum: ["pending", "reviewed", "dismissed", "action_taken"],
      request_status_enum: [
        "submitted",
        "active_match",
        "awaiting_feedback_female",
        "awaiting_feedback_male",
        "closed_mutual",
        "closed_declined",
        "cancelled",
      ],
      user_role: ["male_user", "female_user", "mosque_admin", "super_admin"],
    },
  },
} as const

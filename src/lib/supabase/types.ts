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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          request_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          request_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      client_milestones: {
        Row: {
          client_done: boolean
          client_id: string
          created_at: string | null
          delay_note: string | null
          description: string | null
          id: string
          needs_client: boolean
          request_id: string | null
          sort: number
          status: string
          title: string
          track: string
          week: number
        }
        Insert: {
          client_done?: boolean
          client_id: string
          created_at?: string | null
          delay_note?: string | null
          description?: string | null
          id?: string
          needs_client?: boolean
          request_id?: string | null
          sort?: number
          status?: string
          title: string
          track: string
          week: number
        }
        Update: {
          client_done?: boolean
          client_id?: string
          created_at?: string | null
          delay_note?: string | null
          description?: string | null
          id?: string
          needs_client?: boolean
          request_id?: string | null
          sort?: number
          status?: string
          title?: string
          track?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_milestones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_milestones_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      client_team: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_lead: boolean
          profile_id: string
          role_label: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_lead?: boolean
          profile_id: string
          role_label?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_lead?: boolean
          profile_id?: string
          role_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_team_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_team_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          kind: string
          mime_type: string | null
          sort: number
          status_label: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          sort?: number
          status_label?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          sort?: number
          status_label?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accent_color: string | null
          created_at: string
          deal_terms: string | null
          designer_id: string | null
          engagement_started_at: string | null
          id: string
          is_active: boolean
          locale: string
          logo_url: string | null
          name: string
          retainer_amount: number | null
          slug: string
          studio_note: string | null
          studio_note_updated_at: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          deal_terms?: string | null
          designer_id?: string | null
          engagement_started_at?: string | null
          id?: string
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          retainer_amount?: number | null
          slug: string
          studio_note?: string | null
          studio_note_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          deal_terms?: string | null
          designer_id?: string | null
          engagement_started_at?: string | null
          id?: string
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          retainer_amount?: number | null
          slug?: string
          studio_note?: string | null
          studio_note_updated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_type: string | null
          author_id: string
          body: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          author_id: string
          body: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_events: {
        Row: {
          comment: string | null
          created_at: string
          deliverable_id: string | null
          event_type: string
          id: string
          social_post_id: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deliverable_id?: string | null
          event_type: string
          id?: string
          social_post_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          deliverable_id?: string | null
          event_type?: string
          id?: string
          social_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_events_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_events_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          direction_description: string | null
          direction_label: string | null
          direction_order: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_hidden: boolean
          is_recommended: boolean
          mime_type: string | null
          request_id: string
          tags: string[]
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          direction_description?: string | null
          direction_label?: string | null
          direction_order?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_hidden?: boolean
          is_recommended?: boolean
          mime_type?: string | null
          request_id: string
          tags?: string[]
          uploaded_by: string
        }
        Update: {
          created_at?: string
          direction_description?: string | null
          direction_label?: string | null
          direction_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_hidden?: boolean
          is_recommended?: boolean
          mime_type?: string | null
          request_id?: string
          tags?: string[]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_emails: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "invited_emails_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          request_id: string | null
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          request_id?: string | null
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          request_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string
          email: string | null
          first_login_at: string | null
          full_name: string | null
          id: string
          is_owner: boolean
          locale: string
          role: Database["public"]["Enums"]["user_role"]
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          id: string
          is_owner?: boolean
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          is_owner?: boolean
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_images: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          request_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_images_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assignee_id: string | null
          client_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_archived: boolean
          priority: number
          reused_from_request_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
          voting_mode: string | null
        }
        Insert: {
          assignee_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean
          priority?: number
          reused_from_request_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          voting_mode?: string | null
        }
        Update: {
          assignee_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean
          priority?: number
          reused_from_request_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          voting_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_reused_from_request_id_fkey"
            columns: ["reused_from_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          cover_slide_idx: number
          created_at: string
          created_by: string | null
          direction_description: string | null
          direction_label: string | null
          direction_order: number | null
          id: string
          ig_caption: string | null
          ig_handle: string | null
          is_hidden: boolean
          is_recommended: boolean
          published_at: string | null
          request_id: string
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          cover_slide_idx?: number
          created_at?: string
          created_by?: string | null
          direction_description?: string | null
          direction_label?: string | null
          direction_order?: number | null
          id?: string
          ig_caption?: string | null
          ig_handle?: string | null
          is_hidden?: boolean
          is_recommended?: boolean
          published_at?: string | null
          request_id: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          cover_slide_idx?: number
          created_at?: string
          created_by?: string | null
          direction_description?: string | null
          direction_label?: string | null
          direction_order?: number | null
          id?: string
          ig_caption?: string | null
          ig_handle?: string | null
          is_hidden?: boolean
          is_recommended?: boolean
          published_at?: string | null
          request_id?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      social_slides: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_path: string | null
          post_id: string
          slide_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          post_id: string
          slide_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          post_id?: string
          slide_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_slides_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_invite: { Args: never; Returns: boolean }
      current_user_client_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      request_status: "queued" | "in_progress" | "review" | "done"
      request_type:
        | "logo"
        | "social"
        | "web"
        | "brand"
        | "presentation"
        | "other"
      user_role: "client" | "admin"
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
      request_status: ["queued", "in_progress", "review", "done"],
      request_type: ["logo", "social", "web", "brand", "presentation", "other"],
      user_role: ["client", "admin"],
    },
  },
} as const

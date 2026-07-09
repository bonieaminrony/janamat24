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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_banner_clicks: {
        Row: {
          banner_id: string
          clicked_at: string
          id: string
          news_id: string | null
          placement_type: string
          session_id: string
        }
        Insert: {
          banner_id: string
          clicked_at?: string
          id?: string
          news_id?: string | null
          placement_type: string
          session_id: string
        }
        Update: {
          banner_id?: string
          clicked_at?: string
          id?: string
          news_id?: string | null
          placement_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_banner_clicks_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "ad_banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_banner_clicks_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_banners: {
        Row: {
          ad_type: string | null
          alt_text: string | null
          company_logo: string | null
          created_at: string
          id: string
          image_url: string
          image_url_2: string | null
          image_url_3: string | null
          is_active: boolean
          link_url: string | null
          link_url_2: string | null
          link_url_3: string | null
          partner_id: string
          placement_type: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          ad_type?: string | null
          alt_text?: string | null
          company_logo?: string | null
          created_at?: string
          id?: string
          image_url: string
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          link_url?: string | null
          link_url_2?: string | null
          link_url_3?: string | null
          partner_id: string
          placement_type: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          ad_type?: string | null
          alt_text?: string | null
          company_logo?: string | null
          created_at?: string
          id?: string
          image_url?: string
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          link_url?: string | null
          link_url_2?: string | null
          link_url_3?: string | null
          partner_id?: string
          placement_type?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_banners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "ad_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          ip_hash: string
          reason: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          ip_hash: string
          reason: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          ip_hash?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          ip_hash: string
          news_id: string
          parent_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          ip_hash: string
          news_id: string
          parent_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          ip_hash?: string
          news_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          kicker: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["news_status"] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          kicker?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["news_status"] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          kicker?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["news_status"] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ad_partners: {
        Row: {
          created_at: string
          id: string
          news_id: string
          partner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          partner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_ad_partners_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_ad_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "ad_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      news_views: {
        Row: {
          id: string
          news_id: string
          session_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          news_id: string
          session_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          session_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_views_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          facebook_url: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          twitter_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reporter_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          changed_at: string
          changed_by: string
          changed_by_name: string | null
          id: string
          new_role: string
          old_role: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          changed_by_name?: string | null
          id?: string
          new_role: string
          old_role?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          changed_by_name?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
          user_id?: string
          user_name?: string | null
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
      comments_public: {
        Row: {
          content: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          news_id: string | null
          parent_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          news_id?: string | null
          parent_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          news_id?: string | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_user_has_admin_role: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_news_views: {
        Args: { p_news_id: string; p_session_id?: string }
        Returns: undefined
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor"
      news_status: "draft" | "published"
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
      app_role: ["admin", "editor"],
      news_status: ["draft", "published"],
    },
  },
} as const

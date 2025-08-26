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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          note: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          note: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          chain: string | null
          client_id: string | null
          created_at: string | null
          creator_id: string | null
          delivered_at: string | null
          id: string
          payment_address: string | null
          release_at: string | null
          service_id: string | null
          status: string | null
          tx_hash: string | null
          updated_at: string | null
          usdc_amount: number
        }
        Insert: {
          accepted_at?: string | null
          chain?: string | null
          client_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivered_at?: string | null
          id?: string
          payment_address?: string | null
          release_at?: string | null
          service_id?: string | null
          status?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          usdc_amount: number
        }
        Update: {
          accepted_at?: string | null
          chain?: string | null
          client_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivered_at?: string | null
          id?: string
          payment_address?: string | null
          release_at?: string | null
          service_id?: string | null
          status?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          usdc_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          category: string | null
          created_at: string | null
          headline: string | null
          id: string
          intro_video_url: string | null
          payout_address_bsc: string | null
          payout_address_cardano: string | null
          payout_address_eth: string | null
          payout_address_sol: string | null
          payout_address_sui: string | null
          priority_score: number | null
          rating: number | null
          review_count: number | null
          tier: string | null
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          category?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          intro_video_url?: string | null
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_eth?: string | null
          payout_address_sol?: string | null
          payout_address_sui?: string | null
          priority_score?: number | null
          rating?: number | null
          review_count?: number | null
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          category?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          intro_video_url?: string | null
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_eth?: string | null
          payout_address_sol?: string | null
          payout_address_sui?: string | null
          priority_score?: number | null
          rating?: number | null
          review_count?: number | null
          tier?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          opened_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          opened_by: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          opened_by?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string
          booking_id: string | null
          created_at: string | null
          from_user_id: string | null
          id: string
          to_user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          body: string
          booking_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          to_user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string
          booking_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_wallet_address: string
          amount: number
          booking_id: string | null
          created_at: string | null
          creator_id: string | null
          currency: string
          id: string
          network: string
          payment_type: string
          service_id: string | null
          status: string | null
          tx_hash: string
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_wallet_address: string
          amount: number
          booking_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency: string
          id?: string
          network: string
          payment_type: string
          service_id?: string | null
          status?: string | null
          tx_hash: string
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_wallet_address?: string
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string
          id?: string
          network?: string
          payment_type?: string
          service_id?: string | null
          status?: string | null
          tx_hash?: string
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          features: Json
          id: string
          price_usdc: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          features?: Json
          id?: string
          price_usdc?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          price_usdc?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewee_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          creator_id: string | null
          delivery_days: number | null
          description: string | null
          id: string
          payment_method: string | null
          price_usdc: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          payment_method?: string | null
          price_usdc?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          payment_method?: string | null
          price_usdc?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart: {
        Row: {
          added_at: string | null
          creator_id: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          creator_id: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          creator_id?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_shopping_cart_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shopping_cart_service"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          handle: string | null
          id: string
          payout_address_bsc: string | null
          payout_address_cardano: string | null
          payout_address_sui: string | null
          portfolio_url: string | null
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          role: string | null
          social_links: Json | null
          updated_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id: string
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_sui?: string | null
          portfolio_url?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id?: string
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_sui?: string | null
          portfolio_url?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// Fix the Payment interface to match actual query structure
export interface Payment {
  id: string;
  user_id: string;
  creator_id: string;
  service_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  network: string;
  payment_type: string;
  status: string;
  tx_hash: string;
  admin_wallet_address: string;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  verified_by: string | null;
  // Nested relations matching actual query
  users: {
    handle: string;
    email: string;
  };
  creators: {
    users: {
      handle: string;
      email: string;
    };
  };
  services: {
    title: string;
    price_usdc: number;
  };
}

// Fix the Service interface to match actual query structure  
export interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method: string;
  active: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  creators: {
    id: string;
    user_id: string;
    headline: string;
    tier: string;
    rating: number;
    review_count: number;
    users: {
      handle: string;
      avatar_url: string;
    };
  };
}

// Keep existing interfaces
export interface DisputeWithRelations {
  id: string;
  booking_id: string;
  opened_by: string;
  reason: string;
  status: string;
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  bookings: Booking;
}

export interface Booking {
  id: string;
  client_id: string;
  creator_id: string;
  service_id: string;
  status: string;
  usdc_amount: number;
  chain: string;
  tx_hash: string;
  created_at: string;
  delivered_at: string | null;
  accepted_at: string | null;
  release_at: string | null;
  services: {
    title: string;
  };
  client: {
    handle: string;
    email: string;
  };
  creator: {
    users: {
      handle: string;
      email: string;
    };
  };
}

export interface JobPosting {
  id: string;
  title: string;
  role_overview: string;
  responsibilities: string[];
  qualifications: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_posting_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  social_links: Record<string, string> | null;
  cover_letter: string;
  status: string;
  created_at: string;
  job_postings?: {
    title: string;
  };
}

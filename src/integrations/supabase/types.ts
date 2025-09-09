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
          proof_file_url: string | null
          proof_link: string | null
          proof_links: Json | null
          release_at: string | null
          service_id: string | null
          status: string | null
          tx_hash: string | null
          updated_at: string | null
          usdc_amount: number
          work_started_at: string | null
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
          proof_file_url?: string | null
          proof_link?: string | null
          proof_links?: Json | null
          release_at?: string | null
          service_id?: string | null
          status?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          usdc_amount: number
          work_started_at?: string | null
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
          proof_file_url?: string | null
          proof_link?: string | null
          proof_links?: Json | null
          release_at?: string | null
          service_id?: string | null
          status?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          usdc_amount?: number
          work_started_at?: string | null
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
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          label: string
          sort_order: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label: string
          sort_order?: number | null
          updated_at?: string | null
          value: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
          refund_tx_hash: string | null
          refunded_at: string | null
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
          refund_tx_hash?: string | null
          refunded_at?: string | null
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
          refund_tx_hash?: string | null
          refunded_at?: string | null
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
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          email: string
          github_url: string | null
          id: string
          job_posting_id: string | null
          name: string
          phone: string | null
          portfolio_url: string | null
          resume_url: string | null
          social_links: Json | null
          status: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          email: string
          github_url?: string | null
          id?: string
          job_posting_id?: string | null
          name: string
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          social_links?: Json | null
          status?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          email?: string
          github_url?: string | null
          id?: string
          job_posting_id?: string | null
          name?: string
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          social_links?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          active: boolean
          created_at: string
          id: string
          qualifications: Json
          responsibilities: Json
          role_overview: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          qualifications?: Json
          responsibilities?: Json
          role_overview: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          qualifications?: Json
          responsibilities?: Json
          role_overview?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          dispute_id: string | null
          id: string
          message: string
          payment_id: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          dispute_id?: string | null
          id?: string
          message: string
          payment_id?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          dispute_id?: string | null
          id?: string
          message?: string
          payment_id?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
          paid_out_at: string | null
          paid_out_by: string | null
          payment_type: string
          payout_status: string | null
          payout_tx_hash: string | null
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
          paid_out_at?: string | null
          paid_out_by?: string | null
          payment_type: string
          payout_status?: string | null
          payout_tx_hash?: string | null
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
          paid_out_at?: string | null
          paid_out_by?: string | null
          payment_type?: string
          payout_status?: string | null
          payout_tx_hash?: string | null
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
      platform_wallets: {
        Row: {
          active: boolean
          color_class: string | null
          created_at: string
          explorer_url: string | null
          icon_url: string | null
          id: string
          name: string
          network: string
          updated_at: string
          updated_by: string | null
          wallet_address: string
        }
        Insert: {
          active?: boolean
          color_class?: string | null
          created_at?: string
          explorer_url?: string | null
          icon_url?: string | null
          id?: string
          name: string
          network: string
          updated_at?: string
          updated_by?: string | null
          wallet_address: string
        }
        Update: {
          active?: boolean
          color_class?: string | null
          created_at?: string
          explorer_url?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          network?: string
          updated_at?: string
          updated_by?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          active: boolean
          created_at: string
          description: string
          display_name: string
          features: Json
          id: string
          price_usdc: number
          service_limit: number | null
          tier_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          display_name: string
          features?: Json
          id?: string
          price_usdc?: number
          service_limit?: number | null
          tier_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          display_name?: string
          features?: Json
          id?: string
          price_usdc?: number
          service_limit?: number | null
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_credits_awarded: {
        Row: {
          awarded_at: string
          booking_id: string
          credit_amount: number
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          awarded_at?: string
          booking_id: string
          credit_amount?: number
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          awarded_at?: string
          booking_id?: string
          credit_amount?: number
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_awarded_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_awarded_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_awarded_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          availability_type: string
          category: string | null
          created_at: string | null
          creator_id: string | null
          delivery_days: number | null
          description: string | null
          id: string
          payment_method: string | null
          price_usdc: number | null
          target_username: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          availability_type?: string
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          payment_method?: string | null
          price_usdc?: number | null
          target_username?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          availability_type?: string
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          payment_method?: string | null
          price_usdc?: number | null
          target_username?: string | null
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
      user_follows: {
        Row: {
          created_at: string
          followed_user_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_user_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_user_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          banned: boolean | null
          bio: string | null
          created_at: string | null
          email: string | null
          handle: string | null
          id: string
          payout_address_bsc: string | null
          payout_address_cardano: string | null
          payout_address_eth: string | null
          payout_address_sol: string | null
          payout_address_sui: string | null
          portfolio_url: string | null
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          role: string | null
          social_links: Json | null
          updated_at: string | null
          verification_links: Json | null
          verified: boolean
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id: string
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_eth?: string | null
          payout_address_sol?: string | null
          payout_address_sui?: string | null
          portfolio_url?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          verification_links?: Json | null
          verified?: boolean
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string | null
          id?: string
          payout_address_bsc?: string | null
          payout_address_cardano?: string | null
          payout_address_eth?: string | null
          payout_address_sol?: string | null
          payout_address_sui?: string | null
          portfolio_url?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          verification_links?: Json | null
          verified?: boolean
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
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_booking_id?: string
          p_dispute_id?: string
          p_message: string
          p_payment_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_creators: {
        Args: { approved_only?: boolean }
        Returns: {
          avatar_url: string
          bio: string
          category: string
          created_at: string
          handle: string
          headline: string
          id: string
          rating: number
          review_count: number
          tier: string
          user_id: string
          verified: boolean
        }[]
      }
      get_public_profile: {
        Args: { user_id_param: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          handle: string
          id: string
          verified: boolean
        }[]
      }
      get_public_profile_by_handle: {
        Args: { handle_param: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          handle: string
          id: string
          verified: boolean
        }[]
      }
      submit_job_application: {
        Args: {
          application_email: string
          application_name: string
          application_phone: string
          cover_letter_param: string
          github_url_param: string
          job_posting_id_param: string
          portfolio_url_param: string
          resume_url_param: string
          social_links_param?: Json
        }
        Returns: string
      }
      validate_username_restrictions: {
        Args: { username_input: string }
        Returns: boolean
      }
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

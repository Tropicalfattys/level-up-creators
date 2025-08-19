
// Temporary type definitions until Supabase types regenerate
export interface Dispute {
  id: string;
  booking_id: string;
  opened_by: 'client' | 'creator';
  reason: string;
  status: 'open' | 'resolved' | 'refunded' | 'released';
  resolution_note?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  creator_id: string;
  service_id: string;
  usdc_amount: number;
  status: 'draft' | 'paid' | 'in_progress' | 'delivered' | 'accepted' | 'disputed' | 'refunded' | 'released' | 'canceled';
  chain?: string;
  tx_hash?: string;
  payment_address?: string;
  deliverable_url?: string;
  platform_fee?: number;
  creator_amount?: number;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  price_usdc?: number;
  delivery_days?: number;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Creator {
  id: string;
  user_id: string;
  approved: boolean;
  approved_at?: string;
  headline?: string;
  tier: 'basic' | 'mid' | 'pro';
  priority_score: number;
  intro_video_url?: string;
  category?: string;
  rating: number;
  review_count: number;
  payout_address_eth?: string;
  payout_address_sol?: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  role: string;
  handle?: string;
  avatar_url?: string;
  bio?: string;
  referral_code?: string;
  referral_credits: number;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  attachments?: any;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  target_table?: string;
  target_id?: string;
  metadata?: any;
  created_at: string;
}

export interface DisputeWithRelations extends Dispute {
  bookings: Booking & {
    services: Service;
    client: User;
    creator: User;
  };
  resolved_by_user?: User;
}

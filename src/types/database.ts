
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
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  price_usdc?: number;
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
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  role: string;
  handle?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  referral_code?: string;
  referral_credits: number;
}

export interface DisputeWithRelations extends Dispute {
  bookings: Booking & {
    services: Service;
    client: User;
    creator: User;
  };
  resolved_by_user?: User;
}

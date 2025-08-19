
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface AnalyticsMetrics {
  totalEarnings: number;
  totalBookings: number;
  avgRating: number;
  activeServices: number;
  completionRate: number;
}

export interface MonthlyEarning {
  month: string;
  earnings: number;
}

export interface ServicePopularity {
  service: string;
  bookings: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface DailyActivity {
  date: string;
  bookings: number;
  earnings: number;
}

// Simple interfaces to break type inference
interface ServiceRow {
  id: string;
  title: string;
  price_usdc: number | null;
}

interface BookingRow {
  id: string;
  service_id: string;
  status: string;
  usdc_amount: number | null;
  created_at: string;
}

interface ReviewRow {
  rating: number;
}

export const fetchAnalyticsMetrics = async (userId: string): Promise<AnalyticsMetrics> => {
  // Fetch services with explicit typing
  const servicesResponse = await supabase
    .from('services')
    .select('id, title, price_usdc')
    .eq('creator_id', userId);

  const services = (servicesResponse.data || []) as ServiceRow[];
  const serviceIds = services.map(s => s.id);

  let bookings: BookingRow[] = [];
  if (serviceIds.length > 0) {
    const bookingsResponse = await supabase
      .from('bookings')
      .select('id, service_id, status, usdc_amount, created_at')
      .in('service_id', serviceIds);
    bookings = (bookingsResponse.data || []) as BookingRow[];
  }

  let reviews: ReviewRow[] = [];
  if (serviceIds.length > 0) {
    const reviewsResponse = await supabase
      .from('reviews')
      .select('rating')
      .in('service_id', serviceIds);
    reviews = (reviewsResponse.data || []) as ReviewRow[];
  }

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.usdc_amount) || 0), 0);
  const totalBookings = bookings.length;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const activeServices = services.length;
  const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;

  return {
    totalEarnings,
    totalBookings,
    avgRating,
    activeServices,
    completionRate
  };
};

export const fetchMonthlyEarnings = async (userId: string): Promise<MonthlyEarning[]> => {
  const servicesResponse = await supabase
    .from('services')
    .select('id')
    .eq('creator_id', userId);

  const services = (servicesResponse.data || []) as { id: string }[];
  const serviceIds = services.map(s => s.id);

  if (serviceIds.length === 0) return [];

  const bookingsResponse = await supabase
    .from('bookings')
    .select('usdc_amount, created_at, status')
    .in('service_id', serviceIds)
    .eq('status', 'completed');

  const completedBookings = (bookingsResponse.data || []) as BookingRow[];

  const monthlyEarnings = [];
  for (let i = 5; i >= 0; i--) {
    const date = subDays(new Date(), i * 30);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });
    
    const earnings = monthBookings.reduce((sum, b) => sum + (Number(b.usdc_amount) || 0), 0);
    
    monthlyEarnings.push({
      month: format(date, 'MMM yyyy'),
      earnings
    });
  }

  return monthlyEarnings;
};

export const fetchServicePopularity = async (userId: string): Promise<ServicePopularity[]> => {
  const servicesResponse = await supabase
    .from('services')
    .select('id, title')
    .eq('creator_id', userId);

  const services = (servicesResponse.data || []) as ServiceRow[];

  if (!services.length) return [];

  const serviceIds = services.map(s => s.id);
  
  const bookingsResponse = await supabase
    .from('bookings')
    .select('service_id')
    .in('service_id', serviceIds);

  const bookings = (bookingsResponse.data || []) as { service_id: string }[];

  return services.map(service => {
    const serviceBookings = bookings.filter(b => b.service_id === service.id).length;
    return {
      service: service.title.length > 20 ? service.title.substring(0, 20) + '...' : service.title,
      bookings: serviceBookings
    };
  }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
};

export const fetchRatingDistribution = async (userId: string): Promise<RatingDistribution[]> => {
  const servicesResponse = await supabase
    .from('services')
    .select('id')
    .eq('creator_id', userId);

  const services = (servicesResponse.data || []) as { id: string }[];
  const serviceIds = services.map(s => s.id);

  if (serviceIds.length === 0) {
    return [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 }
    ];
  }

  const reviewsResponse = await supabase
    .from('reviews')
    .select('rating')
    .in('service_id', serviceIds);

  const reviews = (reviewsResponse.data || []) as ReviewRow[];

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  reviews.forEach(review => {
    const rating = Math.floor(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });

  return Object.entries(ratingCounts).map(([rating, count]) => ({
    rating: parseInt(rating),
    count
  }));
};

export const fetchDailyActivity = async (userId: string): Promise<DailyActivity[]> => {
  const servicesResponse = await supabase
    .from('services')
    .select('id')
    .eq('creator_id', userId);

  const services = (servicesResponse.data || []) as { id: string }[];
  const serviceIds = services.map(s => s.id);

  if (serviceIds.length === 0) {
    return Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'MMM dd'),
      bookings: 0,
      earnings: 0
    }));
  }

  const bookingsResponse = await supabase
    .from('bookings')
    .select('created_at, status, usdc_amount')
    .in('service_id', serviceIds);

  const bookings = (bookingsResponse.data || []) as BookingRow[];

  const recentActivity = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_at);
      return format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    
    const dayEarnings = dayBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.usdc_amount) || 0), 0);
    
    recentActivity.push({
      date: format(date, 'MMM dd'),
      bookings: dayBookings.length,
      earnings: dayEarnings
    });
  }

  return recentActivity;
};

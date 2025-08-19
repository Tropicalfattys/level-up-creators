
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface AnalyticsData {
  totalEarnings: number;
  totalBookings: number;
  avgRating: number;
  activeServices: number;
  completionRate: number;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
  servicePopularity: Array<{ service: string; bookings: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  recentActivity: Array<{ date: string; bookings: number; earnings: number }>;
}

export const fetchCreatorServices = async (userId: string) => {
  const { data, error } = await supabase
    .from('services')
    .select('id, title, price_usdc')
    .eq('creator_id', userId);

  if (error) throw error;
  return data || [];
};

export const fetchCreatorBookings = async (serviceIds: string[]) => {
  if (serviceIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('service_id', serviceIds);

  if (error) throw error;
  return data || [];
};

export const fetchCreatorReviews = async (serviceIds: string[]) => {
  if (serviceIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('reviews')
    .select('rating, created_at')
    .in('service_id', serviceIds);

  if (error) throw error;
  return data || [];
};

export const calculateMonthlyEarnings = (bookings: any[]) => {
  const monthlyEarnings = [];
  for (let i = 5; i >= 0; i--) {
    const date = subDays(new Date(), i * 30);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_at);
      return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'completed';
    });
    
    const earnings = monthBookings.reduce((sum, b) => sum + (b.usdc_amount || 0), 0);
    
    monthlyEarnings.push({
      month: format(date, 'MMM yyyy'),
      earnings
    });
  }
  return monthlyEarnings;
};

export const calculateServicePopularity = (services: any[], bookings: any[]) => {
  return services.map(service => {
    const serviceBookings = bookings.filter(b => b.service_id === service.id).length;
    return {
      service: service.title.length > 20 ? service.title.substring(0, 20) + '...' : service.title,
      bookings: serviceBookings
    };
  }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
};

export const calculateRatingDistribution = (reviews: any[]) => {
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingCounts[Math.floor(review.rating) as keyof typeof ratingCounts]++;
  });
  
  return Object.entries(ratingCounts).map(([rating, count]) => ({
    rating: parseInt(rating),
    count
  }));
};

export const calculateRecentActivity = (bookings: any[]) => {
  const recentActivity = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_at);
      return format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    
    const dayEarnings = dayBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.usdc_amount || 0), 0);
    
    recentActivity.push({
      date: format(date, 'MMM dd'),
      bookings: dayBookings.length,
      earnings: dayEarnings
    });
  }
  return recentActivity;
};

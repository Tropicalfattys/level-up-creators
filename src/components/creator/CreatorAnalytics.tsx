
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { AnalyticsOverview } from './AnalyticsOverview';
import { AnalyticsCharts } from './AnalyticsCharts';
import {
  fetchAnalyticsMetrics,
  fetchMonthlyEarnings,
  fetchServicePopularity,
  fetchRatingDistribution,
  fetchDailyActivity
} from '@/services/analyticsService';

export const CreatorAnalytics = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['creator-analytics-metrics', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchAnalyticsMetrics(user.id);
    },
    enabled: !!user?.id
  });

  const { data: monthlyEarnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['monthly-earnings', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchMonthlyEarnings(user.id);
    },
    enabled: !!user?.id
  });

  const { data: servicePopularity, isLoading: servicesLoading } = useQuery({
    queryKey: ['service-popularity', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchServicePopularity(user.id);
    },
    enabled: !!user?.id
  });

  const { data: ratingDistribution, isLoading: ratingsLoading } = useQuery({
    queryKey: ['rating-distribution', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchRatingDistribution(user.id);
    },
    enabled: !!user?.id
  });

  const { data: dailyActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['daily-activity', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchDailyActivity(user.id);
    },
    enabled: !!user?.id
  });

  const isLoading = metricsLoading || earningsLoading || servicesLoading || ratingsLoading || activityLoading;

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!metrics || !monthlyEarnings || !servicePopularity || !ratingDistribution || !dailyActivity) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <AnalyticsOverview metrics={metrics} />
      <AnalyticsCharts
        monthlyEarnings={monthlyEarnings}
        servicePopularity={servicePopularity}
        ratingDistribution={ratingDistribution}
        dailyActivity={dailyActivity}
      />
    </div>
  );
};

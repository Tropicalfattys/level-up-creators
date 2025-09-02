import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityItem {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  service_title: string;
  role: 'client' | 'creator';
  other_party_handle: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'paid':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delivered':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'accepted':
    case 'released':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'disputed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function RecentActivity() {
  const { user } = useAuth();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          client_id,
          creator_id,
          services!inner(
            title,
            creator_id
          ),
          client:users!bookings_client_id_fkey(handle),
          creator:users!bookings_creator_id_fkey(handle)
        `)
        .or(`client_id.eq.${user.id},creator_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching recent activity:', error);
        throw error;
      }

      return data?.map((booking): RecentActivityItem => ({
        id: booking.id,
        status: booking.status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        service_title: booking.services?.title || 'Unknown Service',
        role: booking.client_id === user.id ? 'client' : 'creator',
        other_party_handle: booking.client_id === user.id 
          ? (booking.creator?.handle || 'Unknown Creator')
          : (booking.client?.handle || 'Unknown Client')
      })) || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-muted-foreground text-sm">
        Unable to load recent activity
      </p>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No recent activity to show
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {activity.service_title}
            </div>
            <div className="text-xs text-muted-foreground">
              {activity.role === 'client' ? (
                <>You booked from {activity.other_party_handle}</>
              ) : (
                <>{activity.other_party_handle} booked your service</>
              )}
              {' • '}
              {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true })}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor(activity.status)}`}
          >
            {activity.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
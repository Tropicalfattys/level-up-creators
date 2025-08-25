import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, Hash, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { BookingChat } from '@/components/messaging/BookingChat';
import { ProjectStatusCard } from './ProjectStatusCard';

interface BookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  tx_hash?: string;
  proof_link?: string;
  proof_file_url?: string;
  services: {
    title: string;
  } | null;
  creator: {
    id: string;
    handle: string;
    avatar_url?: string;
  } | null;
}

export const ClientBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          creator:users!bookings_creator_id_fkey (id, handle, avatar_url)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString(),
        ...(status === 'accepted' && { accepted_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      const statusText = status === 'accepted' ? 'accepted' : 'disputed';
      toast.success(`Booking ${statusText} successfully!`);
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast.error('Failed to update booking status');
    }
  });

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'secondary';
      case 'delivered': return 'outline';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const getTabCounts = () => {
    if (!bookings) return { all: 0, paid: 0, in_progress: 0, delivered: 0 };
    return {
      all: bookings.length,
      paid: bookings.filter(b => b.status === 'paid').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      delivered: bookings.filter(b => b.status === 'delivered').length,
    };
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your bookings...</div>;
  }

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
        <p className="text-muted-foreground">
          Track your orders and communicate with creators
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="paid">New ({tabCounts.paid})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({tabCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({tabCounts.delivered})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filterBookings(activeTab).map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.services?.title || 'Service'}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3" />
                      Creator: @{booking.creator?.handle || 'Unknown'}
                    </CardDescription>
                    {booking.tx_hash && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono text-xs">
                          TX: {booking.tx_hash.slice(0, 8)}...{booking.tx_hash.slice(-6)}
                        </span>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyTxHash(booking.tx_hash!)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </CardDescription>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                    <p className="font-semibold mt-1">
                      <DollarSign className="h-3 w-3 inline mr-1" />
                      {booking.usdc_amount} USDC
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Status Card */}
                <ProjectStatusCard
                  booking={booking}
                  onAccept={() => updateBookingStatus.mutate({ 
                    bookingId: booking.id, 
                    status: 'accepted' 
                  })}
                  onDispute={() => updateBookingStatus.mutate({ 
                    bookingId: booking.id, 
                    status: 'disputed' 
                  })}
                  isLoading={updateBookingStatus.isPending}
                />

                {/* Chat Component */}
                {booking.creator && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-medium">Chat with @{booking.creator.handle}</h4>
                      <span className="text-sm text-muted-foreground">Discuss your project requirements</span>
                    </div>
                    <BookingChat
                      bookingId={booking.id}
                      otherUserId={booking.creator.id}
                      otherUserHandle={booking.creator.handle}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ordered {format(new Date(booking.created_at), 'MMM d, yyyy')}
                    </div>
                    {booking.delivered_at && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    <Link to={`/chat/${booking.id}`}>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Full Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filterBookings(activeTab).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No bookings in this category yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

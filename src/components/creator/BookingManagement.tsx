import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BookingChat } from '@/components/messaging/BookingChat';
import { ProofSubmission } from '@/components/creator/ProofSubmission';
import { EscrowManager } from '@/components/escrow/EscrowManager';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';
import { toast } from 'sonner';

interface BookingWithDetails {
  id: string;
  client_id: string;
  creator_id: string;
  service_id: string;
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
  client: {
    id: string;
    handle: string;
    avatar_url?: string;
  } | null;
}

export const BookingManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const submitProofMutation = useMutation({
    mutationFn: async ({ bookingId, proofData }: { bookingId: string; proofData: any }) => {
      // Handle file upload if there's a file
      let proofFileUrl = null;
      if (proofData.file) {
        const fileExt = proofData.file.name.split('.').pop();
        const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('deliverables')
          .upload(fileName, proofData.file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('deliverables')
          .getPublicUrl(uploadData.path);
        
        proofFileUrl = urlData.publicUrl;
      }

      // Update booking with proof
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          proof_links: proofData.links,
          proof_file_url: proofFileUrl,
          proof_notes: proofData.notes
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Proof submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
    },
    onError: (error) => {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit proof. Please try again.');
    }
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['creator-bookings', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          client:users!bookings_client_id_fkey (id, handle, avatar_url)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator bookings:', error);
        return [];
      }
      return data as BookingWithDetails[];
    },
    enabled: !!user?.id
  });

  const getTabCounts = () => {
    if (!bookings) return { all: 0, paid: 0, in_progress: 0, delivered: 0, completed: 0 };
    
    return {
      all: bookings.length,
      paid: bookings.filter(b => b.status === 'paid').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      delivered: bookings.filter(b => b.status === 'delivered').length,
      completed: bookings.filter(b => b.status === 'accepted' || b.status === 'released').length,
    };
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'in_progress': return 'secondary';
      case 'delivered': return 'outline';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const handleTabChange = (value: string) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;
    setActiveTab(value);
    // Restore scroll position after state update
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  // Helper function to check if booking is completed and can be reviewed
  const canReview = (booking: any) => {
    return ['accepted', 'released', 'refunded'].includes(booking.status);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
        <p className="text-muted-foreground">
          Manage your service bookings and communicate with clients
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="paid">New Orders ({tabCounts.paid})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({tabCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({tabCounts.delivered})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tabCounts.completed})</TabsTrigger>
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
                      Client: @{booking.client?.handle || 'Unknown'}
                    </CardDescription>
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
                {/* Status Information */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Project Status</h4>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Current Status:</span> {booking.status.replace('_', ' ')}
                    </p>
                    {booking.status === 'paid' && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          New Order - please start working on the project
                        </p>
                      </div>
                    )}
                    {(booking.status === 'accepted' || booking.status === 'released') && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-800">
                          Project completed successfully
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof Submission */}
                {booking.status === 'in_progress' && (
                  <ProofSubmission 
                    bookingId={booking.id}
                    currentProof={{
                      links: booking.proof_links,
                      fileUrl: booking.proof_file_url
                    }}
                    onSubmitProof={(proofData) => 
                      submitProofMutation.mutate({ bookingId: booking.id, proofData })
                    }
                    isSubmitting={submitProofMutation.isPending}
                  />
                )}

                {/* Escrow Manager - Only show for delivered bookings */}
                {booking.status === 'delivered' && (
                  <EscrowManager bookingId={booking.id} isClient={false} />
                )}

                {/* Reviews Section - Show when booking is completed */}
                {canReview(booking) && booking.client && (
                  <div className="border rounded-lg p-4 bg-green-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <h4 className="font-medium">Rate Your Client</h4>
                    </div>
                    <ReviewSystem
                      bookingId={booking.id}
                      revieweeId={booking.client.id}
                      canReview={true}
                    />
                  </div>
                )}

                {/* Chat Component */}
                {booking.client && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-medium">Chat with @{booking.client.handle}</h4>
                    </div>
                    <BookingChat
                      bookingId={booking.id}
                      otherUserId={booking.client.id}
                      otherUserHandle={booking.client.handle}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                    </div>
                    {booking.delivered_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                      </div>
                    )}
                  </div>
                  <Link to={`/chat/${booking.id}`}>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Full Chat
                    </Button>
                  </Link>
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

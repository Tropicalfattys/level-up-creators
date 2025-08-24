
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, Upload, DollarSign, User, CheckCircle, ExternalLink, Hash, Copy, Play, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { BookingChat } from '@/components/messaging/BookingChat';
import { ProofSubmission } from './ProofSubmission';

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
  client: {
    id: string;
    handle: string;
    avatar_url?: string;
  } | null;
}

export const BookingManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

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
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status, deliveredAt, proofLink, proofFileUrl }: { 
      bookingId: string; 
      status: string; 
      deliveredAt?: string;
      proofLink?: string;
      proofFileUrl?: string;
    }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (deliveredAt) {
        updateData.delivered_at = deliveredAt;
      }
      if (proofLink) {
        updateData.proof_link = proofLink;
      }
      if (proofFileUrl) {
        updateData.proof_file_url = proofFileUrl;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
      const statusText = status === 'in_progress' ? 'started' : 
                        status === 'delivered' ? 'delivered' : 'updated';
      toast.success(`Booking ${statusText} successfully!`);
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast.error('Failed to update booking status');
    }
  });

  const handleFileUpload = async (bookingId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('deliverables')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('deliverables')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleProofSubmission = async (bookingId: string, proofData: { link: string; file: File | null; notes: string }) => {
    let proofFileUrl = null;

    if (proofData.file) {
      try {
        proofFileUrl = await handleFileUpload(bookingId, proofData.file);
      } catch (error) {
        toast.error('Failed to upload file');
        return;
      }
    }

    updateBookingStatus.mutate({
      bookingId,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      proofLink: proofData.link || null,
      proofFileUrl
    });
  };

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'default';
      case 'delivered': return 'secondary';
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
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
        <p className="text-muted-foreground">
          Manage your active bookings and deliverables
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
                      Client: @{booking.client?.handle || 'Unknown'}
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
                {/* Project Actions Section */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Project Actions
                    </h4>
                  </div>

                  {/* Action Buttons and Content */}
                  <div className="space-y-4">
                    {/* Status-specific buttons and content */}
                    {booking.status === 'paid' && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Ready to start work on this project
                        </div>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => updateBookingStatus.mutate({ 
                            bookingId: booking.id, 
                            status: 'in_progress' 
                          })}
                          disabled={updateBookingStatus.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start Work
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === 'in_progress' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-600 font-medium">
                            Project in progress - Add proof links below to mark as delivered
                          </div>
                        </div>
                        
                        {/* Proof Submission Form */}
                        <ProofSubmission
                          bookingId={booking.id}
                          currentProof={{
                            link: booking.proof_link,
                            fileUrl: booking.proof_file_url
                          }}
                          onSubmitProof={(proofData) => handleProofSubmission(booking.id, proofData)}
                          isSubmitting={updateBookingStatus.isPending}
                        />
                      </div>
                    )}
                    
                    {booking.status === 'delivered' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-orange-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Work delivered - Waiting for client review
                          </div>
                        </div>
                        
                        {/* Display submitted proof */}
                        {(booking.proof_link || booking.proof_file_url) && (
                          <div className="p-3 bg-background rounded border">
                            <p className="text-sm font-medium mb-2">Submitted Proof:</p>
                            {booking.proof_link && (
                              <div className="flex items-center gap-2 mb-1">
                                <ExternalLink className="h-3 w-3" />
                                <a href={booking.proof_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  View Proof Link
                                </a>
                              </div>
                            )}
                            {booking.proof_file_url && (
                              <div className="flex items-center gap-2">
                                <Upload className="h-3 w-3" />
                                <a href={booking.proof_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  View Proof File
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(booking.status === 'accepted' || booking.status === 'released') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Project completed successfully
                          </div>
                        </div>
                        
                        {/* Display final proof links */}
                        {(booking.proof_link || booking.proof_file_url) && (
                          <div className="p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-sm font-medium mb-2 text-green-800">Final Deliverables:</p>
                            {booking.proof_link && (
                              <div className="flex items-center gap-2 mb-1">
                                <ExternalLink className="h-3 w-3 text-green-600" />
                                <a href={booking.proof_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  View Proof Link
                                </a>
                              </div>
                            )}
                            {booking.proof_file_url && (
                              <div className="flex items-center gap-2">
                                <Upload className="h-3 w-3 text-green-600" />
                                <a href={booking.proof_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  View Proof File
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Component */}
                {booking.client && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-medium">Chat with @{booking.client.handle}</h4>
                      <span className="text-sm text-muted-foreground">Discuss project details and deliverables</span>
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
                        <Upload className="h-3 w-3" />
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

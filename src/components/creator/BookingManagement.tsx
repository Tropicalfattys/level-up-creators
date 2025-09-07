import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MessageSquare, Upload, DollarSign, User, CheckCircle, ExternalLink, Hash, Copy, Play, Package, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LazyBookingChat } from '@/components/messaging/LazyBookingChat';
import { ProofSubmission } from './ProofSubmission';
import { LazyReviewSystem } from '@/components/reviews/LazyReviewSystem';
import { PaymentBreakdown } from '@/components/payments/PaymentBreakdown';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  proof_links?: Array<{ url: string; label: string }>;
  work_started_at?: string;
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

  const handleTabChange = (value: string) => {
    // Lock scroll position during tab change
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    setActiveTab(value);
    
    // Restore scroll position after content loads
    setTimeout(() => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, 0); // Always scroll to top for tabs
    }, 100);
  };

  const { data: bookings, isLoading, error: bookingsError } = useQuery({
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
        throw error;
      }
      
      return (data || []).map(booking => ({
        ...booking,
        proof_links: Array.isArray(booking.proof_links) 
          ? booking.proof_links.map((link: any) => ({
              url: typeof link === 'string' ? link : link.url || '',
              label: typeof link === 'string' ? 'Link' : link.label || 'Link'
            }))
          : []
      })) as BookingWithDetails[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5 uses gcTime instead of cacheTime)
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    retry: 1 // Reduce retries to 1 instead of 3
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status, deliveredAt, proofLinks, proofFileUrl, workStartedAt }: { 
      bookingId: string; 
      status: string; 
      deliveredAt?: string;
      proofLinks?: Array<{ url: string; label: string }>;
      proofFileUrl?: string;
      workStartedAt?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Starting booking update for:', bookingId, 'new status:', status);

      const updateData: any = { 
        updated_at: new Date().toISOString() 
      };
      
      // Only update status if it's a valid database status
      if (status && status !== 'work_started') {
        updateData.status = status;
      }
      
      if (deliveredAt) {
        updateData.delivered_at = deliveredAt;
        const releaseDate = new Date(deliveredAt);
        releaseDate.setDate(releaseDate.getDate() + 3);
        updateData.release_at = releaseDate.toISOString();
      }
      if (proofLinks && proofLinks.length > 0) {
        updateData.proof_links = proofLinks;
      }
      if (proofFileUrl) {
        updateData.proof_file_url = proofFileUrl;
      }
      if (workStartedAt) {
        // Add work_started_at timestamp but keep status as 'paid'
        updateData.work_started_at = workStartedAt;
      }

      console.log('Update data prepared:', updateData);

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('creator_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update booking: ${error.message}`);
      }

      if (!data) {
        throw new Error('No booking was updated. Please check if you have permission to modify this booking.');
      }

      console.log('Booking updated successfully:', data);
      return data;
    },
    onMutate: async ({ bookingId, status, workStartedAt }) => {
      // Optimistic update for work_started status
      if (status === 'work_started' && workStartedAt) {
        console.log('Applying optimistic update for work started');
        
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['creator-bookings'] });
        
        // Snapshot the previous value
        const previousBookings = queryClient.getQueryData(['creator-bookings', user?.id]);
        
        // Optimistically update to the new value
        queryClient.setQueryData(['creator-bookings', user?.id], (old: BookingWithDetails[] | undefined) => {
          if (!old) return old;
          
          return old.map(booking => 
            booking.id === bookingId 
              ? { ...booking, work_started_at: workStartedAt }
              : booking
          );
        });
        
        // Return a context object with the snapshotted value
        return { previousBookings };
      }
    },
    onError: (error: any, variables, context) => {
      console.error('Update booking mutation error:', error);
      
      // Rollback optimistic update on error
      if (context?.previousBookings) {
        queryClient.setQueryData(['creator-bookings', user?.id], context.previousBookings);
      }
      
      let errorMessage = 'Failed to update project status';
      if (error?.message?.includes('not authenticated')) {
        errorMessage = 'Please log in to continue';
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'You do not have permission to update this booking';
      } else if (error?.message?.includes('not found')) {
        errorMessage = 'Booking not found or you do not have access to it';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
    onSuccess: (data, { status }) => {
      console.log('Booking update success, invalidating queries');
      
      // Immediately invalidate queries without delay
      queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-details', data.id] });
      
      const statusText = status === 'work_started' ? 'Work started' : 
                        status === 'delivered' ? 'delivered' : 'updated';
      toast.success(`Project ${statusText} successfully!`);
    }
  });

  const handleFileUpload = async (bookingId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size);
      
      const { data, error } = await supabase.storage
        .from('deliverables')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('deliverables')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      console.log('Signed URL created:', signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  };

  const handleProofSubmission = async (bookingId: string, proofData: { links: Array<{ url: string; label: string }>; files: File[]; notes: string }) => {
    try {
      let proofFileUrl = null;
      const fileUrls: string[] = [];

      // Upload all files
      for (const file of proofData.files) {
        const fileUrl = await handleFileUpload(bookingId, file);
        fileUrls.push(fileUrl);
      }

      // Store all file URLs as comma-separated string for multiple file support
      if (fileUrls.length > 0) {
        proofFileUrl = fileUrls.join(',');
      }

      await updateBookingStatus.mutateAsync({
        bookingId,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        proofLinks: proofData.links,
        proofFileUrl
      });
    } catch (error) {
      console.error('Proof submission failed:', error);
      toast.error('Failed to submit proof of work');
    }
  };

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'payment_rejected': return 'destructive';
      case 'delivered': return 'outline';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusProgress = (status: string, workStarted: boolean = false) => {
    // 4-step process: paid -> (work started) -> delivered -> accepted -> released
    if (status === 'pending' || status === 'payment_rejected') return 0;
    if (status === 'paid') return workStarted ? 2 : 1;
    if (status === 'delivered') return 3;
    if (status === 'accepted') return 4;
    if (status === 'released') return 4;
    return 0;
  };

  const getTabCounts = () => {
    if (!bookings) return { all: 0, new: 0, active: 0, completed: 0 };
    
    const safeBookings = bookings as BookingWithDetails[];
    
    return {
      all: safeBookings.length,
      new: safeBookings.filter(b => b.status === 'pending' || b.status === 'payment_rejected' || (b.status === 'paid' && !b.work_started_at)).length,
      active: safeBookings.filter(b => (b.status === 'paid' && b.work_started_at) || b.status === 'delivered').length,
      completed: safeBookings.filter(b => b.status === 'accepted' || b.status === 'released').length,
    };
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    
    const safeBookings = bookings as BookingWithDetails[];
    if (status === 'all') return safeBookings;
    
    if (status === 'new') {
      return safeBookings.filter(booking => booking.status === 'pending' || booking.status === 'payment_rejected' || (booking.status === 'paid' && !booking.work_started_at));
    }
    if (status === 'active') {
      return safeBookings.filter(booking => (booking.status === 'paid' && booking.work_started_at) || booking.status === 'delivered');
    }
    if (status === 'completed') {
      return safeBookings.filter(booking => booking.status === 'accepted' || booking.status === 'released');
    }
    
    return safeBookings.filter(booking => booking.status === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" style={{ minHeight: '500px' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
          <p className="text-muted-foreground">
            Manage your active bookings and deliverables
          </p>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load bookings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['creator-bookings'] })}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  const tabCounts = getTabCounts();

  return (
    <TooltipProvider>
      <div className="space-y-6" style={{ scrollBehavior: 'auto' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
          <p className="text-muted-foreground">
            Manage your active bookings and deliverables
          </p>
        </div>

        {updateBookingStatus.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error updating the booking. Please try again or refresh the page.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4" style={{ scrollBehavior: 'auto' }}>
          <TabsList>
            <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
            <TabsTrigger value="new">New ({tabCounts.new})</TabsTrigger>
            <TabsTrigger value="active">Active ({tabCounts.active})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({tabCounts.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filterBookings(activeTab).map((booking) => {
              const isWorkStarted = !!booking.work_started_at;
              const currentProgress = getStatusProgress(booking.status, isWorkStarted);
              
              console.log(`Booking ${booking.id}: status=${booking.status}, work_started_at=${booking.work_started_at}, isWorkStarted=${isWorkStarted}`);
              
              return (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {booking.services?.title || 'Service'}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-red-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-md p-0">
                              <ScrollArea className="h-96 w-full">
                                <div className="p-4 text-sm space-y-3">
                                  <div className="font-semibold text-base">📌 How the Start Work Process Works</div>
                                  
                                  <div>
                                    <div className="font-medium mb-1">1. Payment Verification</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• Each new booking shows a status: Pending or Paid.</div>
                                      <div>• Work cannot begin until the booking is marked Paid. Our escrow team verifies funds before approving.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">2. Starting Work</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• Once the booking is marked Paid, click Start Work to begin.</div>
                                      <div>• You and the client can use the dedicated chat window to discuss details and exchange files (e.g., logos, reference materials).</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">3. Submitting Proof</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• You must provide at least one form of proof, link and or file upload.</div>
                                      <div>• Proof may include:</div>
                                      <div>• Verified links (e.g., Twitter posts, YouTube videos, blog articles).</div>
                                      <div>• File uploads (images, short videos, documents, etc.).</div>
                                      <div>• Additional files may also be shared in the chat window for full transparency.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">4. Client Review Stage</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• After you submit proof, the client may either:</div>
                                      <div>• Accept Work → Funds are released within 72 hours (85% to you, 15% to the platform).</div>
                                      <div>• File a Dispute → Both parties can provide evidence via chat. Admins review and make a final decision.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">5. Reviews</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• Once the transaction is complete, both you and the client may leave a star rating (1–5) and written review.</div>
                                      <div>• Reviews become part of your public profile.</div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2 mt-3">
                                    <div className="font-medium text-orange-600 mb-1">⚠️ Important:</div>
                                    <div className="text-xs">Keep all communication and file transfers within the platform. This ensures proper dispute resolution if needed. Off-platform agreements are not protected by escrow.</div>
                                  </div>

                                  <div className="border-t pt-2 mt-3">
                                    <div className="font-medium text-orange-600 mb-1">⚠️ Platform Safety Notice</div>
                                    <div className="text-xs space-y-1">
                                      <div>This chat and file-sharing feature is provided solely for professional collaboration related to booked services. All communications and uploaded files are monitored and recorded for quality assurance and dispute resolution.</div>
                                      <div>• Misuse of this feature—including harassment, threats, bullying, spamming, solicitation, or sharing of prohibited content—will result in immediate suspension or permanent removal from the platform.</div>
                                      <div>• In cases of suspected fraud, malicious activity, or violation of applicable laws, relevant information may be disclosed to law enforcement upon request or in response to a valid warrant.</div>
                                      <div>• Users are reminded to keep all interactions respectful, professional, and limited to project-related communication. Video calling is not supported.</div>
                                      <div className="mt-2 font-medium">By using this feature, you agree to conduct yourself professionally and acknowledge that violations of these terms may result in loss of platform access.</div>
                                    </div>
                                  </div>
                                </div>
                              </ScrollArea>
                            </TooltipContent>
                          </Tooltip>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          Client: 
                          {booking.client?.handle ? (
                            <Link 
                              to={`/profile/${booking.client.handle}`}
                              className="text-primary hover:underline"
                            >
                              @{booking.client.handle}
                            </Link>
                          ) : (
                            <span>Unknown</span>
                          )}
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
                          {booking.status === 'paid' && isWorkStarted ? 'Work Started' : booking.status.replace('_', ' ')}
                        </Badge>
                        <p className="font-semibold mt-1">
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          {booking.usdc_amount} USDC
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <PaymentBreakdown 
                        amount={booking.usdc_amount} 
                        showTitle={true}
                      />
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Project Actions
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${
                                  step <= currentProgress 
                                    ? 'bg-primary' 
                                    : 'bg-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-background rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium capitalize">
                              Current Status: {booking.status === 'paid' && isWorkStarted ? 'Work Started' : booking.status.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(booking.status === 'pending' || (booking.status === 'paid' && !isWorkStarted)) && 'Ready to start work'}
                              {(booking.status === 'paid' && isWorkStarted) && 'Work in progress - submit proof when done'}
                              {booking.status === 'delivered' && 'Awaiting client review'}
                              {booking.status === 'accepted' && 'Project completed successfully'}
                              {booking.status === 'released' && 'Payment released'}
                            </p>
                          </div>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(booking.status === 'pending' || (booking.status === 'paid' && !isWorkStarted)) && (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Click to start working on this project:</p>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                console.log('Starting work on booking:', booking.id);
                                updateBookingStatus.mutate({ 
                                  bookingId: booking.id, 
                                  status: 'work_started',
                                  workStartedAt: new Date().toISOString()
                                });
                              }}
                              disabled={updateBookingStatus.isPending}
                              className="w-full"
                            >
                              <Play className="h-3 w-3 mr-2" />
                              {updateBookingStatus.isPending ? 'Starting...' : 'Start Work'}
                              <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                          </div>
                        )}
                        
                        {(booking.status === 'paid' && isWorkStarted) && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                              <div>
                                <p className="text-sm font-medium text-blue-800">Work In Progress</p>
                                <p className="text-xs text-blue-600">Submit proof of work to mark as delivered</p>
                              </div>
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                            
                            <ProofSubmission
                              bookingId={booking.id}
                              currentProof={{
                                link: booking.proof_link,
                                fileUrl: booking.proof_file_url,
                                links: booking.proof_links
                              }}
                              onSubmitProof={(proofData) => handleProofSubmission(booking.id, proofData)}
                              isSubmitting={updateBookingStatus.isPending}
                            />
                          </div>
                        )}
                        
                        {booking.status === 'delivered' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-200">
                              <div>
                                <p className="text-sm font-medium text-orange-800">Work Delivered</p>
                                <p className="text-xs text-orange-600">Waiting for client review and acceptance</p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-orange-600" />
                            </div>
                            
                            {(booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
                              <div className="p-3 bg-background rounded border">
                                <p className="text-sm font-medium mb-2">Submitted Proof:</p>
                                <div className="space-y-2">
                                  {booking.proof_links?.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <ExternalLink className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs text-muted-foreground font-medium">{link.label}:</span>
                                      <a 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline text-sm truncate"
                                      >
                                        {link.url}
                                      </a>
                                    </div>
                                  ))}
                                  
                                  {booking.proof_link && !booking.proof_links?.length && (
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="h-3 w-3 text-blue-600" />
                                      <a 
                                        href={booking.proof_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        View Social Proof Link
                                      </a>
                                    </div>
                                  )}
                                  
                                  {booking.proof_file_url && (
                                    <div className="space-y-2">
                                      {booking.proof_file_url.split(',').map((fileUrl, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <Upload className="h-3 w-3 text-blue-600" />
                                          <a 
                                            href={fileUrl.trim()} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:underline text-sm"
                                          >
                                            View File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {(booking.status === 'accepted' || booking.status === 'released') && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                              <div>
                                <p className="text-sm font-medium text-green-800">Project Completed</p>
                                <p className="text-xs text-green-600">
                                  {booking.status === 'accepted' ? 'Client accepted delivery' : 'Payment released'}
                                </p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            
                            {(booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
                              <div className="p-3 bg-green-50 rounded border border-green-200">
                                <p className="text-sm font-medium mb-2 text-green-800">Final Deliverables:</p>
                                <div className="space-y-2">
                                  {booking.proof_links?.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <ExternalLink className="h-3 w-3 text-green-600" />
                                      <span className="text-xs text-green-700 font-medium">{link.label}:</span>
                                      <a 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline text-sm truncate"
                                      >
                                        {link.url}
                                      </a>
                                    </div>
                                  ))}
                                  
                                  {booking.proof_link && !booking.proof_links?.length && (
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="h-3 w-3 text-green-600" />
                                      <a 
                                        href={booking.proof_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        View Social Proof Link
                                      </a>
                                    </div>
                                  )}
                                  
                                  {booking.proof_file_url && (
                                    <div className="space-y-2">
                                      {booking.proof_file_url.split(',').map((fileUrl, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <Upload className="h-3 w-3 text-green-600" />
                                          <a 
                                            href={fileUrl.trim()} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:underline text-sm"
                                          >
                                            View File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review System - FIXED: Now includes 'refunded' status */}
                    {(booking.status === 'accepted' || booking.status === 'released' || booking.status === 'refunded') && booking.client && (
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="font-medium mb-3">Rate your client experience</h4>
                        <LazyReviewSystem
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
                          <h4 className="font-medium">
                            Chat with{' '}
                            {booking.client.handle ? (
                              <Link 
                                to={`/profile/${booking.client.handle}`}
                                className="text-primary hover:underline"
                              >
                                @{booking.client.handle}
                              </Link>
                            ) : (
                              <span>@{booking.client.handle || 'Unknown'}</span>
                            )}
                          </h4>
                          <span className="text-sm text-muted-foreground">Discuss project details and deliverables</span>
                        </div>
                        <LazyBookingChat
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
                        {booking.work_started_at && (
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Started {format(new Date(booking.work_started_at), 'MMM d')}
                          </div>
                        )}
                        {booking.delivered_at && (
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

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
    </TooltipProvider>
  );
};

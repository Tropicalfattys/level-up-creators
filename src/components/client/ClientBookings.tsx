import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MessageSquare, DollarSign, User, ExternalLink, Hash, Copy, CheckCircle, AlertCircle, HelpCircle, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LazyBookingChat } from '@/components/messaging/LazyBookingChat';
import { EscrowManager } from '@/components/escrow/EscrowManager';
import { LazyReviewSystem } from '@/components/reviews/LazyReviewSystem';
import { RetryPaymentModal } from '@/components/payments/RetryPaymentModal';

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
  deliveryNote?: string;
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
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('all');
  const [retryPaymentBookingId, setRetryPaymentBookingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
      
      // Convert the data and handle the proof_links JSON field properly
      const bookingsWithDetails = await Promise.all((data || []).map(async booking => {
        let deliveryNote = '';
        
        // Fetch delivery message if booking is delivered or completed
        if (['delivered', 'accepted', 'released'].includes(booking.status)) {
          const { data: deliveryMessage } = await supabase
            .from('messages')
            .select('body')
            .eq('booking_id', booking.id)
            .eq('from_user_id', booking.creator_id)
            .ilike('body', 'Delivery completed:%')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (deliveryMessage?.body) {
            const noteMatch = deliveryMessage.body.match(/Delivery completed:\s*(.*)/s);
            if (noteMatch && noteMatch[1]) {
              const note = noteMatch[1].trim();
              if (note && note !== 'Files delivered') {
                deliveryNote = note;
              }
            }
          }
        }

        return {
          ...booking,
          deliveryNote,
          proof_links: Array.isArray(booking.proof_links) 
            ? booking.proof_links.map((link: any) => ({
                url: typeof link === 'string' ? link : link.url || '',
                label: typeof link === 'string' ? 'Link' : link.label || 'Link'
              }))
            : []
        };
      }));
      
      return bookingsWithDetails as BookingWithDetails[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5 uses gcTime instead of cacheTime)
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    retry: 1 // Reduce retries
  });

  const getTabCounts = () => {
    if (!bookings) return { all: 0, active: 0, delivered: 0, completed: 0 };
    
    const safeBookings = bookings as BookingWithDetails[];
    
    return {
      all: safeBookings.length,
      active: safeBookings.filter(b => b.status === 'pending' || b.status === 'paid' || b.status === 'payment_rejected').length,
      delivered: safeBookings.filter(b => b.status === 'delivered').length,
      completed: safeBookings.filter(b => b.status === 'accepted' || b.status === 'released').length,
    };
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    
    const safeBookings = bookings as BookingWithDetails[];
    if (status === 'all') return safeBookings;
    
    if (status === 'active') {
      return safeBookings.filter(booking => booking.status === 'pending' || booking.status === 'paid' || booking.status === 'payment_rejected');
    }
    if (status === 'delivered') {
      return safeBookings.filter(booking => booking.status === 'delivered');
    }
    if (status === 'completed') {
      return safeBookings.filter(booking => booking.status === 'accepted' || booking.status === 'released');
    }
    
    return safeBookings.filter(booking => booking.status === status);
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

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-6" style={{ minHeight: '500px' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
          <p className="text-muted-foreground">
            Track your service bookings and communicate with creators
          </p>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading bookings...</span>
        </div>
      </div>
    );
  }

  const tabCounts = getTabCounts();

  return (
    <div>
      <div className="space-y-6" style={{ scrollBehavior: 'auto' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
          <p className="text-muted-foreground">
            Track your service bookings and communicate with creators
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:underline">
                How it works
              </span>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[80vh] p-0">
              <DialogHeader className="p-4 pb-2">
                <DialogTitle className="text-base">📌 How the Booking & Delivery Process Works</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 px-4 pb-4">
                <div className="text-sm space-y-3">
                  <div>
                    <div className="font-medium mb-1">1. Booking a Service</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• Browse creator profiles and select a service</div>
                      <div>• Choose payment method (MetaMask for EVM or Phantom for Solana)</div>
                      <div>• Pay the exact USDC amount to our escrow wallet</div>
                      <div>• Your payment is held safely until delivery is complete</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-1">2. Work Begins</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• Creator receives notification of your booking</div>
                      <div>• A private chat opens between you and the creator</div>
                      <div>• Creator begins work on your requested service</div>
                      <div>• You can message the creator for updates or clarifications</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-1">3. Delivery Process</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• Creator uploads deliverables when work is complete</div>
                      <div>• You receive notification that delivery is ready</div>
                      <div>• Review the delivered content in your dashboard</div>
                      <div>• Download files and check if requirements are met</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-1">4. Review & Release</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• <span className="font-medium text-green-600">Accept:</span> If satisfied, click "Accept Delivery"</div>
                      <div>• <span className="font-medium text-red-600">Dispute:</span> If issues exist, open a dispute for admin review</div>
                      <div>• <span className="font-medium text-blue-600">Auto-Release:</span> After 3 days, funds auto-release to creator</div>
                      <div>• Leave a review to help other users</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-1">5. Payment Release</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• Upon acceptance or auto-release, escrow funds are sent to creator</div>
                      <div>• Transaction is recorded with payout details</div>
                      <div>• Both parties can leave reviews for each other</div>
                      <div>• Service is marked as completed</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-1">🛡️ Protection & Security</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• <span className="font-medium">Escrow Protection:</span> Funds held until delivery confirmed</div>
                      <div>• <span className="font-medium">Dispute Resolution:</span> Admin team reviews any conflicts</div>
                      <div>• <span className="font-medium">Secure Payments:</span> Direct wallet-to-wallet USDC transactions</div>
                      <div>• <span className="font-medium">Chat History:</span> All communications saved for reference</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-1">💡 Tips for Success</div>
                    <div className="text-xs space-y-1 ml-2">
                      <div>• Communicate clearly about your requirements</div>
                      <div>• Respond promptly to creator messages</div>
                      <div>• Review deliverables within the 3-day window</div>
                      <div>• Leave honest reviews to build community trust</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4" style={{ scrollBehavior: 'auto' }}>
          {isMobile ? (
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Select booking status" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-md z-50">
                <SelectItem value="all">All ({tabCounts.all})</SelectItem>
                <SelectItem value="active">Active ({tabCounts.active})</SelectItem>
                <SelectItem value="delivered">Delivered ({tabCounts.delivered})</SelectItem>
                <SelectItem value="completed">Completed ({tabCounts.completed})</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <TabsList>
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="active">Active ({tabCounts.active})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({tabCounts.delivered})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({tabCounts.completed})</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value={activeTab} className="space-y-4">
            {filterBookings(activeTab).map((booking) => {
              const isWorkStarted = !!booking.work_started_at;
              
              return (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="space-y-3">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {booking.services?.title || 'Service'}
                          <Dialog>
                            <DialogTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-red-500 cursor-help" />
                            </DialogTrigger>
                            <DialogContent className="max-w-md h-[80vh] p-0">
                              <DialogHeader className="p-4 pb-2">
                                <DialogTitle className="text-base">📌 How the Booking & Delivery Process Works</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="flex-1 px-4 pb-4">
                                <div className="text-sm space-y-3">
                                  <div>
                                    <div className="font-medium mb-1">1. Booking a Service</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• When you book a service, your payment is held securely in escrow.</div>
                                      <div>• A booking will show as Pending until our escrow team verifies the funds.</div>
                                      <div>• Once verified, the status updates to Paid, and the creator may begin work.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">2. Collaboration</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• Use the dedicated chat window to share project details, logos, files, or other requirements directly with the creator.</div>
                                      <div>• Communication and file sharing through the platform are protected and visible for dispute resolution if needed.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">3. Delivery & Proof</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• The creator will submit proof of work through verified links and/or uploaded files.</div>
                                      <div>• Additional materials may also appear in the chat window.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">4. Your Options After Delivery</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• Accept Work → Approve the delivery and funds are released from escrow within 72 hours (creator receives 85%, platform 15%).</div>
                                      <div>• File a Dispute → If the work does not meet agreed requirements, you can open a dispute. Admins will review all platform communications and issue a ruling.</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-medium mb-1">5. Reviews</div>
                                    <div className="text-xs space-y-1 ml-2">
                                      <div>• After completion (accepted or disputed), both you and the creator may leave a star rating (1–5) and written review.</div>
                                      <div>• Reviews appear on profiles and help guide future bookings.</div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2 mt-3">
                                    <div className="font-medium text-orange-600 mb-1">⚠️ Important:</div>
                                    <div className="text-xs">Keep all communication and file transfers on-platform. Escrow protection and dispute resolution only apply to activity conducted within the platform.</div>
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
                            </DialogContent>
                          </Dialog>
                        </CardTitle>
                        
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          Creator: 
                          {booking.creator?.handle ? (
                            <Link 
                              to={`/profile/${booking.creator.handle}`}
                              className="text-primary hover:underline"
                            >
                              @{booking.creator.handle}
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
                      
                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status === 'paid' && isWorkStarted ? 'Work Started' : booking.status.replace('_', ' ')}
                        </Badge>
                        <p className="font-semibold">
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
                          <span className="font-medium">Current Status:</span> {booking.status === 'paid' && isWorkStarted ? 'Work Started' : booking.status.replace('_', ' ')}
                        </p>
                        {booking.status === 'delivered' && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <p className="text-sm text-orange-800">
                              Work has been delivered - please review and accept or open a dispute if needed
                            </p>
                          </div>
                        )}
                        {booking.status === 'payment_rejected' && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <div className="flex-1">
                              <p className="text-sm text-red-800">
                                Payment was rejected - please try again
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setRetryPaymentBookingId(booking.id)}
                              className="ml-2"
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              Retry Payment
                            </Button>
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

                    {/* Delivered Content */}
                    {booking.status === 'delivered' && (booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-medium mb-3 text-blue-800">Deliverables:</h4>
                        <div className="space-y-2">
                          {booking.proof_links?.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-700 font-medium">{link.label}:</span>
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
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
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
                          
                          {booking.deliveryNote && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-xs text-blue-700 font-medium mb-1">Additional Notes:</p>
                              <p className="text-sm text-blue-800 bg-blue-100 p-2 rounded border">
                                {booking.deliveryNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completed Deliverables - Show for accepted/released bookings */}
                    {(booking.status === 'accepted' || booking.status === 'released') && (booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-medium mb-3 text-green-800">Final Deliverables:</h4>
                        <div className="space-y-2">
                          {booking.proof_links?.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">{link.label}:</span>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-green-600 hover:underline text-sm truncate"
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
                                className="text-green-600 hover:underline text-sm"
                              >
                                View Social Proof Link
                              </a>
                            </div>
                          )}
                          
                          {booking.proof_file_url && (
                            <div className="space-y-2">
                              {booking.proof_file_url.split(',').map((fileUrl, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <ExternalLink className="h-3 w-3 text-green-600" />
                                  <a 
                                    href={fileUrl.trim()} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-green-600 hover:underline text-sm"
                                  >
                                    View File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {booking.deliveryNote && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <p className="text-xs text-green-700 font-medium mb-1">Additional Notes:</p>
                              <p className="text-sm text-green-800 bg-green-100 p-2 rounded border">
                                {booking.deliveryNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Escrow Manager - Only show for delivered bookings */}
                    {booking.status === 'delivered' && (
                      <EscrowManager bookingId={booking.id} isClient={true} />
                    )}

                    {/* Review System - FIXED: Now includes 'refunded' status */}
                    {(booking.status === 'accepted' || booking.status === 'released' || booking.status === 'refunded') && booking.creator && (
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="font-medium mb-3">Review this service</h4>
                        <LazyReviewSystem
                          bookingId={booking.id}
                          revieweeId={booking.creator.id}
                          canReview={true}
                        />
                      </div>
                    )}

                    {/* Chat Component */}
                    {booking.creator && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4" />
                          <h4 className="font-medium">
                            Chat with{' '}
                            {booking.creator.handle ? (
                              <Link 
                                to={`/profile/${booking.creator.handle}`}
                                className="text-primary hover:underline"
                              >
                                @{booking.creator.handle}
                              </Link>
                            ) : (
                              <span>@{booking.creator.handle || 'Unknown'}</span>
                            )}
                          </h4>
                        </div>
                        <LazyBookingChat
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
                          Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                        </div>
                        {booking.delivered_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
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
        {retryPaymentBookingId && (
          <RetryPaymentModal
            bookingId={retryPaymentBookingId}
            isOpen={!!retryPaymentBookingId}
            onClose={() => setRetryPaymentBookingId(null)}
            onPaymentRetried={() => {
              setRetryPaymentBookingId(null);
              queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
            }}
          />
        )}
      </div>
    </div>
  );
};

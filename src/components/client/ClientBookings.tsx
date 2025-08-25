

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, ExternalLink, Hash, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { BookingChat } from '@/components/messaging/BookingChat';

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
  const [activeTab, setActiveTab] = useState('all');

  // Prevent auto-scroll when tab changes
  const handleTabChange = (value: string) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;
    setActiveTab(value);
    // Restore scroll position after state update
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
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
    enabled: !!user?.id
  });

  const getTabCounts = () => {
    if (!bookings) return { all: 0, active: 0, in_progress: 0, delivered: 0 };
    
    return {
      all: bookings.length,
      active: bookings.filter(b => b.status === 'pending' || b.status === 'paid').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      delivered: bookings.filter(b => b.status === 'delivered' || b.status === 'accepted' || b.status === 'released').length,
    };
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    
    if (status === 'active') {
      return bookings.filter(booking => booking.status === 'pending' || booking.status === 'paid');
    }
    if (status === 'in_progress') {
      return bookings.filter(booking => booking.status === 'in_progress');
    }
    if (status === 'delivered') {
      return bookings.filter(booking => booking.status === 'delivered' || booking.status === 'accepted' || booking.status === 'released');
    }
    
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

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
        <p className="text-muted-foreground">
          Track your service bookings and communicate with creators
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({tabCounts.active})</TabsTrigger>
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
                    {booking.status === 'delivered' && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-orange-800">
                          Work has been delivered - please review and accept or open a dispute if needed
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
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 text-blue-600" />
                          <a 
                            href={booking.proof_file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Uploaded File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Component */}
                {booking.creator && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-medium">Chat with @{booking.creator.handle}</h4>
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


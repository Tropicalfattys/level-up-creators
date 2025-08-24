
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Eye, Star, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/contracts';

interface Creator {
  id: string;
  user_id: string;
  approved: boolean;
  approved_at: string | null;
  headline: string | null;
  tier: string;
  priority_score: number;
  intro_video_url: string | null;
  category: string | null;
  rating: number;
  review_count: number;
  created_at: string;
  users: {
    id: string;
    handle: string | null;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    payout_address_eth: string | null;
    payout_address_sol: string | null;
    payout_address_cardano: string | null;
    payout_address_bsc: string | null;
    payout_address_sui: string | null;
  };
}

export const AdminCreators = () => {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['admin-creators', statusFilter],
    queryFn: async (): Promise<Creator[]> => {
      let query = supabase
        .from('creators')
        .select(`
          *,
          users (
            id,
            handle,
            email,
            avatar_url,
            bio,
            payout_address_eth,
            payout_address_sol,
            payout_address_cardano,
            payout_address_bsc,
            payout_address_sui
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'approved') {
        query = query.eq('approved', true);
      } else if (statusFilter === 'pending') {
        query = query.eq('approved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const updateCreatorStatus = useMutation({
    mutationFn: async ({ creatorId, approved }: { creatorId: string; approved: boolean }) => {
      const updateData = approved 
        ? { approved: true, approved_at: new Date().toISOString() }
        : { approved: false, approved_at: null };

      const { error } = await supabase
        .from('creators')
        .update(updateData)
        .eq('id', creatorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Creator status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      queryClient.invalidateQueries({ queryKey: ['creators'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update creator status: ' + error.message);
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWalletAddresses = (creator: Creator) => {
    const wallets = [
      { network: 'ethereum', address: creator.users.payout_address_eth },
      { network: 'solana', address: creator.users.payout_address_sol },
      { network: 'bsc', address: creator.users.payout_address_bsc },
      { network: 'sui', address: creator.users.payout_address_sui },
      { network: 'cardano', address: creator.users.payout_address_cardano }
    ].filter(wallet => wallet.address);

    return wallets;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Management</CardTitle>
          <CardDescription>
            Review and manage creator applications and profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading creators...</div>
            ) : creators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No creators found matching your filters
              </div>
            ) : (
              creators.map((creator) => (
                <Card key={creator.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.users.avatar_url || ''} alt={creator.users.handle || ''} />
                        <AvatarFallback>
                          {creator.users.handle?.[0]?.toUpperCase() || creator.users.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {creator.users.handle || creator.users.email}
                          </h4>
                          <Badge variant={creator.approved ? 'default' : 'secondary'}>
                            {creator.approved ? 'Approved' : 'Pending'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {creator.tier}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {creator.headline || 'No headline provided'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {creator.rating.toFixed(1)} ({creator.review_count} reviews)
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Applied {formatDate(creator.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {getWalletAddresses(creator).length} wallet(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      
                      {!creator.approved && (
                        <Button
                          size="sm"
                          onClick={() => updateCreatorStatus.mutate({ creatorId: creator.id, approved: true })}
                          disabled={updateCreatorStatus.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      {creator.approved && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateCreatorStatus.mutate({ creatorId: creator.id, approved: false })}
                          disabled={updateCreatorStatus.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCreator && (
        <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Creator Details</DialogTitle>
              <DialogDescription>
                Review creator profile and application details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCreator.users.avatar_url || ''} alt={selectedCreator.users.handle || ''} />
                  <AvatarFallback className="text-lg">
                    {selectedCreator.users.handle?.[0]?.toUpperCase() || selectedCreator.users.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      {selectedCreator.users.handle || selectedCreator.users.email}
                    </h3>
                    <Badge variant={selectedCreator.approved ? 'default' : 'secondary'}>
                      {selectedCreator.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedCreator.users.email}
                  </p>
                  
                  {selectedCreator.headline && (
                    <p className="text-sm font-medium">
                      {selectedCreator.headline}
                    </p>
                  )}
                </div>
              </div>

              {selectedCreator.users.bio && (
                <div>
                  <h4 className="font-semibold mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCreator.users.bio}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Payout Wallet Addresses
                </h4>
                <div className="space-y-3">
                  {getWalletAddresses(selectedCreator).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No wallet addresses configured</p>
                  ) : (
                    getWalletAddresses(selectedCreator).map((wallet) => {
                      const networkConfig = NETWORK_CONFIG[wallet.network as keyof typeof NETWORK_CONFIG];
                      return (
                        <div key={wallet.network} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{networkConfig?.icon}</span>
                            <span className="font-medium text-sm">{networkConfig?.name}</span>
                          </div>
                          <code className="flex-1 text-xs bg-background px-2 py-1 rounded border break-all">
                            {wallet.address}
                          </code>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCreator.rating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCreator.review_count}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Application Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tier:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {selectedCreator.tier}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <span className="ml-2 capitalize">{selectedCreator.category || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Applied:</span>
                    <span className="ml-2">{formatDate(selectedCreator.created_at)}</span>
                  </div>
                  {selectedCreator.approved_at && (
                    <div>
                      <span className="font-medium">Approved:</span>
                      <span className="ml-2">{formatDate(selectedCreator.approved_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCreator(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {!selectedCreator.approved ? (
                  <Button
                    onClick={() => {
                      updateCreatorStatus.mutate({ creatorId: selectedCreator.id, approved: true });
                      setSelectedCreator(null);
                    }}
                    disabled={updateCreatorStatus.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve Creator
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateCreatorStatus.mutate({ creatorId: selectedCreator.id, approved: false });
                      setSelectedCreator(null);
                    }}
                    disabled={updateCreatorStatus.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Revoke Approval
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface CreatorUser {
  id: string;
  handle: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  role: string | null;
  social_links: any | null;
  website_url: string | null;
  portfolio_url: string | null;
  youtube_url: string | null;
}

interface CreatorWithUser {
  id: string;
  user_id: string | null;
  headline: string | null;
  category: string | null;
  tier: string | null;
  approved: boolean | null;
  approved_at: string | null;
  created_at: string | null;
  rating: number | null;
  review_count: number | null;
  payout_address_eth: string | null;
  payout_address_sol: string | null;
  payout_address_bsc: string | null;
  payout_address_sui: string | null;
  payout_address_cardano: string | null;
  users: CreatorUser;
}

export const AdminCreators = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['admin-creators', statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            id,
            handle,
            email,
            avatar_url,
            bio,
            created_at,
            role,
            social_links,
            website_url,
            portfolio_url,
            youtube_url
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'approved') {
        query = query.eq('approved', true);
      } else if (statusFilter === 'pending') {
        query = query.eq('approved', false);
      }

      if (searchQuery) {
        query = query.or(`headline.ilike.%${searchQuery}%,users.handle.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out any results where users is null or has an error
      return (data || []).filter(creator => creator.users && typeof creator.users === 'object' && !('error' in creator.users));
    }
  });

  const updateCreatorStatus = useMutation({
    mutationFn: async ({ creatorId, approved }: { creatorId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('creators')
        .update({ approved, approved_at: approved ? new Date().toISOString() : null })
        .eq('id', creatorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Creator status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update creator status: ' + error.message);
    }
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Search</Label>
              <Input
                placeholder="Headline, user, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Creators List */}
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Creator Info */}
                    <div className="lg:col-span-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={creator.users.avatar_url || undefined} />
                          <AvatarFallback>
                            {creator.users.handle?.[0]?.toUpperCase() || creator.users.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {creator.users.handle || creator.users.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {creator.headline || 'No headline'}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <Badge variant={creator.approved ? "default" : "secondary"}>
                            {creator.approved ? 'Approved' : 'Pending'}
                          </Badge>
                          <Badge variant="outline">
                            {creator.tier || 'basic'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Category:</span> {creator.category || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span> {creator.rating || 0}/5 ({creator.review_count || 0} reviews)
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span> {formatDate(creator.created_at || '')}
                        </div>
                        {creator.approved_at && (
                          <div>
                            <span className="font-medium">Approved:</span> {formatDate(creator.approved_at)}
                          </div>
                        )}
                      </div>

                      {/* Payout Addresses */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Payout Addresses:</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {creator.payout_address_eth && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-16">ETH:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {creator.payout_address_eth}
                              </code>
                            </div>
                          )}
                          {creator.payout_address_sol && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-16">SOL:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {creator.payout_address_sol}
                              </code>
                            </div>
                          )}
                          {creator.payout_address_bsc && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-16">BSC:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {creator.payout_address_bsc}
                              </code>
                            </div>
                          )}
                          {creator.payout_address_sui && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-16">SUI:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {creator.payout_address_sui}
                              </code>
                            </div>
                          )}
                          {creator.payout_address_cardano && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-16">ADA:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {creator.payout_address_cardano}
                              </code>
                            </div>
                          )}
                          {!creator.payout_address_eth && !creator.payout_address_sol && 
                           !creator.payout_address_bsc && !creator.payout_address_sui && 
                           !creator.payout_address_cardano && (
                            <div className="text-muted-foreground">No payout addresses configured</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!creator.approved && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateCreatorStatus.mutate({ creatorId: creator.id, approved: true })}
                            disabled={updateCreatorStatus.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateCreatorStatus.mutate({ creatorId: creator.id, approved: false })}
                            disabled={updateCreatorStatus.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {creator.approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCreatorStatus.mutate({ creatorId: creator.id, approved: false })}
                          disabled={updateCreatorStatus.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke Approval
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
    </div>
  );
};

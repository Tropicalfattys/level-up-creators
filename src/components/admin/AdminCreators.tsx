
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Eye, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Creator {
  id: string;
  user_id: string;
  headline: string;
  intro_video_url: string;
  tier: string;
  rating: number;
  review_count: number;
  priority_score: number;
  approved: boolean;
  approved_at: string;
  category: string;
  created_at: string;
  payout_address_eth: string;
  payout_address_sol: string;
  payout_address_bsc: string;
  payout_address_sui: string;
  payout_address_cardano: string;
  users: {
    id: string;
    handle: string;
    email: string;
    avatar_url: string;
    bio: string;
    social_links: any;
  };
}

export const AdminCreators = () => {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['admin-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Creator[];
    }
  });

  const updateCreatorStatus = async (creatorId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('creators')
        .update({ 
          approved,
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', creatorId);

      if (error) throw error;

      toast.success(`Creator ${approved ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    } catch (error: any) {
      toast.error('Failed to update creator status: ' + error.message);
    }
  };

  const viewCreatorDetails = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading creators...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Management</CardTitle>
          <CardDescription>
            Manage creator applications and existing creators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators?.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {creator.users?.avatar_url && (
                        <img 
                          src={creator.users.avatar_url} 
                          alt={creator.users.handle}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{creator.users?.handle}</div>
                        <div className="text-sm text-muted-foreground">{creator.headline}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{creator.users?.email}</TableCell>
                  <TableCell>
                    <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'}>
                      {creator.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={creator.approved ? 'default' : 'secondary'}>
                      {creator.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{creator.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground">({creator.review_count || 0})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(creator.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewCreatorDetails(creator)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!creator.approved && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateCreatorStatus(creator.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateCreatorStatus(creator.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Creator Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Creator Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedCreator?.users?.handle}
            </DialogDescription>
          </DialogHeader>
          {selectedCreator && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Profile Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Handle:</strong> {selectedCreator.users?.handle}</div>
                    <div><strong>Email:</strong> {selectedCreator.users?.email}</div>
                    <div><strong>Headline:</strong> {selectedCreator.headline}</div>
                    <div><strong>Bio:</strong> {selectedCreator.users?.bio}</div>
                    <div><strong>Tier:</strong> {selectedCreator.tier}</div>
                    <div><strong>Category:</strong> {selectedCreator.category}</div>
                  </div>
                </div>

                {selectedCreator.intro_video_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Intro Video</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedCreator.intro_video_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Video
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payout Wallet Addresses</h4>
                  <div className="space-y-3 text-sm">
                    {selectedCreator.payout_address_eth && (
                      <div>
                        <strong>Ethereum:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedCreator.payout_address_eth}
                        </div>
                      </div>
                    )}
                    {selectedCreator.payout_address_sol && (
                      <div>
                        <strong>Solana:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedCreator.payout_address_sol}
                        </div>
                      </div>
                    )}
                    {selectedCreator.payout_address_bsc && (
                      <div>
                        <strong>BSC:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedCreator.payout_address_bsc}
                        </div>
                      </div>
                    )}
                    {selectedCreator.payout_address_sui && (
                      <div>
                        <strong>Sui:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedCreator.payout_address_sui}
                        </div>
                      </div>
                    )}
                    {selectedCreator.payout_address_cardano && (
                      <div>
                        <strong>Cardano:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedCreator.payout_address_cardano}
                        </div>
                      </div>
                    )}
                  </div>
                  {!selectedCreator.payout_address_eth && 
                   !selectedCreator.payout_address_sol && 
                   !selectedCreator.payout_address_bsc && 
                   !selectedCreator.payout_address_sui && 
                   !selectedCreator.payout_address_cardano && (
                    <div className="text-muted-foreground text-sm">
                      No payout addresses configured
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Rating:</strong> {selectedCreator.rating?.toFixed(1) || '0.0'}/5.0</div>
                    <div><strong>Reviews:</strong> {selectedCreator.review_count || 0}</div>
                    <div><strong>Priority Score:</strong> {selectedCreator.priority_score || 0}</div>
                    <div><strong>Status:</strong> {selectedCreator.approved ? 'Approved' : 'Pending'}</div>
                    {selectedCreator.approved_at && (
                      <div><strong>Approved:</strong> {new Date(selectedCreator.approved_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

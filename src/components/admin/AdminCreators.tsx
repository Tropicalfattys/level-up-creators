
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Eye, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  users: {
    id: string;
    handle: string;
    email: string;
    avatar_url: string;
    bio: string;
    social_links: any;
    payout_address_eth: string;
    payout_address_sol: string;
    payout_address_bsc: string;
    payout_address_sui: string;
    payout_address_cardano: string;
    verified: boolean;
  };
}

export const AdminCreators = () => {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['admin-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey(
            id,
            handle,
            email,
            avatar_url,
            bio,
            social_links,
            payout_address_eth,
            payout_address_sol,
            payout_address_bsc,
            payout_address_sui,
            payout_address_cardano,
            verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Creator[];
    }
  });

  const updateCreatorStatus = async (creatorId: string, approved: boolean) => {
    try {
      // Find the creator to get the user_id for query invalidation
      const creator = creators?.find(c => c.id === creatorId);
      
      const { error } = await supabase
        .from('creators')
        .update({ 
          approved,
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', creatorId);

      if (error) throw error;

      toast.success(`Creator ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      
      // Invalidate user-specific queries that the dashboard uses
      if (creator?.user_id) {
        queryClient.invalidateQueries({ queryKey: ['creator-profile', creator.user_id] });
        queryClient.invalidateQueries({ queryKey: ['user-profile', creator.user_id] });
      }
    } catch (error: any) {
      toast.error('Failed to update creator status: ' + error.message);
    }
  };

  const viewCreatorDetails = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowDetails(true);
  };

  const toggleVerification = async (creatorId: string, currentVerifiedStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ verified: !currentVerifiedStatus })
        .eq('id', creatorId);

      if (error) throw error;
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
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
          {isMobile ? (
            <div className="space-y-4">
              {creators?.map((creator) => (
                <Card key={creator.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {creator.users?.avatar_url && (
                        <img 
                          src={creator.users.avatar_url} 
                          alt={creator.users.handle}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/profile/${creator.users?.handle}`}
                          className="font-medium hover:text-primary transition-colors block truncate"
                        >
                          {creator.users?.handle}
                        </Link>
                        <div className="text-sm text-muted-foreground truncate">{creator.headline}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <div className="truncate">{creator.users?.email}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tier:</span>
                        <div>
                          <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'} className="text-xs">
                            {creator.tier}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div>
                          <Badge variant={creator.approved ? 'default' : 'secondary'} className="text-xs">
                            {creator.approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs">{creator.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-muted-foreground text-xs">({creator.review_count || 0})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Applied:</span> {new Date(creator.created_at).toLocaleDateString()}
                    </div>
                    
                     <div className="flex flex-wrap gap-2 pt-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => viewCreatorDetails(creator)}
                         className="flex-1 min-w-0"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         View
                       </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVerification(creator.users.id, creator.users.verified)}
                          className={`flex-1 min-w-0 ${creator.users.verified ? 'text-green-600 border-green-600 hover:bg-green-50' : 'text-red-600 border-red-600 hover:bg-red-50'}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Verified
                        </Button>
                       {!creator.approved && (
                         <>
                           <Button
                             size="sm"
                             onClick={() => updateCreatorStatus(creator.id, true)}
                             className="flex-1 min-w-0"
                           >
                             <Check className="h-4 w-4 mr-2" />
                             Approve
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={() => updateCreatorStatus(creator.id, false)}
                             className="flex-1 min-w-0"
                           >
                             <X className="h-4 w-4 mr-2" />
                             Reject
                           </Button>
                         </>
                       )}
                     </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                          <Link 
                            to={`/profile/${creator.users?.handle}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {creator.users?.handle}
                          </Link>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleVerification(creator.users.id, creator.users.verified)}
                            className={creator.users.verified ? 'text-green-600 border-green-600 hover:bg-green-50' : 'text-red-600 border-red-600 hover:bg-red-50'}
                          >
                            <Check className="h-4 w-4" />
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
          )}

          {(!creators || creators.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No creators found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creator Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className={isMobile ? "max-w-[95vw] w-[95vw] max-h-[90vh] h-[90vh]" : "max-w-4xl max-h-[80vh]"}>
          <DialogHeader>
            <DialogTitle>Creator Details</DialogTitle>
            <DialogDescription>
              Complete information about{' '}
              {selectedCreator?.users?.handle && (
                <Link 
                  to={`/profile/${selectedCreator.users.handle}`}
                  className="hover:text-primary transition-colors"
                >
                  {selectedCreator.users.handle}
                </Link>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedCreator && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Profile Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Handle:</strong>{' '}
                        <Link 
                          to={`/profile/${selectedCreator.users?.handle}`}
                          className="hover:text-primary transition-colors"
                        >
                          {selectedCreator.users?.handle}
                        </Link>
                      </div>
                      <div><strong>Email:</strong> {selectedCreator.users?.email}</div>
                      <div><strong>Headline:</strong> {selectedCreator.headline}</div>
                      <div><strong>Bio:</strong> {selectedCreator.users?.bio}</div>
                      <div><strong>Tier:</strong> {selectedCreator.tier}</div>
                      {selectedCreator.approved && selectedCreator.approved_at && (
                        <div><strong>Active Subscription Date:</strong> {new Date(selectedCreator.approved_at).toLocaleDateString()}</div>
                      )}
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
                      {selectedCreator.users?.payout_address_eth && (
                        <div>
                          <strong>Ethereum:</strong>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                            {selectedCreator.users.payout_address_eth}
                          </div>
                        </div>
                      )}
                      {selectedCreator.users?.payout_address_sol && (
                        <div>
                          <strong>Solana:</strong>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                            {selectedCreator.users.payout_address_sol}
                          </div>
                        </div>
                      )}
                      {selectedCreator.users?.payout_address_bsc && (
                        <div>
                          <strong>BSC:</strong>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                            {selectedCreator.users.payout_address_bsc}
                          </div>
                        </div>
                      )}
                      {selectedCreator.users?.payout_address_sui && (
                        <div>
                          <strong>SUI:</strong>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                            {selectedCreator.users.payout_address_sui}
                          </div>
                        </div>
                      )}
                      {selectedCreator.users?.payout_address_cardano && (
                        <div>
                          <strong>Cardano:</strong>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                            {selectedCreator.users.payout_address_cardano}
                          </div>
                        </div>
                      )}
                    </div>
                    {!selectedCreator.users?.payout_address_eth && 
                     !selectedCreator.users?.payout_address_sol && 
                     !selectedCreator.users?.payout_address_bsc && 
                     !selectedCreator.users?.payout_address_sui && 
                     !selectedCreator.users?.payout_address_cardano && (
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

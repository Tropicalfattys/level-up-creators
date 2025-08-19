
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const AdminCreators = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['admin-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            id,
            handle,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateCreatorStatus = useMutation({
    mutationFn: async ({ creatorId, status }: { creatorId: string; status: string }) => {
      const { error } = await supabase
        .from('creators')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', creatorId);
      
      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        action: `creator_${status}`,
        target_table: 'creators',
        target_id: creatorId,
        metadata: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      toast.success('Creator status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update creator status');
    }
  });

  const filteredCreators = creators?.filter(creator => {
    const matchesSearch = !searchTerm || 
      creator.users?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.headline?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || creator.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'default';
      case 'mid': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading creators...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Creator Management
        </CardTitle>
        <CardDescription>
          Approve, reject, and manage creator applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Creators List */}
        <div className="space-y-4">
          {filteredCreators?.map((creator) => (
            <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  {creator.users?.handle?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{creator.users?.handle || 'No username'}</p>
                    <Badge variant={statusColor(creator.status)}>
                      {creator.status}
                    </Badge>
                    <Badge variant={tierColor(creator.tier)}>
                      {creator.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{creator.users?.email}</p>
                  {creator.headline && (
                    <p className="text-sm text-muted-foreground mt-1">{creator.headline}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Applied: {new Date(creator.created_at).toLocaleDateString()}</span>
                    {creator.tier_payment_status === 'paid' && creator.tier_payment_tx_hash && (
                      <Badge variant="outline" className="text-xs">
                        Tier Paid
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {creator.intro_video_url && (
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View Video
                  </Button>
                )}
                
                {creator.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateCreatorStatus.mutate({ 
                        creatorId: creator.id, 
                        status: 'approved' 
                      })}
                      disabled={updateCreatorStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateCreatorStatus.mutate({ 
                        creatorId: creator.id, 
                        status: 'rejected' 
                      })}
                      disabled={updateCreatorStatus.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                {creator.status !== 'pending' && (
                  <Select
                    value={creator.status}
                    onValueChange={(status) => updateCreatorStatus.mutate({ 
                      creatorId: creator.id, 
                      status 
                    })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
          
          {(!filteredCreators || filteredCreators.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No creators found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

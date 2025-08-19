import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Users, Search, CheckCircle, XCircle, Clock, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CreatorData {
  id: string;
  user_id: string;
  created_at: string;
  approved: boolean;
  approved_at: string | null;
  headline: string | null;
  tier: string;
  priority_score: number;
  intro_video_url: string | null;
  category: string | null;
  users: {
    id: string;
    handle: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
  } | null;
  services: Array<{
    id: string;
    title: string;
    active: boolean;
  }>;
}

interface AdminNoteData {
  id: string;
  user_id: string;
  admin_id: string;
  note: string;
  created_at: string;
  admin: {
    handle: string;
  } | null;
}

export const AdminCreators = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState<CreatorData | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const queryClient = useQueryClient();

  const { data: creators, isLoading, error } = useQuery({
    queryKey: ['admin-creators'],
    queryFn: async (): Promise<CreatorData[]> => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select(`
            *,
            users!creators_user_id_fkey (
              id,
              handle,
              email,
              avatar_url,
              created_at
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Creators query error:', error);
          throw error;
        }

        // Fetch services separately to avoid relationship conflicts
        const creatorsWithServices = await Promise.all(
          (data || []).map(async (creator) => {
            const { data: services, error: servicesError } = await supabase
              .from('services')
              .select('id, title, active')
              .eq('creator_id', creator.user_id);
            
            if (servicesError) {
              console.error('Services query error:', servicesError);
              return { ...creator, services: [] };
            }
            
            return { ...creator, services: services || [] };
          })
        );
        
        console.log('Fetched creators:', creatorsWithServices);
        return creatorsWithServices;
      } catch (error) {
        console.error('Creators fetch error:', error);
        throw error;
      }
    }
  });

  const { data: adminNotes } = useQuery({
    queryKey: ['admin-notes', selectedCreator?.user_id],
    queryFn: async (): Promise<AdminNoteData[]> => {
      if (!selectedCreator?.user_id) return [];
      
      try {
        const { data, error } = await supabase
          .from('admin_notes')
          .select(`
            id,
            user_id,
            admin_id,
            note,
            created_at
          `)
          .eq('user_id', selectedCreator.user_id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Admin notes query error:', error);
          return [];
        }

        // Fetch admin details separately
        const notesWithAdmin = await Promise.all(
          (data || []).map(async (note) => {
            const { data: admin, error: adminError } = await supabase
              .from('users')
              .select('handle')
              .eq('id', note.admin_id)
              .single();
            
            if (adminError) {
              console.error('Admin query error:', adminError);
              return { ...note, admin: null };
            }
            
            return { ...note, admin };
          })
        );

        return notesWithAdmin;
      } catch (error) {
        console.error('Admin notes fetch error:', error);
        return [];
      }
    },
    enabled: !!selectedCreator?.user_id
  });

  const approveCreator = useMutation({
    mutationFn: async (creatorId: string) => {
      try {
        const { error } = await supabase
          .from('creators')
          .update({ 
            approved: true, 
            approved_at: new Date().toISOString() 
          })
          .eq('id', creatorId);
        
        if (error) throw error;
      } catch (error) {
        console.error('Approve creator error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      toast.success('Creator approved successfully');
    },
    onError: (error) => {
      console.error('Approve creator mutation error:', error);
      toast.error('Failed to approve creator');
    }
  });

  const rejectCreator = useMutation({
    mutationFn: async (creatorId: string) => {
      try {
        const { error } = await supabase
          .from('creators')
          .delete()
          .eq('id', creatorId);
        
        if (error) throw error;
      } catch (error) {
        console.error('Reject creator error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      toast.success('Creator application rejected and removed');
    },
    onError: (error) => {
      console.error('Reject creator mutation error:', error);
      toast.error('Failed to reject creator');
    }
  });

  const addAdminNote = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Admin not authenticated');

        const { error } = await supabase
          .from('admin_notes')
          .insert({
            user_id: userId,
            admin_id: user.id,
            note
          });
        
        if (error) throw error;
      } catch (error) {
        console.error('Add admin note error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      setAdminNote('');
      toast.success('Admin note added');
    },
    onError: (error) => {
      console.error('Add admin note mutation error:', error);
      toast.error('Failed to add admin note');
    }
  });

  const filteredCreators = creators?.filter((creator: CreatorData) => {
    const user = creator.users;
    const matchesSearch = !searchTerm || 
      user?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.headline?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && creator.approved) ||
      (statusFilter === 'pending' && !creator.approved);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (approved: boolean) => {
    return approved ? 'default' : 'secondary';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'destructive';
      case 'mid': return 'default';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading creators...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading creators: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Creator Management ({creators?.length || 0} total)
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          {creators && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{creators.length}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {creators.filter(c => c.approved).length}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {creators.filter(c => !c.approved).length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          )}

          {/* Creators List */}
          <div className="space-y-4">
            {filteredCreators?.map((creator: CreatorData) => (
              <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    {creator.users?.avatar_url ? (
                      <img 
                        src={creator.users.avatar_url} 
                        alt={creator.users.handle || 'User'} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium">
                        {creator.users?.handle?.charAt(0).toUpperCase() || 
                         creator.users?.email?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{creator.users?.handle || 'No username'}</p>
                    <p className="text-sm text-muted-foreground">{creator.users?.email}</p>
                    {creator.headline && (
                      <p className="text-sm text-muted-foreground mt-1">{creator.headline}</p>
                    )}
                    {creator.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {creator.category}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(creator.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getTierColor(creator.tier)}>
                    {creator.tier}
                  </Badge>
                  <Badge variant={getStatusColor(creator.approved)}>
                    {creator.approved ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {creator.services?.length || 0} services
                  </span>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Creator Details: {creator.users?.handle || creator.users?.email}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Basic Info</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Email:</strong> {creator.users?.email}</p>
                              <p><strong>Handle:</strong> {creator.users?.handle || 'Not set'}</p>
                              <p><strong>Headline:</strong> {creator.headline || 'Not set'}</p>
                              <p><strong>Category:</strong> {creator.category || 'Not set'}</p>
                              <p><strong>Tier:</strong> {creator.tier}</p>
                              <p><strong>Priority Score:</strong> {creator.priority_score}</p>
                              <p><strong>Services:</strong> {creator.services?.length || 0}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Status</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Approved:</strong> {creator.approved ? 'Yes' : 'No'}</p>
                              {creator.approved_at && (
                                <p><strong>Approved At:</strong> {new Date(creator.approved_at).toLocaleString()}</p>
                              )}
                              <p><strong>Applied:</strong> {new Date(creator.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {creator.intro_video_url && (
                          <div>
                            <h4 className="font-medium mb-2">Intro Video</h4>
                            <a 
                              href={creator.intro_video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View Intro Video <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Admin Notes</h4>
                          <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                            {adminNotes?.map((note: AdminNoteData) => (
                              <div key={note.id} className="p-2 bg-muted rounded text-sm">
                                <p>{note.note}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {note.admin?.handle || 'Admin'} on {new Date(note.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {(!adminNotes || adminNotes.length === 0) && (
                              <p className="text-sm text-muted-foreground">No admin notes yet</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add admin note..."
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              className="flex-1"
                              rows={2}
                            />
                            <Button 
                              onClick={() => addAdminNote.mutate({ 
                                userId: creator.user_id, 
                                note: adminNote 
                              })}
                              disabled={!adminNote.trim() || addAdminNote.isPending}
                              size="sm"
                            >
                              Add Note
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          {!creator.approved ? (
                            <>
                              <Button 
                                onClick={() => approveCreator.mutate(creator.id)}
                                disabled={approveCreator.isPending}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {approveCreator.isPending ? 'Approving...' : 'Approve Creator'}
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => rejectCreator.mutate(creator.id)}
                                disabled={rejectCreator.isPending}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {rejectCreator.isPending ? 'Rejecting...' : 'Reject Application'}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="destructive"
                              onClick={() => rejectCreator.mutate(creator.id)}
                              disabled={rejectCreator.isPending}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {rejectCreator.isPending ? 'Revoking...' : 'Revoke Approval'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
            {(!filteredCreators || filteredCreators.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {creators?.length === 0 ? 'No creator applications found' : 'No creators match your search criteria'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

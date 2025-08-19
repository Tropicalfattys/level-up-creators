
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreatorWithUser {
  id: string;
  user_id: string;
  approved: boolean;
  created_at: string;
  category?: string;
  headline?: string;
  user: {
    email: string;
    handle: string;
    avatar_url?: string;
    created_at: string;
  };
  services: Array<{
    id: string;
    title: string;
    active: boolean;
  }>;
}

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
  admin: {
    handle: string;
  } | null;
}

export const AdminCreators = () => {
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithUser | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const queryClient = useQueryClient();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['admin-creators'],
    queryFn: async (): Promise<CreatorWithUser[]> => {
      try {
        console.log('Fetching creators...');
        const { data, error } = await supabase
          .from('creators')
          .select(`
            id,
            user_id,
            approved,
            created_at,
            category,
            headline,
            user:users!creators_user_id_fkey (
              email,
              handle,
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
    queryFn: async (): Promise<AdminNote[]> => {
      if (!selectedCreator) return [];
      
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
    enabled: !!selectedCreator
  });

  const updateCreatorStatus = useMutation({
    mutationFn: async ({ creatorId, userId, approved }: { creatorId: string; userId: string; approved: boolean }) => {
      // Update creator approval status
      const { error: creatorError } = await supabase
        .from('creators')
        .update({ 
          approved,
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', creatorId);

      if (creatorError) throw creatorError;

      // CRITICAL FIX: Update user role to 'creator' when approved
      if (approved) {
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'creator' })
          .eq('id', userId);

        if (userError) throw userError;
      } else {
        // If declining, set role back to 'client'
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'client' })
          .eq('id', userId);

        if (userError) throw userError;
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(`Creator ${approved ? 'approved' : 'declined'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    },
    onError: (error) => {
      console.error('Update creator status error:', error);
      toast.error('Failed to update creator status');
    }
  });

  const addAdminNote = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_notes')
        .insert([{
          user_id: userId,
          admin_id: currentUser.user.id,
          note
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Admin note added successfully!');
      setAdminNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
    },
    onError: (error) => {
      console.error('Add admin note error:', error);
      toast.error('Failed to add admin note');
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading creators...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Creator Applications</h3>
        <p className="text-muted-foreground">
          Review and manage creator applications
        </p>
      </div>

      <div className="grid gap-4">
        {creators && creators.length > 0 ? (
          creators.map((creator) => (
            <Card key={creator.id} className="border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        @{creator.user?.handle || 'Unknown'}
                      </CardTitle>
                      <Badge variant={creator.approved ? 'default' : 'secondary'}>
                        {creator.approved ? 'Approved' : 'Pending'}
                      </Badge>
                      {creator.category && (
                        <Badge variant="outline">{creator.category}</Badge>
                      )}
                    </div>
                    <CardDescription className="mb-3">
                      {creator.user?.email}
                      {creator.headline && ` • ${creator.headline}`}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Applied: {format(new Date(creator.created_at), 'MMM d, yyyy')}</span>
                      <span>Services: {creator.services?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCreator(creator)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Creator Details: @{creator.user?.handle}</DialogTitle>
                          <DialogDescription>
                            Review application details and manage creator status
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Email:</strong> {creator.user?.email}
                            </div>
                            <div>
                              <strong>Applied:</strong> {format(new Date(creator.created_at), 'MMM d, yyyy')}
                            </div>
                            <div>
                              <strong>Category:</strong> {creator.category || 'Not specified'}
                            </div>
                            <div>
                              <strong>Status:</strong> 
                              <Badge className="ml-2" variant={creator.approved ? 'default' : 'secondary'}>
                                {creator.approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>

                          {creator.headline && (
                            <div>
                              <strong>Headline:</strong>
                              <p className="text-sm text-muted-foreground mt-1">{creator.headline}</p>
                            </div>
                          )}

                          {creator.services && creator.services.length > 0 && (
                            <div>
                              <strong>Services ({creator.services.length}):</strong>
                              <div className="mt-2 space-y-1">
                                {creator.services.map((service) => (
                                  <div key={service.id} className="flex justify-between items-center text-sm">
                                    <span>{service.title}</span>
                                    <Badge variant={service.active ? 'default' : 'secondary'}>
                                      {service.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <strong>Admin Notes:</strong>
                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                              {adminNotes && adminNotes.length > 0 ? (
                                adminNotes.map((note) => (
                                  <div key={note.id} className="text-sm border rounded p-2">
                                    <p>{note.note}</p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      By @{note.admin?.handle || 'Unknown'} • {format(new Date(note.created_at), 'MMM d, yyyy')}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No admin notes yet</p>
                              )}
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              <Textarea
                                placeholder="Add admin note..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="min-h-16"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addAdminNote.mutate({ userId: creator.user_id, note: adminNote })}
                                disabled={!adminNote.trim() || addAdminNote.isPending}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Add Note
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {!creator.approved ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateCreatorStatus.mutate({ 
                            creatorId: creator.id, 
                            userId: creator.user_id, 
                            approved: true 
                          })}
                          disabled={updateCreatorStatus.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateCreatorStatus.mutate({ 
                            creatorId: creator.id, 
                            userId: creator.user_id, 
                            approved: false 
                          })}
                          disabled={updateCreatorStatus.isPending}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCreatorStatus.mutate({ 
                          creatorId: creator.id, 
                          userId: creator.user_id, 
                          approved: false 
                        })}
                        disabled={updateCreatorStatus.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No creator applications found</p>
          </div>
        )}
      </div>
    </div>
  );
};

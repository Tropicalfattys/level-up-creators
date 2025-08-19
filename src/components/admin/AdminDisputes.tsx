
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
import { AlertTriangle, Scale, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DisputeWithRelations } from '@/types/database';

export const AdminDisputes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithRelations | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const queryClient = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('disputes')
        .select(`
          *,
          bookings (
            id,
            usdc_amount,
            services (
              title
            ),
            client:client_id (
              handle,
              email
            ),
            creator:creator_id (
              handle,
              email
            )
          ),
          resolved_by_user:resolved_by (
            handle
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DisputeWithRelations[];
    }
  });

  const resolveDispute = useMutation({
    mutationFn: async ({ 
      disputeId, 
      status, 
      resolutionNote 
    }: { 
      disputeId: string; 
      status: string; 
      resolutionNote: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('disputes')
        .update({ 
          status,
          resolution_note: resolutionNote,
          resolved_at: new Date().toISOString(),
          resolved_by: user.user?.id
        })
        .eq('id', disputeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolutionNote('');
      toast.success('Dispute resolved successfully');
    },
    onError: () => {
      toast.error('Failed to resolve dispute');
    }
  });

  const filteredDisputes = disputes?.filter(dispute => {
    const booking = dispute.bookings;
    const matchesSearch = !searchTerm || 
      booking?.client?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.creator?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'resolved': return 'default';
      case 'refunded': return 'secondary';
      case 'released': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'resolved': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'refunded': return <XCircle className="h-3 w-3 mr-1" />;
      case 'released': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getOpenerColor = (opener: string) => {
    return opener === 'client' ? 'secondary' : 'outline';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading disputes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Dispute Management
          </CardTitle>
          <CardDescription>
            Resolve conflicts between clients and creators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search disputes..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disputes List */}
          <div className="space-y-4">
            {filteredDisputes?.map((dispute) => (
              <div key={dispute.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">{dispute.bookings?.services?.title || 'Unknown Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.bookings?.client?.handle} ↔ {dispute.bookings?.creator?.handle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "{dispute.reason.substring(0, 100)}..."
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getOpenerColor(dispute.opened_by)}>
                        Opened by {dispute.opened_by}
                      </Badge>
                      {dispute.bookings?.usdc_amount && (
                        <span className="text-sm font-medium text-green-600">
                          ${Number(dispute.bookings.usdc_amount).toFixed(2)} USDC
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(dispute.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(dispute.status)}>
                    {getStatusIcon(dispute.status)}
                    {dispute.status}
                  </Badge>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDispute(dispute)}
                      >
                        Resolve
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Resolve Dispute</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Dispute Details</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Service:</strong> {dispute.bookings?.services?.title}</p>
                              <p><strong>Amount:</strong> ${Number(dispute.bookings?.usdc_amount || 0).toFixed(2)} USDC</p>
                              <p><strong>Opened By:</strong> {dispute.opened_by}</p>
                              <p><strong>Status:</strong> {dispute.status}</p>
                              <p><strong>Created:</strong> {new Date(dispute.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Parties</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Client:</strong> {dispute.bookings?.client?.handle}</p>
                              <p className="text-muted-foreground">{dispute.bookings?.client?.email}</p>
                              <p><strong>Creator:</strong> {dispute.bookings?.creator?.handle}</p>
                              <p className="text-muted-foreground">{dispute.bookings?.creator?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Dispute Reason</h4>
                          <div className="p-3 bg-muted rounded text-sm">
                            {dispute.reason}
                          </div>
                        </div>

                        {dispute.resolved_at && (
                          <div>
                            <h4 className="font-medium mb-2">Resolution</h4>
                            <div className="p-3 bg-green-50 rounded text-sm">
                              <p><strong>Resolved By:</strong> {dispute.resolved_by_user?.handle}</p>
                              <p><strong>Resolution Date:</strong> {new Date(dispute.resolved_at).toLocaleString()}</p>
                              {dispute.resolution_note && (
                                <p className="mt-2"><strong>Note:</strong> {dispute.resolution_note}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {dispute.status === 'open' && (
                          <div>
                            <h4 className="font-medium mb-2">Resolution Action</h4>
                            <Textarea
                              placeholder="Add resolution note..."
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              className="mb-3"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => resolveDispute.mutate({
                                  disputeId: dispute.id,
                                  status: 'resolved',
                                  resolutionNote
                                })}
                                disabled={!resolutionNote.trim()}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve in Favor
                              </Button>
                              <Button 
                                variant="secondary"
                                onClick={() => resolveDispute.mutate({
                                  disputeId: dispute.id,
                                  status: 'refunded',
                                  resolutionNote
                                })}
                                disabled={!resolutionNote.trim()}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Issue Refund
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => resolveDispute.mutate({
                                  disputeId: dispute.id,
                                  status: 'released',
                                  resolutionNote
                                })}
                                disabled={!resolutionNote.trim()}
                                className="flex-1"
                              >
                                <Scale className="h-4 w-4 mr-2" />
                                Release Payment
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
            {(!filteredDisputes || filteredDisputes.length === 0) && (
              <div className="text-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Disputes Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {statusFilter === 'all' 
                    ? "Great! There are no disputes at the moment. The platform is running smoothly."
                    : `No disputes with status "${statusFilter}" found.`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

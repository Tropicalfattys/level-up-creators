
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, Check, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface BookingWithRelations {
  id: string;
  client_id: string;
  creator_id: string;
  service_id: string;
  usdc_amount: number;
  status: string;
  created_at: string;
  client: {
    handle: string;
    email: string;
  };
  creator: {
    handle: string;
    email: string;
  };
  services: {
    title: string;
    description: string;
  };
}

interface DisputeWithRelations {
  id: string;
  booking_id: string;
  opened_by: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  booking: BookingWithRelations;
}

export const AdminDisputes = () => {
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithRelations | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const queryClient = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          booking:bookings!inner(
            *,
            client:users!bookings_client_id_fkey(handle, email),
            creator:users!bookings_creator_id_fkey(handle, email),
            services!inner(title, description)
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
      action, 
      note 
    }: { 
      disputeId: string; 
      action: 'refund' | 'release'; 
      note: string; 
    }) => {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_note: note
        })
        .eq('id', disputeId);

      if (error) throw error;

      // Update booking status based on resolution
      const dispute = disputes?.find(d => d.id === disputeId);
      if (dispute?.booking_id) {
        const newStatus = action === 'refund' ? 'refunded' : 'released';
        await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', dispute.booking_id);
      }
    },
    onSuccess: () => {
      toast.success('Dispute resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setShowDetails(false);
      setResolutionNote('');
    },
    onError: (error: any) => {
      toast.error('Failed to resolve dispute: ' + error.message);
    }
  });

  const viewDisputeDetails = (dispute: DisputeWithRelations) => {
    setSelectedDispute(dispute);
    setShowDetails(true);
  };

  const handleResolveDispute = (action: 'refund' | 'release') => {
    if (!selectedDispute || !resolutionNote.trim()) {
      toast.error('Please provide a resolution note');
      return;
    }

    resolveDispute.mutate({
      disputeId: selectedDispute.id,
      action,
      note: resolutionNote
    });
  };

  const getDisputeOutcome = (dispute: DisputeWithRelations) => {
    if (dispute.status !== 'resolved' || !dispute.booking) return null;
    
    const bookingStatus = dispute.booking.status;
    if (bookingStatus === 'refunded') {
      return { winner: 'client', text: 'Ruled in favor of Client', color: 'bg-red-100 text-red-800' };
    } else if (bookingStatus === 'released') {
      return { winner: 'creator', text: 'Ruled in favor of Creator', color: 'bg-green-100 text-green-800' };
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading disputes...</div>
        </CardContent>
      </Card>
    );
  }

  const openDisputes = disputes?.filter(d => d.status === 'open') || [];
  const resolvedDisputes = disputes?.filter(d => d.status === 'resolved') || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Open Disputes ({openDisputes.length})
          </CardTitle>
          <CardDescription>
            Disputes that require immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openDisputes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No open disputes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Opened By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dispute.booking?.services?.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {dispute.booking?.services?.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dispute.booking?.client?.handle} ({dispute.booking?.client?.email})</TableCell>
                    <TableCell>{dispute.booking?.creator?.handle} ({dispute.booking?.creator?.email})</TableCell>
                    <TableCell>${dispute.booking?.usdc_amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dispute.opened_by}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDisputeDetails(dispute)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolved Disputes ({resolvedDisputes.length})</CardTitle>
          <CardDescription>
            Previously resolved disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resolvedDisputes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No resolved disputes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Dispute Outcome</TableHead>
                  <TableHead>Admin Resolution Note</TableHead>
                  <TableHead>Resolved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedDisputes.map((dispute) => {
                  const outcome = getDisputeOutcome(dispute);
                  return (
                    <TableRow key={dispute.id}>
                      <TableCell>{dispute.booking?.services?.title}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Client: {dispute.booking?.client?.handle}</div>
                          <div>Creator: {dispute.booking?.creator?.handle}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {outcome ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <Badge className={outcome.color}>
                              {outcome.text}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No outcome data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs">
                          {dispute.resolution_note || 'No resolution note provided'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dispute.resolved_at && new Date(dispute.resolved_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dispute Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
            <DialogDescription>
              Review and resolve this dispute
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Information</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Title:</strong> {selectedDispute.booking?.services?.title}</div>
                    <div><strong>Amount:</strong> ${selectedDispute.booking?.usdc_amount}</div>
                    <div><strong>Status:</strong> {selectedDispute.booking?.status}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Parties</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Client:</strong> {selectedDispute.booking?.client?.handle}</div>
                    <div><strong>Creator:</strong> {selectedDispute.booking?.creator?.handle}</div>
                    <div><strong>Opened by:</strong> {selectedDispute.opened_by}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dispute Reason</h4>
                <div className="bg-muted p-3 rounded text-sm">
                  {selectedDispute.reason}
                </div>
              </div>

              {selectedDispute.status === 'open' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution">Resolution Note</Label>
                    <Textarea
                      id="resolution"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Explain the resolution decision..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResolveDispute('refund')}
                      disabled={resolveDispute.isPending}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Refund Client
                    </Button>
                    <Button
                      onClick={() => handleResolveDispute('release')}
                      disabled={resolveDispute.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Release to Creator
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

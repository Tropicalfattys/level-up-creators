
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Eye, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/contracts';

interface Payment {
  id: string;
  user_id: string;
  creator_id?: string;
  service_id?: string;
  booking_id?: string;
  payment_type: string;
  network: string;
  currency: string;
  amount: number;
  tx_hash: string;
  admin_wallet_address: string;
  status: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
  users: {
    handle: string;
    email: string;
  };
  creator?: {
    users: {
      handle: string;
      email: string;
    };
  };
  services?: {
    title: string;
    description: string;
  };
}

export const AdminPayments = () => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey(handle, email),
          creator:users!payments_creator_id_fkey(handle, email),
          services(title, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    }
  });

  const updatePaymentStatus = async (paymentId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          verified_by: status === 'verified' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success(`Payment ${status} successfully`);
      refetch();
    } catch (error: any) {
      toast.error('Failed to update payment status: ' + error.message);
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const config = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
    return config ? `${config.explorerUrl}${txHash}` : '#';
  };

  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payments...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const verifiedPayments = payments?.filter(p => p.status === 'verified') || [];
  const rejectedPayments = payments?.filter(p => p.status === 'rejected') || [];

  return (
    <div className="space-y-6">
      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending Payments ({pendingPayments.length})
          </CardTitle>
          <CardDescription>
            Payments requiring verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No pending payments
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.users?.handle}</div>
                        <div className="text-sm text-muted-foreground">{payment.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.payment_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{NETWORK_CONFIG[payment.network as keyof typeof NETWORK_CONFIG]?.icon}</span>
                        <span className="capitalize">{payment.network}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updatePaymentStatus(payment.id, 'verified')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verified Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Payments ({verifiedPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {verifiedPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No verified payments
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Verified Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiedPayments.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.users?.handle}</div>
                        <div className="text-sm text-muted-foreground">{payment.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {payment.payment_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{NETWORK_CONFIG[payment.network as keyof typeof NETWORK_CONFIG]?.icon}</span>
                        <span className="capitalize">{payment.network}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell>
                      {payment.verified_at && new Date(payment.verified_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPaymentDetails(payment)}
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

      {/* Payment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete payment information and verification details
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment Information</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Amount:</strong> {selectedPayment.amount} {selectedPayment.currency}</div>
                    <div><strong>Network:</strong> {selectedPayment.network}</div>
                    <div><strong>Type:</strong> {selectedPayment.payment_type.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> 
                      <Badge className="ml-2" variant={selectedPayment.status === 'verified' ? 'default' : 'secondary'}>
                        {selectedPayment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>User:</strong> {selectedPayment.users?.handle}</div>
                    <div><strong>Email:</strong> {selectedPayment.users?.email}</div>
                    {selectedPayment.creator && (
                      <div><strong>Creator:</strong> {selectedPayment.creator.users?.handle}</div>
                    )}
                    {selectedPayment.services && (
                      <div><strong>Service:</strong> {selectedPayment.services.title}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Transaction Hash</h4>
                <div className="flex items-center gap-2">
                  <code className="bg-muted p-2 rounded flex-1 text-xs break-all">
                    {selectedPayment.tx_hash}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getExplorerUrl(selectedPayment.network, selectedPayment.tx_hash), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Admin Wallet Address</h4>
                <code className="bg-muted p-2 rounded block text-xs break-all">
                  {selectedPayment.admin_wallet_address}
                </code>
              </div>

              <div className="text-sm text-muted-foreground">
                <div><strong>Created:</strong> {new Date(selectedPayment.created_at).toLocaleString()}</div>
                {selectedPayment.verified_at && (
                  <div><strong>Verified:</strong> {new Date(selectedPayment.verified_at).toLocaleString()}</div>
                )}
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      updatePaymentStatus(selectedPayment.id, 'verified');
                      setShowDetails(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Verify Payment
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updatePaymentStatus(selectedPayment.id, 'rejected');
                      setShowDetails(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

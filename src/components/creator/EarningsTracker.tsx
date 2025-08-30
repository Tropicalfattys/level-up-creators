import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Clock, ExternalLink, CheckCircle } from 'lucide-react';

interface PaymentData {
  id: string;
  amount: number;
  network: string;
  tx_hash: string;
  payout_tx_hash: string | null;
  payout_status: string;
  created_at: string;
  paid_out_at: string | null;
  service: {
    title: string;
    price_usdc: number;
  };
  payer: {
    handle: string;
    email: string;
  };
  booking: {
    status: string;
    delivered_at: string | null;
  };
}

export const EarningsTracker = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async (): Promise<PaymentData[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          service:services!payments_service_id_fkey(title, price_usdc),
          payer:users!payments_user_id_fkey(handle, email),
          booking:bookings!payments_booking_id_fkey(status, delivered_at)
        `)
        .eq('creator_id', user.id)
        .eq('payment_type', 'service_booking')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const getExplorerUrl = (network: string, txHash: string) => {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      solana: `https://explorer.solana.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      sui: `https://explorer.sui.io/txblock/${txHash}`,
      cardano: `https://cardanoscan.io/transaction/${txHash}`
    };
    return explorers[network as keyof typeof explorers] || '#';
  };

  const getPayoutAmount = (amount: number) => {
    return Number(amount) * 0.85; // Creator receives 85%
  };

  const totalEarnings = earnings?.reduce((sum, payment) => sum + getPayoutAmount(payment.amount), 0) || 0;
  const completedPayouts = earnings?.filter(payment => payment.payout_status === 'completed') || [];
  const pendingPayouts = earnings?.filter(payment => payment.payout_status === 'pending') || [];
  const totalPaidOut = completedPayouts.reduce((sum, payment) => sum + getPayoutAmount(payment.amount), 0);
  const totalPending = pendingPayouts.reduce((sum, payment) => sum + getPayoutAmount(payment.amount), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading earnings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {earnings?.length || 0} completed services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaidOut.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {completedPayouts.length} payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayouts.length} payments processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Earnings History
          </CardTitle>
          <CardDescription>
            Track your service payments and payouts. You receive 85% of each payment after platform fees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Earnings</TabsTrigger>
              <TabsTrigger value="completed">Paid Out</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Payment Amount</TableHead>
                      <TableHead>Your Earning</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.service?.title || 'Unknown Service'}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.payer?.handle || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{payment.payer?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${payment.amount}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">${getPayoutAmount(payment.amount).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">85% share</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.network}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.payout_status === 'completed' ? 'default' : 
                              payment.payout_status === 'cancelled' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {payment.payout_status === 'completed' ? 'Paid Out' : 
                             payment.payout_status === 'pending' ? 'Processing' : 
                             payment.payout_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</div>
                          {payment.paid_out_at && (
                            <div className="text-xs text-green-600">
                              Paid: {new Date(payment.paid_out_at).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {/* Original payment transaction */}
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {payment.tx_hash.slice(0, 6)}...{payment.tx_hash.slice(-6)}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(getExplorerUrl(payment.network, payment.tx_hash), '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            {/* Payout transaction if available */}
                            {payment.payout_tx_hash && (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-green-100 px-2 py-1 rounded">
                                  {payment.payout_tx_hash.slice(0, 6)}...{payment.payout_tx_hash.slice(-6)}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(getExplorerUrl(payment.network, payment.payout_tx_hash!), '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount Received</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Payout Date</TableHead>
                      <TableHead>Payout Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedPayouts.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.service?.title || 'Unknown Service'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">${getPayoutAmount(payment.amount).toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.network}</Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paid_out_at && (
                            <div className="text-sm">{new Date(payment.paid_out_at).toLocaleDateString()}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.payout_tx_hash && (
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-green-100 px-2 py-1 rounded">
                                {payment.payout_tx_hash.slice(0, 8)}...{payment.payout_tx_hash.slice(-8)}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(getExplorerUrl(payment.network, payment.payout_tx_hash!), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.service?.title || 'Unknown Service'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-orange-600">${getPayoutAmount(payment.amount).toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.network}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Processing</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {(!earnings || earnings.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No earnings data available yet. Complete some services to see your earnings here!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

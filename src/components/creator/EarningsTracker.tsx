
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, Download, ExternalLink, Copy, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PaymentEarning {
  id: string;
  amount: number;
  tx_hash: string;
  network: string;
  currency: string;
  created_at: string;
  status: string;
  service_title: string;
  client_handle: string;
  client_email: string;
}

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  completedBookings: number;
  recentEarnings: PaymentEarning[];
}

export const EarningsTracker = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async (): Promise<EarningsData> => {
      if (!user?.id) return {
        totalEarnings: 0,
        monthlyEarnings: 0,
        pendingEarnings: 0,
        completedBookings: 0,
        recentEarnings: []
      };

      // Get payments where this user is the creator
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          payer:users!payments_user_id_fkey (handle, email),
          service:services!payments_service_id_fkey (title)
        `)
        .eq('creator_id', user.id)
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      // Get bookings for pending earnings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          client:users!bookings_client_id_fkey (handle, email)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate total earnings from verified payments (85% after platform fee)
      const totalGross = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const totalEarnings = totalGross * 0.85; // Creator gets 85%

      // Calculate this month's earnings
      const thisMonthPayments = payments?.filter(p => new Date(p.created_at) >= thisMonth) || [];
      const monthlyGross = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const monthlyEarnings = monthlyGross * 0.85;

      // Calculate pending earnings from active bookings
      const pendingBookings = bookings?.filter(b => ['paid', 'in_progress', 'delivered'].includes(b.status)) || [];
      const pendingGross = pendingBookings.reduce((sum, b) => sum + Number(b.usdc_amount || 0), 0);
      const pendingEarnings = pendingGross * 0.85;

      // Get completed bookings count
      const completedBookingsCount = bookings?.filter(b => ['accepted', 'released'].includes(b.status))?.length || 0;

      // Format recent earnings from payments
      const recentEarnings: PaymentEarning[] = payments?.slice(0, 10).map(p => ({
        id: p.id,
        amount: Number(p.amount || 0) * 0.85, // Show creator's 85% share
        tx_hash: p.tx_hash,
        network: p.network,
        currency: p.currency,
        created_at: p.created_at,
        status: p.status,
        service_title: p.service?.title || 'Unknown Service',
        client_handle: p.payer?.handle || 'Unknown',
        client_email: p.payer?.email || 'Unknown'
      })) || [];

      return {
        totalEarnings,
        monthlyEarnings,
        pendingEarnings,
        completedBookings: completedBookingsCount,
        recentEarnings
      };
    },
    enabled: !!user?.id
  });

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

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

  if (isLoading) {
    return <div className="text-center py-8">Loading earnings data...</div>;
  }

  if (!earnings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Earnings Overview</h3>
        <p className="text-muted-foreground">
          Track your earnings and payment history (85% creator share after 15% platform fee)
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {earnings.completedBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.monthlyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current month earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              In progress bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full">
              <Download className="h-3 w-3 mr-1" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings with Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your latest verified payments with transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.recentEarnings.length > 0 ? (
            <div className="space-y-4">
              {earnings.recentEarnings.map((earning) => (
                <div key={earning.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{earning.service_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Client: @{earning.client_handle} ({earning.client_email})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(earning.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        ${earning.amount.toFixed(2)} {earning.currency?.toUpperCase()}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {earning.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-muted/50 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Transaction Hash:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {earning.tx_hash.slice(0, 8)}...{earning.tx_hash.slice(-8)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyTxHash(earning.tx_hash)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(getExplorerUrl(earning.network, earning.tx_hash), '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Network:</span>
                      <Badge variant="secondary" className="text-xs">
                        {earning.network?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Full Transaction:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getExplorerUrl(earning.network, earning.tx_hash), '_blank')}
                        className="h-6 text-xs"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No verified payments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Payments will appear here once they are verified by the admin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

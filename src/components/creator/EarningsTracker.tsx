
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, ExternalLink } from 'lucide-react';

interface BookingData {
  id: string;
  usdc_amount: number;
  tx_hash: string;
  chain: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  accepted_at: string | null;
  service: {
    title: string;
    price_usdc: number;
  };
  client: {
    handle: string;
    email: string;
  };
}

export const EarningsTracker = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async (): Promise<BookingData[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services!bookings_service_id_fkey(title, price_usdc),
          client:users!bookings_client_id_fkey(handle, email)
        `)
        .eq('creator_id', user.id)
        .in('status', ['accepted', 'released'])
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

  const getCreatorEarnings = (amount: number) => {
    return Number(amount) * 0.85; // Creator receives 85%
  };

  const totalEarnings = earnings?.reduce((sum, booking) => sum + getCreatorEarnings(booking.usdc_amount), 0) || 0;

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
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings?.filter(e => {
                const date = new Date(e.accepted_at || e.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).reduce((sum, booking) => sum + getCreatorEarnings(booking.usdc_amount), 0).toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Service</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings?.length ? (totalEarnings / earnings.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed service
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
            Track your service payments. You receive 85% of each payment after platform fees.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {earnings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.service?.title || 'Unknown Service'}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.client?.handle || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{booking.client?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${booking.usdc_amount}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">${getCreatorEarnings(booking.usdc_amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">85% share</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.chain}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {booking.status === 'accepted' ? 'Completed' : 'Released'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(booking.created_at).toLocaleDateString()}</div>
                      {booking.accepted_at && (
                        <div className="text-xs text-green-600">
                          Completed: {new Date(booking.accepted_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.tx_hash ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {booking.tx_hash.slice(0, 6)}...{booking.tx_hash.slice(-6)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getExplorerUrl(booking.chain || 'ethereum', booking.tx_hash), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No hash</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

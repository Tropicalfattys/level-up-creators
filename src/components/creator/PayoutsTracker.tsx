
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { getExplorerUrl } from "@/lib/utils";

interface PayoutRecord {
  id: string;
  amount: number;
  payout_tx_hash: string | null;
  network: string;
  created_at: string;
  paid_out_at: string | null;
  service_id: string;
  services: {
    title: string;
  } | null;
}

export const PayoutsTracker = () => {
  const { user } = useAuth();
  const [selectedView, setSelectedView] = useState<"pending" | "completed">("pending");

  const { data: payouts, isLoading, error } = useQuery({
    queryKey: ['creator-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payout_tx_hash,
          network,
          created_at,
          paid_out_at,
          service_id,
          services:services!payments_service_id_fkey (
            title
          )
        `)
        .eq('creator_id', user.id)
        .eq('payment_type', 'service_booking')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  // Filter based on whether payout_tx_hash exists instead of payout_status
  const pendingPayouts = payouts?.filter(p => !p.payout_tx_hash) || [];
  const completedPayouts = payouts?.filter(p => p.payout_tx_hash) || [];

  const formatAmount = (amount: number) => {
    // Calculate 85% of the original amount (platform takes 15%)
    const payoutAmount = amount * 0.85;
    return payoutAmount.toFixed(2);
  };

  // Using centralized explorer URL utility

  const PayoutCard = ({ payout, isPending }: { payout: PayoutRecord; isPending: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isPending ? (
              <Clock className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium">
              {payout.services?.title || 'Service'}
            </span>
          </div>
          <Badge variant={isPending ? "secondary" : "default"}>
            {isPending ? 'Pending' : 'Paid Out'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Payout Amount:</span>
            <span className="font-semibold">${formatAmount(payout.amount)} USDC</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className="text-sm capitalize">{payout.network}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              {isPending ? 'Payment Date:' : 'Paid Out:'}
            </span>
            <span className="text-sm">
              {new Date(isPending ? payout.created_at : payout.paid_out_at || payout.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {!isPending && payout.payout_tx_hash && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Transaction:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getExplorerUrl(payout.network, payout.payout_tx_hash!), '_blank')}
                className="flex items-center gap-1"
              >
                <span className="text-xs">
                  {payout.payout_tx_hash.slice(0, 8)}...{payout.payout_tx_hash.slice(-6)}
                </span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payouts...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading payouts. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
          <CardDescription>
            Track your pending and completed payouts from completed services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedView} onValueChange={(value: "pending" | "completed") => setSelectedView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectedView === "pending" ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending ({pendingPayouts.length})
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed ({completedPayouts.length})
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingPayouts.length})
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed ({completedPayouts.length})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {selectedView === "pending" && (
              <>
                {pendingPayouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending payouts</p>
                    <p className="text-sm">Payouts will appear here after services are completed and verified.</p>
                  </div>
                ) : (
                  <div>
                    {pendingPayouts.map((payout) => (
                      <PayoutCard key={payout.id} payout={payout} isPending={true} />
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedView === "completed" && (
              <>
                {completedPayouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed payouts yet</p>
                    <p className="text-sm">Completed payouts will appear here with transaction details.</p>
                  </div>
                ) : (
                  <div>
                    {completedPayouts.map((payout) => (
                      <PayoutCard key={payout.id} payout={payout} isPending={false} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

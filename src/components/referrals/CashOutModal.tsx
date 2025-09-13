import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCredits: number;
}

export const CashOutModal = ({ open, onOpenChange, availableCredits }: CashOutModalProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's existing cash-out requests
  const { data: existingCashouts } = useQuery({
    queryKey: ['user-cashouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('referral_cashouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Cash out mutation
  const cashOutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (availableCredits < 10) throw new Error('Minimum cash out is $10');
      if (!selectedCurrency || !selectedNetwork || !selectedWallet) {
        throw new Error('Please select currency, network, and wallet address');
      }

      // Insert cash-out request
      const { error: insertError } = await supabase
        .from('referral_cashouts')
        .insert({
          user_id: user.id,
          credit_amount: availableCredits,
          selected_currency: selectedCurrency,
          selected_network: selectedNetwork,
          payout_address: selectedWallet,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Zero out user's referral credits
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_credits: 0 })
        .eq('id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Cash-out request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-cashouts'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit cash-out request: ${error.message}`);
    }
  });

  const resetForm = () => {
    setSelectedCurrency('');
    setSelectedNetwork('');
    setSelectedWallet('');
  };

  const getWalletOptions = () => {
    if (!userProfile) return [];
    
    const wallets = [];
    
    if (selectedNetwork === 'ethereum' && userProfile.payout_address_eth) {
      wallets.push({ label: 'Ethereum Wallet', value: userProfile.payout_address_eth });
    }
    if (selectedNetwork === 'base' && userProfile.payout_address_eth) {
      wallets.push({ label: 'Base Wallet (Use ETH Address)', value: userProfile.payout_address_eth });
    }
    if (selectedNetwork === 'solana' && userProfile.payout_address_sol) {
      wallets.push({ label: 'Solana Wallet', value: userProfile.payout_address_sol });
    }
    if (selectedNetwork === 'bsc' && userProfile.payout_address_bsc) {
      wallets.push({ label: 'BSC Wallet', value: userProfile.payout_address_bsc });
    }
    
    return wallets;
  };

  const walletOptions = getWalletOptions();
  const canSubmit = selectedCurrency && selectedNetwork && selectedWallet && availableCredits >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cash Out Referral Credits
          </DialogTitle>
          <DialogDescription>
            Convert your referral credits to USDC or USDM. Minimum cash out is $10.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Credits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Available Credits</CardTitle>
              <CardDescription>
                Your current referral credit balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">${availableCredits}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {availableCredits < 10 ? 'Minimum $10 required for cash out' : 'Ready for cash out'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cash Out Form */}
          {availableCredits >= 10 ? (
            <div className="space-y-4">
              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency">Select Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose USDC or USDM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                    <SelectItem value="USDM">USDM (Mountain Protocol USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Network Selection */}
              <div className="space-y-2">
                <Label htmlFor="network">Select Network</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose blockchain network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="bsc">BSC (Binance Smart Chain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Address Selection */}
              {selectedNetwork && (
                <div className="space-y-2">
                  <Label htmlFor="wallet">Select Wallet Address</Label>
                  {walletOptions.length > 0 ? (
                    <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose wallet address" />
                      </SelectTrigger>
                      <SelectContent>
                        {walletOptions.map((wallet) => (
                          <SelectItem key={wallet.value} value={wallet.value}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{wallet.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {wallet.value.slice(0, 8)}...{wallet.value.slice(-6)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No wallet address found for {selectedNetwork}. Please add a wallet address in your Settings → Payments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={() => cashOutMutation.mutate()}
                disabled={!canSubmit || cashOutMutation.isPending}
                className="w-full"
              >
                {cashOutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Cash Out...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Cash Out ${availableCredits}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need at least $10 in referral credits to request a cash out. 
                Keep referring friends to earn more credits!
              </AlertDescription>
            </Alert>
          )}

          {/* Existing Cash Outs */}
          {existingCashouts && existingCashouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Cash-Out Requests</CardTitle>
                <CardDescription>
                  Your previous cash-out requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingCashouts.slice(0, 3).map((cashout) => (
                    <div key={cashout.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${cashout.credit_amount}</span>
                          <Badge variant="outline">{cashout.selected_currency}</Badge>
                          <Badge variant="outline">{cashout.selected_network}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Requested {new Date(cashout.requested_at).toLocaleDateString()}
                        </p>
                        {cashout.tx_hash && (
                          <p className="text-xs text-muted-foreground">
                            TX: {cashout.tx_hash.slice(0, 8)}...{cashout.tx_hash.slice(-6)}
                          </p>
                        )}
                      </div>
                      <Badge variant={cashout.status === 'completed' ? 'default' : 'secondary'}>
                        {cashout.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

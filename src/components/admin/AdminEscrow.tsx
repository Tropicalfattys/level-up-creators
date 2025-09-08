import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Save, X, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { validateWalletAddress } from "@/lib/walletValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlatformWallet {
  id: string;
  network: string;
  name: string;
  wallet_address: string;
  icon_url: string | null;
  explorer_url: string | null;
  color_class: string | null;
  active: boolean;
  updated_at: string;
}

export function AdminEscrow() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; address: string } | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['platform-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_wallets')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as PlatformWallet[];
    }
  });

  const updateWalletMutation = useMutation({
    mutationFn: async ({ id, address }: { id: string; address: string }) => {
      const { error } = await supabase
        .from('platform_wallets')
        .update({ 
          wallet_address: address,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-wallets'] });
      toast.success('Wallet address updated successfully');
      setEditingId(null);
      setEditAddress("");
    },
    onError: (error) => {
      toast.error('Failed to update wallet address: ' + error.message);
    }
  });

  const handleEdit = (wallet: PlatformWallet) => {
    setEditingId(wallet.id);
    setEditAddress(wallet.wallet_address);
  };

  const handleSave = (wallet: PlatformWallet) => {
    if (editAddress === wallet.wallet_address) {
      setEditingId(null);
      return;
    }

    // Validate the new address
    const networkMapping: { [key: string]: string } = {
      'ethereum': 'ethereum',
      'base': 'ethereum', // Base uses same format as Ethereum
      'solana': 'solana',
      'bsc': 'ethereum', // BSC uses same format as Ethereum
      'sui': 'sui',
      'cardano': 'sui' // For now, using sui validation as it's similar length
    };

    const validationNetwork = networkMapping[wallet.network] || 'ethereum';
    const validation = validateWalletAddress(editAddress, validationNetwork as any);
    
    if (!validation.isValid) {
      toast.error(`Invalid ${wallet.name} address: ${validation.error}`);
      return;
    }

    setPendingUpdate({ id: wallet.id, address: editAddress });
    setShowConfirmDialog(true);
  };

  const confirmUpdate = () => {
    if (pendingUpdate) {
      updateWalletMutation.mutate(pendingUpdate);
      setPendingUpdate(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAddress("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escrow Wallet Management</CardTitle>
          <CardDescription>
            Manage platform escrow wallet addresses for different blockchains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading wallet addresses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Escrow Wallet Management</CardTitle>
          <CardDescription>
            Manage platform escrow wallet addresses where clients send payments for services and subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wallets?.map((wallet) => (
              <div key={wallet.id} className={`p-4 border rounded-lg ${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
                <div className={`${isMobile ? 'space-y-3' : 'flex items-center space-x-4'}`}>
                  <div className={`${isMobile ? 'flex items-center space-x-3' : 'flex items-center space-x-4'}`}>
                    {wallet.icon_url && (
                      <img 
                        src={wallet.icon_url} 
                        alt={wallet.name} 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center space-x-2'}`}>
                        <h3 className="font-medium">{wallet.name}</h3>
                        <Badge variant="outline">{wallet.network}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="min-w-0">
                    {editingId === wallet.id ? (
                      <div className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-2'} mt-2`}>
                        <Input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Enter wallet address"
                          className="font-mono text-xs min-w-0"
                        />
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSave(wallet)}
                            disabled={updateWalletMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex items-center space-x-2'}`}>
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {isMobile && wallet.wallet_address.length > 30 
                              ? `${wallet.wallet_address.slice(0, 15)}...${wallet.wallet_address.slice(-15)}`
                              : wallet.wallet_address.length > 50 
                                ? `${wallet.wallet_address.slice(0, 20)}...${wallet.wallet_address.slice(-20)}`
                                : wallet.wallet_address
                            }
                          </code>
                          {wallet.explorer_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`${wallet.explorer_url}${wallet.wallet_address}`, '_blank')}
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last updated: {new Date(wallet.updated_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingId !== wallet.id && (
                  <div className={`${isMobile ? '' : 'flex-shrink-0'}`}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(wallet)}
                      className={`${isMobile ? 'w-full' : ''}`}
                    >
                      <Edit2 className="w-4 h-4" />
                      {isMobile && <span className="ml-2">Edit Address</span>}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Wallet Address Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this wallet address? This will affect all future payments to this blockchain.
              <br /><br />
              <strong>New Address:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                {pendingUpdate?.address}
              </code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>
              Update Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
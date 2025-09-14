import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, ExternalLink, Check, Clock, DollarSign, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface CashOutRequest {
  id: string;
  user_id: string;
  credit_amount: number;
  selected_currency: string;
  selected_network: string;
  payout_address: string;
  status: string;
  tx_hash: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  user?: {
    handle: string;
    email: string;
  } | null;
}

export const CashOutManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CashOutRequest | null>(null);
  const [txHash, setTxHash] = useState('');
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch cash-out requests using two-query approach
  const { data: cashOutRequests, isLoading } = useQuery({
    queryKey: ['admin-cashout-requests', searchTerm],
    queryFn: async () => {
      // First query: Get all referral_cashouts
      const { data: cashoutData, error: cashoutError } = await supabase
        .from('referral_cashouts')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(50);

      if (cashoutError) throw cashoutError;
      if (!cashoutData || cashoutData.length === 0) return [];

      // Second query: Get users data for the user_ids
      const userIds = cashoutData.map(request => request.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, handle, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Merge data in JavaScript
      const requestsWithUsers = cashoutData.map(request => ({
        ...request,
        user: usersData?.find(user => user.id === request.user_id) || null
      }));

      // Apply search filter if needed
      if (searchTerm.trim()) {
        return requestsWithUsers.filter(request => {
          const searchLower = searchTerm.toLowerCase();
          return (
            request.user?.handle?.toLowerCase().includes(searchLower) ||
            request.user?.email?.toLowerCase().includes(searchLower) ||
            request.tx_hash?.toLowerCase().includes(searchLower)
          );
        });
      }

      return requestsWithUsers as CashOutRequest[];
    }
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['cashout-stats'],
    queryFn: async () => {
      const { data: allRequests } = await supabase
        .from('referral_cashouts')
        .select('credit_amount, status');

      const total = allRequests?.length || 0;
      const pending = allRequests?.filter(r => r.status === 'pending').length || 0;
      const completed = allRequests?.filter(r => r.status === 'completed').length || 0;
      const totalAmount = allRequests?.reduce((sum, r) => sum + Number(r.credit_amount || 0), 0) || 0;
      const completedAmount = allRequests?.filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.credit_amount || 0), 0) || 0;

      return {
        total,
        pending,
        completed,
        totalAmount,
        completedAmount
      };
    }
  });

  // Process cash-out request mutation
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, transactionHash }: { requestId: string, transactionHash: string }) => {
      const { error } = await supabase
        .from('referral_cashouts')
        .update({
          tx_hash: transactionHash,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cash-out request processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-cashout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['cashout-stats'] });
      setIsProcessDialogOpen(false);
      setTxHash('');
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process request: ${error.message}`);
    }
  });

  const handleProcessRequest = (request: CashOutRequest) => {
    setSelectedRequest(request);
    setIsProcessDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const normalizedNetwork = network.toLowerCase();
    
    switch (normalizedNetwork) {
      case 'ethereum':
      case 'eth':
        return `https://etherscan.io/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      case 'bsc':
      case 'binance':
        return `https://bscscan.com/tx/${txHash}`;
      case 'solana':
      case 'sol':
        return `https://solscan.io/tx/${txHash}`;
      case 'sui':
        return `https://suiscan.xyz/mainnet/tx/${txHash}`;
      case 'cardano':
      case 'ada':
        return `https://cardanoscan.io/transaction/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All cash-out requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalAmount.toFixed(2) || 0}</div>
            <p className="text-xs text-muted-foreground">${stats?.completedAmount.toFixed(2) || 0} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash-Out Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash-Out Requests</CardTitle>
          <CardDescription>Manage referral credit cash-out requests and process payouts</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {cashOutRequests?.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">@{request.user?.handle}</div>
                          <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">${request.credit_amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Currency:</span>
                            <Badge variant="outline">{request.selected_currency}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Network:</span>
                            <Badge variant="outline">{request.selected_network}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Requested:</span>
                            <span>{format(new Date(request.requested_at), 'MMM dd, yyyy')}</span>
                          </div>
                          {request.tx_hash && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">TX Hash:</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{request.tx_hash.slice(0, 8)}...{request.tx_hash.slice(-6)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(getExplorerUrl(request.selected_network, request.tx_hash!), '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessRequest(request)}
                            className="w-full mt-2"
                          >
                            Process Cash-Out
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashOutRequests?.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">@{request.user?.handle}</div>
                            <div className="text-sm text-muted-foreground">{request.user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${request.credit_amount}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.selected_currency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.selected_network}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[150px]">
                            <span className="text-xs truncate">
                              {request.payout_address.slice(0, 8)}...{request.payout_address.slice(-6)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(request.payout_address, 'Wallet address')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(request.requested_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.tx_hash ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs">
                                {request.tx_hash.slice(0, 8)}...{request.tx_hash.slice(-6)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(getExplorerUrl(request.selected_network, request.tx_hash!), '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessRequest(request)}
                            >
                              Process
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!cashOutRequests || cashOutRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cash-out requests found
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Process Cash-Out Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Cash-Out Request</DialogTitle>
            <DialogDescription>
              Add the transaction hash to complete this cash-out request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Request Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-medium">@{selectedRequest.user?.handle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">${selectedRequest.credit_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="outline">{selectedRequest.selected_currency}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <Badge variant="outline">{selectedRequest.selected_network}</Badge>
                  </div>
                  <div className="grid gap-2">
                    <span className="text-muted-foreground">Payout Address:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded flex-1 truncate">
                        {selectedRequest.payout_address}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedRequest.payout_address, 'Wallet address')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Hash Input */}
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash</Label>
                <Input
                  id="txHash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Enter the transaction hash from the blockchain..."
                />
              </div>

              <Alert>
                <AlertDescription>
                  After adding the transaction hash, this request will be marked as completed and the user will be notified.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => processRequestMutation.mutate({ 
                    requestId: selectedRequest.id, 
                    transactionHash: txHash 
                  })}
                  disabled={!txHash.trim() || processRequestMutation.isPending}
                  className="flex-1"
                >
                  {processRequestMutation.isPending ? 'Processing...' : 'Complete Cash-Out'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProcessDialogOpen(false);
                    setTxHash('');
                    setSelectedRequest(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
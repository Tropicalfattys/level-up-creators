
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Search, Shield, DollarSign, Plus, ShieldX, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email?: string;
  role?: string;
  handle?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  portfolio_url?: string;
  youtube_url?: string;
  social_links?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    telegram?: string;
    discord?: string;
    medium?: string;
    linkedin?: string;
  };
  created_at?: string;
  updated_at?: string;
  referral_code?: string;
  referral_credits?: number;
  referred_by?: string;
  payout_address_eth?: string;
  payout_address_sol?: string;
  payout_address_cardano?: string;
  payout_address_bsc?: string;
  payout_address_sui?: string;
  banned?: boolean;
}

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    handle: '',
    role: 'client'
  });
  const queryClient = useQueryClient();

  // Super admin email that cannot be demoted
  const SUPER_ADMIN_EMAIL = 'michaelweston1515@gmail.com';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role: ' + (error.message || 'Unknown error'));
    }
  });

  const createUser = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      console.log('Calling create-admin-user edge function with:', { 
        email: userData.email, 
        handle: userData.handle, 
        role: userData.role 
      });

      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: userData.email,
          password: userData.password,
          handle: userData.handle,
          role: userData.role
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('User created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
      setIsCreateUserOpen(false);
      setNewUserData({ email: '', password: '', handle: '', role: 'client' });
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error.message || 'Unknown error'));
    }
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'creator': return 'default';
      case 'client': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.password || !newUserData.handle) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUser.mutate(newUserData);
  };

  const handleMakeAdmin = (userId: string) => {
    updateUserRole.mutate({ userId, newRole: 'admin' });
  };

  const handleRemoveAdmin = (userId: string) => {
    updateUserRole.mutate({ userId, newRole: 'client' });
  };

  const isSuperAdmin = (email: string) => {
    return email === SUPER_ADMIN_EMAIL;
  };

  const viewUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage platform users and their roles
              </CardDescription>
            </div>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with the specified role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="handle">Username/Handle</Label>
                    <Input
                      id="handle"
                      value={newUserData.handle}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, handle: e.target.value }))}
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUser.isPending}>
                    {createUser.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    {user.handle?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.handle || 'No username'}</p>
                      {user.banned && (
                        <Badge variant="destructive" className="text-xs">
                          BANNED
                        </Badge>
                      )}
                      {isSuperAdmin(user.email || '') && (
                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                          SUPER ADMIN
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Badge variant={roleColor(user.role || 'client')}>
                      {user.role || 'client'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewUserDetails(user)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  {user.referral_credits && user.referral_credits > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${user.referral_credits}
                    </Badge>
                  )}
                  
                  {/* Admin Controls */}
                  {!isSuperAdmin(user.email || '') && (
                    <>
                      {/* Make Admin Button - only show for non-admin users */}
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMakeAdmin(user.id)}
                          disabled={updateUserRole.isPending}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Make Admin
                        </Button>
                      )}
                      
                      {/* Remove Admin Button - only show for admin users (except super admin) */}
                      {user.role === 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveAdmin(user.id)}
                          disabled={updateUserRole.isPending}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <ShieldX className="h-3 w-3 mr-1" />
                          Remove Admin
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!filteredUsers || filteredUsers.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedUser?.handle || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Handle:</strong> {selectedUser.handle || 'Not set'}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Role:</strong> {selectedUser.role || 'client'}</div>
                    <div><strong>Bio:</strong> {selectedUser.bio || 'Not set'}</div>
                    <div><strong>Website:</strong> {selectedUser.website_url || 'Not set'}</div>
                    <div><strong>Portfolio:</strong> {selectedUser.portfolio_url || 'Not set'}</div>
                    <div><strong>YouTube:</strong> {selectedUser.youtube_url || 'Not set'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Social Links</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Twitter:</strong> {selectedUser.social_links?.twitter || 'Not set'}</div>
                    <div><strong>Instagram:</strong> {selectedUser.social_links?.instagram || 'Not set'}</div>
                    <div><strong>LinkedIn:</strong> {selectedUser.social_links?.linkedin || 'Not set'}</div>
                    <div><strong>Facebook:</strong> {selectedUser.social_links?.facebook || 'Not set'}</div>
                    <div><strong>Discord:</strong> {selectedUser.social_links?.discord || 'Not set'}</div>
                    <div><strong>Medium:</strong> {selectedUser.social_links?.medium || 'Not set'}</div>
                    <div><strong>Telegram:</strong> {selectedUser.social_links?.telegram || 'Not set'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payout Wallet Addresses</h4>
                  <div className="space-y-3 text-sm">
                    {selectedUser.payout_address_eth && (
                      <div>
                        <strong>Ethereum:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedUser.payout_address_eth}
                        </div>
                      </div>
                    )}
                    {selectedUser.payout_address_sol && (
                      <div>
                        <strong>Solana:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedUser.payout_address_sol}
                        </div>
                      </div>
                    )}
                    {selectedUser.payout_address_bsc && (
                      <div>
                        <strong>BSC:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedUser.payout_address_bsc}
                        </div>
                      </div>
                    )}
                    {selectedUser.payout_address_sui && (
                      <div>
                        <strong>SUI:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedUser.payout_address_sui}
                        </div>
                      </div>
                    )}
                    {selectedUser.payout_address_cardano && (
                      <div>
                        <strong>Cardano:</strong>
                        <div className="bg-muted p-2 rounded font-mono text-xs break-all mt-1">
                          {selectedUser.payout_address_cardano}
                        </div>
                      </div>
                    )}
                  </div>
                  {!selectedUser.payout_address_eth && 
                   !selectedUser.payout_address_sol && 
                   !selectedUser.payout_address_bsc && 
                   !selectedUser.payout_address_sui && 
                   !selectedUser.payout_address_cardano && (
                    <div className="text-muted-foreground text-sm">
                      No payout addresses configured
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Account Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Referral Code:</strong> {selectedUser.referral_code || 'Not generated'}</div>
                    <div><strong>Referral Credits:</strong> ${selectedUser.referral_credits || 0}</div>
                    <div><strong>Status:</strong> {selectedUser.banned ? 'Banned' : 'Active'}</div>
                    <div><strong>Joined:</strong> {new Date(selectedUser.created_at || '').toLocaleDateString()}</div>
                    {selectedUser.updated_at && (
                      <div><strong>Last Updated:</strong> {new Date(selectedUser.updated_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

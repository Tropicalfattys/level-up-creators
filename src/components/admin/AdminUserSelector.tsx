import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: string;
  handle: string;
  email: string;
  role: string;
  referral_credits: number;
  verified: boolean;
  banned: boolean;
}

interface AdminUserSelectorProps {
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
  placeholder?: string;
}

export const AdminUserSelector = ({ selectedUserId, onUserSelect, placeholder = "Search users..." }: AdminUserSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all users with search functionality
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-all-users', searchQuery, showDropdown],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, handle, email, role, referral_credits, verified, banned')
        .order('handle');

      if (searchQuery.trim()) {
        const cleanQuery = searchQuery.trim().replace('@', '');
        query = query.or(`handle.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,id.eq.${searchQuery}`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as User[];
    },
    enabled: showDropdown,
  });

  // Get selected user details
  const { data: selectedUser } = useQuery({
    queryKey: ['admin-selected-user', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('id, handle, email, role, referral_credits, verified, banned')
        .eq('id', selectedUserId)
        .single();
      if (error) throw error;
      return data as User;
    },
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-selector]')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" data-user-selector>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={selectedUser ? `@${selectedUser.handle}` : searchQuery}
          onChange={(e) => {
            if (selectedUser) {
              // If user is selected, clear selection on typing
              onUserSelect('');
              setSearchQuery(e.target.value);
            } else {
              setSearchQuery(e.target.value);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10"
        />
      </div>

      {/* Selected User Display */}
      {selectedUser && !showDropdown && (
        <Card className="mt-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">@{selectedUser.handle}</span>
                {selectedUser.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
              </div>
              <Badge variant="outline" className="text-xs">{selectedUser.role}</Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {selectedUser.referral_credits || 0}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{selectedUser.email}</div>
        </Card>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No users found' : 'Start typing to search users'}
              </div>
            ) : (
              <div className="p-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => {
                      onUserSelect(user.id);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">@{user.handle}</span>
                        {user.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        {user.banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                      </div>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {user.referral_credits || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
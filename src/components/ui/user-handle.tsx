import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VerificationBadge } from './verification-badge';
import { AdminBadge } from './admin-badge';

interface UserHandleProps {
  handle?: string;
  userId?: string;
  className?: string;
  showAt?: boolean;
}

export const UserHandle = ({ 
  handle, 
  userId, 
  className = "", 
  showAt = true 
}: UserHandleProps) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-verification', handle || userId],
    queryFn: async (): Promise<{ handle: string; verified: boolean; role: string }> => {
      if (!handle && !userId) {
        throw new Error('Either handle or userId must be provided');
      }

      let result;
      if (handle) {
        const { data, error } = await supabase.rpc('get_public_profile_by_handle', { 
          handle_param: handle 
        });
        if (error) throw error;
        result = data?.[0];
      } else {
        const { data, error } = await supabase.rpc('get_public_profile', { 
          user_id_param: userId 
        });
        if (error) throw error;
        result = data?.[0];
      }
      
      if (!result) throw new Error('User not found');
      return { handle: result.handle, verified: result.verified, role: result.role };
    },
    enabled: !!(handle || userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {showAt && '@'}{handle || '...'}
      </span>
    );
  }

  if (!user) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {showAt && '@'}{handle || 'Unknown'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      {showAt && '@'}{user.handle}
      <VerificationBadge verified={user.verified} role={user.role} />
      <AdminBadge role={user.role} />
    </span>
  );
};
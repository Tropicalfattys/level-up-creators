import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VerificationBadge } from './verification-badge';

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
    queryFn: async (): Promise<{ handle: string; verified: boolean }> => {
      if (!handle && !userId) {
        throw new Error('Either handle or userId must be provided');
      }

      let query = supabase
        .from('users')
        .select('handle, verified');

      if (handle) {
        query = query.eq('handle', handle);
      } else {
        query = query.eq('id', userId);
      }

      const { data, error } = await query.single();
      
      if (error) throw error;
      return data;
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
      <VerificationBadge verified={user.verified} />
    </span>
  );
};
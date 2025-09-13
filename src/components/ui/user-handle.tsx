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
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['user-verification-v2', handle || userId, 'with-role'],
    queryFn: async (): Promise<{ handle: string; verified: boolean; role: string }> => {
      if (!handle && !userId) {
        throw new Error('Either handle or userId must be provided');
      }

      console.log('🔍 UserHandle: Fetching user data for', handle || userId);
      
      let result;
      if (handle) {
        const { data, error } = await supabase.rpc('get_public_profile_by_handle', { 
          handle_param: handle 
        });
        if (error) {
          console.error('❌ UserHandle: Error fetching by handle:', error);
          throw error;
        }
        result = data?.[0];
      } else {
        const { data, error } = await supabase.rpc('get_public_profile', { 
          user_id_param: userId 
        });
        if (error) {
          console.error('❌ UserHandle: Error fetching by userId:', error);
          throw error;
        }
        result = data?.[0];
      }
      
      if (!result) {
        console.warn('⚠️ UserHandle: User not found for', handle || userId);
        throw new Error('User not found');
      }
      
      console.log('✅ UserHandle: Fetched user data:', { 
        handle: result.handle, 
        verified: result.verified, 
        role: result.role 
      });
      
      // Ensure we have role data - retry if missing
      if (!result.role) {
        console.warn('⚠️ UserHandle: Missing role data, retrying...');
        throw new Error('Missing role data - retrying');
      }
      
      return { 
        handle: result.handle || handle || 'Unknown', 
        verified: Boolean(result.verified), 
        role: result.role || 'client' 
      };
    },
    enabled: !!(handle || userId),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for better updates)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for missing role data
      if (error?.message?.includes('Missing role data') && failureCount < 2) {
        console.log('🔄 UserHandle: Retrying due to missing role data, attempt', failureCount + 1);
        return true;
      }
      return failureCount < 1;
    },
    retryDelay: 1000, // 1 second delay between retries
  });

  if (isLoading) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {showAt && '@'}{handle || '...'}
        <div className="inline-block w-5 h-5 ml-1 bg-muted animate-pulse rounded" />
      </span>
    );
  }

  if (error) {
    console.error('❌ UserHandle: Error loading user:', error);
    return (
      <span className={`inline-flex items-center ${className}`}>
        {showAt && '@'}{handle || 'Unknown'}
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
      {user.role === 'admin' ? (
        <AdminBadge role={user.role} />
      ) : (
        <VerificationBadge verified={user.verified} role={user.role} />
      )}
    </span>
  );
};
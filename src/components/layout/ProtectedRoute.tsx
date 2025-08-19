
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'creator' | 'admin';
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  // Check if user has an approved creator profile when requiring creator role
  const { data: creatorProfile, isLoading: creatorLoading } = useQuery({
    queryKey: ['creator-profile-check', user?.id],
    queryFn: async () => {
      if (!user?.id || requiredRole !== 'creator') return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('approved')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id && requiredRole === 'creator'
  });

  if (loading || (requiredRole === 'creator' && creatorLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && requiredRole === 'creator') {
    // For creator role, check both user role AND approved creator profile
    const hasAccess = (userRole === 'creator' || userRole === 'admin') && creatorProfile?.approved === true;
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

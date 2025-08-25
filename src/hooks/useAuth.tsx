import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define UserProfile type directly until types are regenerated
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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  userProfile: null,
  refreshProfile: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        console.log('User profile fetched successfully:', data);
        
        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          role: data.role,
          handle: data.handle,
          avatar_url: data.avatar_url,
          bio: data.bio,
          website_url: data.website_url,
          portfolio_url: data.portfolio_url,
          youtube_url: data.youtube_url,
          social_links: data.social_links as UserProfile['social_links'],
          created_at: data.created_at,
          updated_at: data.updated_at,
          referral_code: data.referral_code,
          referral_credits: data.referral_credits,
          referred_by: data.referred_by
        };
        
        setUserProfile(userProfile);
        setUserRole(data.role || 'client');
      } else if (error) {
        console.error('Error fetching user profile:', error);
        // Don't set null profile on error, keep existing state
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return; // Prevent state updates if component unmounted
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Use setTimeout to prevent auth callback deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 100);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        setTimeout(() => {
          if (mounted) {
            fetchUserProfile(session.user.id);
          }
        }, 100);
      }
      
      setLoading(false);
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      userProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

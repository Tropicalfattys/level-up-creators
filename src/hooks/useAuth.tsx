
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define UserProfile type to match actual database schema
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
  verified?: boolean;
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
      console.log('Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('User profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
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
          referred_by: data.referred_by,
          payout_address_eth: data.payout_address_eth,
          payout_address_sol: data.payout_address_sol,
          payout_address_cardano: data.payout_address_cardano,
          payout_address_bsc: data.payout_address_bsc,
          payout_address_sui: data.payout_address_sui,
          banned: data.banned,
          verified: data.verified
        };
        
        setUserProfile(userProfile);
        setUserRole(data.role || 'client');
        console.log('User profile set successfully:', userProfile);
      } else {
        console.log('No user profile found for ID:', userId);
      }
    } catch (error) {
      console.error('Exception fetching user profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('Refreshing profile for user:', user.id);
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('Auth effect: Getting initial session');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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

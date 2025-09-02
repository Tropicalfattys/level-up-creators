
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'creator' | 'admin';

export interface AuthUser extends User {
  user_metadata: {
    role?: UserRole;
    handle?: string;
    avatar_url?: string;
  };
}

export const signUp = async (email: string, password: string, referralCode?: string, handle?: string) => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('SignUp attempt with:', { email, handle, referralCode, redirectUrl });
    
    const metadata: any = {};
    if (handle) {
      metadata.handle = handle;
    }
    if (referralCode) {
      metadata.referral_code = referralCode;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: Object.keys(metadata).length > 0 ? metadata : undefined
      }
    });
    
    console.log('SignUp response:', { data: !!data, error });
    
    return { data, error };
  } catch (error) {
    console.error('SignUp exception:', error);
    return { data: null, error: error as Error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('SignIn attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('SignIn response:', { 
      user: !!data.user, 
      session: !!data.session, 
      error: error?.message 
    });
    
    return { data, error };
  } catch (error) {
    console.error('SignIn exception:', error);
    return { data: null, error: error as Error };
  }
};

export const signInWithProvider = async (provider: 'google' | 'twitter') => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('Social login attempt:', { provider, redirectUrl });
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });
    
    return { data, error };
  } catch (error) {
    console.error('Social login error:', error);
    return { data: null, error: error as Error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const redirectUrl = `${window.location.origin}/auth`;
    
    console.log('Password reset attempt for:', email);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    console.log('Password reset response:', { data: !!data, error });
    
    return { data, error };
  } catch (error) {
    console.error('Password reset exception:', error);
    return { data: null, error: error as Error };
  }
};

export const signOut = async () => {
  try {
    console.log('SignOut attempt');
    const { error } = await supabase.auth.signOut();
    
    // If signOut fails with session missing error, force clear local state
    if (error && error.message?.includes('Auth session missing')) {
      console.log('Session missing, forcing local cleanup');
      
      // Clear localStorage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-cpxqkiajkkeizsewhoel-auth-token');
        // Clear any other auth-related localStorage items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch (localStorageError) {
        console.error('Error clearing localStorage:', localStorageError);
      }
      
      // Force trigger auth state change to clear session
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          console.log('Forced sign out completed');
        }
      });
      
      return { error: null }; // Return success since we handled the cleanup
    }
    
    if (error) {
      console.error('SignOut error:', error);
      // Even if there's an error, try to clear local state
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-cpxqkiajkkeizsewhoel-auth-token');
      } catch (localStorageError) {
        console.error('Error clearing localStorage during error:', localStorageError);
      }
    }
    
    return { error };
  } catch (error) {
    console.error('SignOut exception:', error);
    
    // Force cleanup even on exception
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-cpxqkiajkkeizsewhoel-auth-token');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch (localStorageError) {
      console.error('Error clearing localStorage during exception:', localStorageError);
    }
    
    return { error: error as Error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

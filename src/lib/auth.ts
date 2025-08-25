
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
    // Always use the current origin for redirect
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('SignUp attempt with:', { email, handle, referralCode, redirectUrl });
    
    const metadata: any = {};
    if (referralCode) {
      metadata.referral_code = referralCode;
      console.log('Adding referral code to metadata:', referralCode);
    }
    if (handle) {
      metadata.handle = handle;
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
    
    if (error) {
      console.error('SignUp error details:', error);
    } else if (data.user && !data.session) {
      console.log('User created, confirmation email sent');
    }
    
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
    
    if (error) {
      console.error('SignIn error details:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('SignIn exception:', error);
    return { data: null, error: error as Error };
  }
};

export const signInWithProvider = async (provider: 'google' | 'github' | 'twitter') => {
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

export const signOut = async () => {
  try {
    console.log('SignOut attempt');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('SignOut error:', error);
    }
    return { error };
  } catch (error) {
    console.error('SignOut exception:', error);
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

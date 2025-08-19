
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
  const redirectUrl = `${window.location.origin}/`;
  
  const metadata: any = {};
  if (referralCode) metadata.referral_code = referralCode;
  if (handle) metadata.handle = handle;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: Object.keys(metadata).length > 0 ? metadata : undefined
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signInWithProvider = async (provider: 'google' | 'github' | 'twitter') => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl
    }
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

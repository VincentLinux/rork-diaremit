import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, Database, isSupabaseConfigured } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, country?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: any }>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const createProfile = useCallback(async (userId: string, userEmail?: string, userFullName?: string) => {
    try {
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, skipping profile creation');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: userEmail || null,
            full_name: userFullName || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error.message || error);
      } else {
        console.log('Profile created:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in createProfile:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userFullName?: string) => {
    try {
      setLoading(true);
      
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, skipping profile fetch');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      // Handle the array result from limit(1)
      const profileData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (error) {
        console.error('Error fetching profile:', error.message || error);
        // If there's an error, try to create a profile
        await createProfile(userId, userEmail, userFullName);
        return;
      } else if (profileData) {
        console.log('Profile fetched:', profileData);
        setProfile(profileData);
      } else {
        // No profile found, create one
        console.log('No profile found, creating new profile');
        await createProfile(userId, userEmail, userFullName);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [createProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      } else {
        setLoading(false);
      }
    }).catch((error: any) => {
      console.error('Error getting initial session:', error instanceof Error ? error.message : String(error));
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (!event || typeof event !== 'string') return;
      
      const sanitizedEvent = event.trim();
      console.log('Auth state changed:', sanitizedEvent, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // For email confirmation events, ensure profile is created
        if (sanitizedEvent === 'SIGNED_IN' || sanitizedEvent === 'TOKEN_REFRESHED') {
          await fetchProfile(session.user.id, session.user.email, session.user.user_metadata?.full_name);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?: string, country?: string) => {
    try {
      setLoading(true);
      
      console.log('=== SIGNUP DEBUG INFO ===');
      console.log('isSupabaseConfigured:', isSupabaseConfigured);
      console.log('EXPO_PUBLIC_SUPABASE_URL exists:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
      console.log('========================');
      
      if (!isSupabaseConfigured) {
        const configError = {
          message: 'Database not configured. Please set up your Supabase environment variables (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY) to enable authentication.',
          code: 'SUPABASE_NOT_CONFIGURED'
        };
        console.error('Sign up error:', configError);
        return { error: configError };
      }
      
      // Get the current URL for redirect
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = currentUrl ? `${currentUrl}/auth` : undefined;
      
      console.log('Signup with redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            country: country || null,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Sign up error:', error.message || error);
        return { error };
      }

      console.log('Sign up successful:', {
        user: data.user?.email,
        session: !!data.session,
        needsConfirmation: !data.session && data.user && !data.user.email_confirmed_at
      });
      
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      console.error('Sign up exception:', errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      if (!isSupabaseConfigured) {
        const configError = {
          message: 'Database not configured. Please set up your Supabase environment variables (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY) to enable authentication.',
          code: 'SUPABASE_NOT_CONFIGURED'
        };
        console.error('Sign in error:', configError);
        return { error: configError };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message || error);
        return { error };
      }

      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      console.error('Sign in exception:', errorMessage);
      return { error: { message: errorMessage } };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error.message || error);
        return { error };
      }

      console.log('Sign out successful');
      setSession(null);
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('Sign out exception:', errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        return { error: new Error('Invalid updates provided') };
      }

      if (!isSupabaseConfigured) {
        const configError = {
          message: 'Database not configured. Profile updates are not available.',
          code: 'SUPABASE_NOT_CONFIGURED'
        };
        console.error('Update profile error:', configError);
        return { error: configError };
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error.message || error);
        return { error };
      }

      console.log('Profile updated:', data);
      setProfile(data);
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update profile failed';
      console.error('Update profile exception:', errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.full_name);
    }
  }, [user, fetchProfile]);

  const deleteAccount = useCallback(async () => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      if (!isSupabaseConfigured) {
        const configError = {
          message: 'Database not configured. Account deletion is not available.',
          code: 'SUPABASE_NOT_CONFIGURED'
        };
        console.error('Delete account error:', configError);
        return { error: configError };
      }

      setLoading(true);
      
      console.log('Deleting account for user:', user.id);
      
      // Call the database function to delete the user account
      // This function will delete all user data AND the auth user
      const { data, error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        console.error('Error deleting account:', error);
        return { error };
      }
      
      console.log('Account deletion result:', data);
      
      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log('Account deleted successfully');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account deletion failed';
      console.error('Delete account exception:', errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    deleteAccount,
  }), [session, user, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile, deleteAccount]);
});
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      setProfile(null);
      setAuthError(error.message || 'Unable to load user profile.');
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;

    async function initSession() {
      setLoading(true);
      setAuthError('');

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setAuthError(error.message || 'Failed to restore session.');
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const currentSession = data.session ?? null;
      setSession(currentSession);

      if (currentSession?.user?.id) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      if (active) setLoading(false);
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setAuthError('');
      setSession(nextSession ?? null);

      if (nextSession?.user?.id) {
        setLoading(true);
        await fetchProfile(nextSession.user.id);
        if (active) setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithPassword = useCallback(async ({ email, password }) => {
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
      return { data: null, error };
    }

    const loadedProfile = data.user?.id ? await fetchProfile(data.user.id) : null;
    return { data: { ...data, profile: loadedProfile }, error: null };
  }, [fetchProfile]);

  const signUpResident = useCallback(async ({ fullName, email, password }) => {
    setAuthError('');
    const cleanName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return { data: null, error };
    }

    if (data.user?.id) {
      await fetchProfile(data.user.id);
    }

    return { data, error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    setSession(null);
    setProfile(null);
    return { error: null };
  }, []);

  const userId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (userId) {
      return fetchProfile(userId);
    }
    return null;
  }, [userId, fetchProfile]);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const role = profile?.role ?? null;
    return {
      session,
      user,
      profile,
      role,
      isAuthenticated: Boolean(user),
      isAdmin: role === 'admin',
      isResident: role === 'resident',
      loading,
      authError,
      signInWithPassword,
      signUpResident,
      signOut,
      refreshProfile,
    };
  }, [
    session,
    profile,
    loading,
    authError,
    signInWithPassword,
    signUpResident,
    signOut,
    refreshProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
}

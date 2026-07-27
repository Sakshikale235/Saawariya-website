import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type SupabaseAuthContextType = {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useMemo(() => {
    return async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session ?? null);
    };
  }, []);

  const logout = useMemo(() => {
    return async () => {
      // Clear local state immediately to avoid stale UI while signOut propagates.
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Double-check session state after signOut.
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      // Ensure fresh reads on the next UI render/navigation.
      await refreshSession();

    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSession(data.session ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: SupabaseAuthContextType = {
    session,
    loading,
    refreshSession,
    logout,
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  return ctx;
}



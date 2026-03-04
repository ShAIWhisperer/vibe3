import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AuthModal } from '@/components/AuthModal';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requireAuth: (action: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');
  const [authResolve, setAuthResolve] = useState<((value: boolean) => void) | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const requireAuth = useCallback((action: string): Promise<boolean> => {
    // Already authenticated
    if (user) return Promise.resolve(true);
    // No supabase configured
    if (!supabase) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      setAuthAction(action);
      setAuthResolve(() => resolve);
      setAuthModalOpen(true);
    });
  }, [user]);

  // When user logs in while modal is open, resolve the promise
  useEffect(() => {
    if (user && authResolve) {
      authResolve(true);
      setAuthResolve(null);
      setAuthModalOpen(false);
    }
  }, [user, authResolve]);

  const handleDismiss = useCallback(() => {
    if (authResolve) {
      authResolve(false);
      setAuthResolve(null);
    }
    setAuthModalOpen(false);
  }, [authResolve]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, requireAuth }}>
      {children}
      <AuthModal
        isOpen={authModalOpen}
        action={authAction}
        onSignIn={signInWithGoogle}
        onDismiss={handleDismiss}
      />
    </AuthContext.Provider>
  );
}

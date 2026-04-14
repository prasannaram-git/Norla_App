'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { isDemoMode } from '@/lib/constants';

interface NorlaUser {
  phone: string;
  name: string;
  dob: string;
  sex: string;
}

interface AuthContextType {
  user: User | null;
  norlaUser: NorlaUser | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  norlaUser: null,
  loading: true,
  isDemo: false,
  signOut: async () => {},
});

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@norla.app',
  phone: '+910000000000',
  user_metadata: { full_name: 'Demo User', sex: 'male', date_of_birth: '2000-01-01' },
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [norlaUser, setNorlaUser] = useState<NorlaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = isDemoMode();

  useEffect(() => {
    // PRIORITY 1: Check custom OTP session in localStorage (instant — no network)
    try {
      const stored = localStorage.getItem('norla_user');
      if (stored) {
        const parsed = JSON.parse(stored) as NorlaUser;
        setNorlaUser(parsed);
        setUser({
          id: `phone-${parsed.phone}`,
          email: undefined,
          phone: parsed.phone,
          user_metadata: {
            full_name: parsed.name,
            sex: parsed.sex,
            date_of_birth: parsed.dob,
          },
        } as unknown as User);
        setLoading(false);
        return; // DONE — no Supabase calls needed
      }
    } catch { /* ignore parse errors */ }

    // PRIORITY 2: Demo mode
    if (isDemo) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // PRIORITY 3: Check if norla_session cookie exists (meaning user is authenticated
    // but localStorage was cleared — re-sync needed). We check document.cookie since
    // the cookie is httpOnly and won't appear, so we skip Supabase entirely and just
    // stop loading to prevent 5-second hang.
    // The middleware handles route protection via the cookie on the server side.
    // If no localStorage user, we need to show login — just stop loading immediately.
    setLoading(false);

    // OPTIONAL: Non-blocking Supabase check for users who signed in via Supabase auth
    let supabase;
    try {
      supabase = createClient();
    } catch {
      supabase = null;
    }

    if (supabase) {
      // Fire-and-forget — don't block UI
      supabase.auth.getUser()
        .then(({ data }: { data: { user: User | null } }) => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(() => { /* silent */ });

      // Listen for future auth changes
      try {
        const { data } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
          setUser(session?.user ?? null);
        });
        return () => { data.subscription.unsubscribe(); };
      } catch { /* silent */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  const signOut = async () => {
    // Clear session data (but keep scan history + user profiles for returning users)
    localStorage.removeItem('norla_user');
    // NOTE: norla_scans and norla_users_db are intentionally NOT cleared
    // so returning users see their history after re-login
    setNorlaUser(null);
    setUser(null);

    // Clear session cookie via API
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch { /* ignore */ }

    // Also sign out of Supabase if connected
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch { /* ignore */ }

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, norlaUser, loading, isDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

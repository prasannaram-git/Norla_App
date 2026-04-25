'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
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

/**
 * Helper: Create a Supabase-compatible User object from NorlaUser
 */
function userFromProfile(profile: NorlaUser): User {
  return {
    id: `phone-${profile.phone}`,
    email: undefined,
    phone: profile.phone,
    user_metadata: {
      full_name: profile.name,
      sex: profile.sex,
      date_of_birth: profile.dob,
    },
  } as unknown as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [norlaUser, setNorlaUser] = useState<NorlaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = isDemoMode();

  useEffect(() => {
    // PRIORITY 1: Check localStorage (INSTANT — 0ms, no network)
    try {
      const stored = localStorage.getItem('norla_user');
      if (stored) {
        const parsed = JSON.parse(stored) as NorlaUser;
        setNorlaUser(parsed);
        setUser(userFromProfile(parsed));
        setLoading(false);
        return; // DONE — UI unblocked instantly
      }
    } catch { /* ignore */ }

    // PRIORITY 2: Demo mode
    if (isDemo) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // PRIORITY 3: No localStorage — try server recovery (non-blocking)
    // This handles: cleared cache, incognito with valid cookie, new device
    setLoading(false); // Unblock UI immediately — don't wait for network

    fetch('/api/user/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.profile && data.profile.name) {
          const serverProfile: NorlaUser = {
            phone: data.profile.phone || data.phone,
            name: data.profile.name,
            dob: data.profile.dob || '',
            sex: data.profile.sex || '',
          };
          setNorlaUser(serverProfile);
          setUser(userFromProfile(serverProfile));
          localStorage.setItem('norla_user', JSON.stringify(serverProfile));
        }
      })
      .catch(() => { /* silent */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  const signOut = async () => {
    localStorage.removeItem('norla_user');
    setNorlaUser(null);
    setUser(null);

    // Clear session cookie via API
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
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

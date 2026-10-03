import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, tokenStore } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { SignupInput, SignupResult } from '@/services/authService';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  /** True while the initial `/auth/me` session check is in flight. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<SignupResult>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  /** Re-fetch the current session user. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: Record<UserRole, User> = {
  adopter: { id: 'u1', name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'adopter' },
  shelter_staff: {
    id: 'staff1',
    name: 'Maria Santos',
    email: 'maria@happytails.ph',
    role: 'shelter_staff',
    shelterId: 's1',
    accountStatus: 'approved',
  },
  platform_admin: {
    id: 'admin1',
    name: 'Platform Admin',
    email: 'admin@paws.ph',
    role: 'platform_admin',
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!tokenStore.get()) {
        if (mounted) setInitializing(false);
        return;
      }
      try {
        const me = await authService.me();
        if (mounted) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: authed } = await authService.login(email, password);
    setUser(authed);
    return authed;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await authService.signup(input);
    if (result.token) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    tokenStore.clearOnboarding();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      setUser(await authService.me());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
        setUser(null);
      }
    }
  }, []);

  // Demo-only: lets the UI preview other roles without a real backend session.
  const switchRole = useCallback((role: UserRole) => setUser(DEMO_USERS[role]), []);

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout, switchRole, refresh }),
    [user, initializing, login, signup, logout, switchRole, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

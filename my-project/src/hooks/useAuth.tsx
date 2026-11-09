import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { SignupInput, SignupResult } from '@/services/authService';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  /** True while the initial `/auth/me` session check is in flight. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<SignupResult>;
  logout: () => void;
  /** Re-fetch the current session user. */
  refresh: () => Promise<void>;
  /** Update the signed-in user's profile (server-only). */
  updateProfile: (input: { name?: string; avatarUrl?: string | null }) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  /**
   * The session lives in httpOnly cookies, so the only way to know who is
   * signed in is to ask the backend. `/auth/me` runs through the authenticate
   * middleware; the API client rotates an expired access cookie once before
   * reporting 401, which simply means "no session".
   */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await authService.me();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
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
    if (!result.requiresOnboarding) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    // Revoke server-side best-effort; local state always clears so a dead
    // network can never trap the user in a logged-in UI.
    try {
      await authService.logoutSession();
    } catch {
      // Ignore failure to ensure local state clears
    }
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUser(await authService.me());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (input: { name?: string; avatarUrl?: string | null }) => {
      const updated = await authService.updateMe(input);
      setUser(updated);
      return updated;
    },
    [],
  );

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout, refresh, updateProfile }),
    [user, initializing, login, signup, logout, refresh, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

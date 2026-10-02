import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: Record<UserRole, User> = {
  adopter: { id: 'u1', name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'adopter' },
  shelter_staff: { id: 'staff1', name: 'Maria Santos', email: 'maria@happytails.ph', role: 'shelter_staff', shelterId: 's1' },
  platform_admin: { id: 'admin1', name: 'Platform Admin', email: 'admin@paws.ph', role: 'platform_admin' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(DEMO_USERS.adopter);

  const login = useCallback((email: string, role: UserRole = 'adopter') => {
    setUser({ ...DEMO_USERS[role], email });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const switchRole = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role]);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, switchRole }),
    [user, login, logout, switchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

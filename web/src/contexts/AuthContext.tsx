'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { decodeJwtPayload } from '@/lib/jwt';

const TOKEN_KEY = 'qau_access_token';
const USER_PROFILE_KEY = 'qau_user_profile';

export type UserProfile = { nombre?: string; apellidos?: string; email?: string };

export type DashboardRole = 'superadmin' | 'admin' | 'operator';

type AuthContextType = {
  accessToken: string | null;
  userProfile: UserProfile | null;
  setAccessToken: (t: string | null, profile?: UserProfile | null) => void;
  user: { id: string; role: string } | null;
  dashboardRole: DashboardRole | null;
  canAccessDashboard: boolean;
};

const DASHBOARD_ROLES: DashboardRole[] = ['superadmin', 'admin', 'operator'];

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  userProfile: null,
  setAccessToken: () => {},
  user: null,
  dashboardRole: null,
  canAccessDashboard: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      setAccessTokenState(localStorage.getItem(TOKEN_KEY));
      const stored = localStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setUserProfileState(parsed);
      } else {
        setUserProfileState(null);
      }
    } catch {
      setAccessTokenState(null);
      setUserProfileState(null);
    }
  }, []);

  const setAccessToken = (t: string | null, profile?: UserProfile | null) => {
    try {
      if (t) {
        localStorage.setItem(TOKEN_KEY, t);
        if (profile !== undefined) {
          if (profile) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
          else localStorage.removeItem(USER_PROFILE_KEY);
          setUserProfileState(profile ?? null);
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
        setUserProfileState(null);
      }
    } catch {}
    setAccessTokenState(t);
  };

  const user = useMemo(() => {
    if (!accessToken) return null;
    const payload = decodeJwtPayload(accessToken);
    if (!payload?.sub) return null;
    return { id: payload.sub, role: payload.role ?? 'citizen' };
  }, [accessToken]);

  const dashboardRole = useMemo((): DashboardRole | null => {
    const r = user?.role;
    if (r && DASHBOARD_ROLES.includes(r as DashboardRole)) return r as DashboardRole;
    return null;
  }, [user?.role]);

  const canAccessDashboard = dashboardRole !== null;

  return (
    <AuthContext.Provider value={{ accessToken, userProfile, setAccessToken, user, dashboardRole, canAccessDashboard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

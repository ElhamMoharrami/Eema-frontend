'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserDto } from '@/lib/api-types';
import { authApi, setAccessToken, ApiError } from '@/lib/api-client';
import { saveRefreshToken, getRefreshToken, clearAuth } from '@/lib/auth';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: 'SCOUT' | 'OWNER') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from refresh token
  useEffect(() => {
    const restore = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authApi.refresh({ refreshToken });
        setAccessToken(res.accessToken);
        saveRefreshToken(res.refreshToken);
        setUser(res.user);
      } catch (e) {
        // Refresh token expired or invalid — clear and start fresh
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAccessToken(res.accessToken);
    saveRefreshToken(res.refreshToken);
    setUser(res.user);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role: 'SCOUT' | 'OWNER',
  ) => {
    const res = await authApi.register({ email, password, fullName, role });
    setAccessToken(res.accessToken);
    saveRefreshToken(res.refreshToken);
    setUser(res.user);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

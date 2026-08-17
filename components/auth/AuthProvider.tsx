"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthSession, getAuthSession, saveAuthSession, subscribeAuthSession } from "@/lib/auth/token";
import type { AuthResponse, User, UserRole } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  completeSession: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setAuthReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUser(getAuthSession()?.user ?? null);
      setAuthReady(true);
    };
    sync();
    const unsubscribe = subscribeAuthSession((session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    window.addEventListener("storage", sync);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", sync);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
    isAuthReady,
    completeSession: (response) => { saveAuthSession(response); },
    logout: () => { clearAuthSession(); },
  }), [isAuthReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

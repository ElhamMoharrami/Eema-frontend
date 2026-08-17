import type { AuthResponse, User } from "@/types/auth";

const SESSION_KEY = "eema:auth";
type SessionListener = (session: AuthSession | null) => void;
const listeners = new Set<SessionListener>();

export type AuthSession = Pick<AuthResponse, "accessToken" | "refreshToken" | "expiresIn"> & {
  user: User;
  storedAt: number;
};

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getAuthSession(): AuthSession | null {
  const value = storage()?.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Partial<AuthSession>;
    if (!session.accessToken || !session.refreshToken || !session.user) return null;
    return session as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(response: AuthResponse): AuthSession {
  if (!isAuthResponse(response)) throw new Error("Invalid authentication response");
  const session: AuthSession = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: response.expiresIn,
    user: response.user,
    storedAt: Date.now(),
  };
  storage()?.setItem(SESSION_KEY, JSON.stringify(session));
  notify(session);
  return session;
}

export function clearAuthSession(): void {
  storage()?.removeItem(SESSION_KEY);
  notify(null);
}

export function getAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function subscribeAuthSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  const user = response.user;
  return typeof response.accessToken === "string"
    && typeof response.refreshToken === "string"
    && typeof response.expiresIn === "number"
    && !!user
    && typeof user === "object"
    && typeof (user as Record<string, unknown>).id === "string"
    && typeof (user as Record<string, unknown>).email === "string"
    && ((user as Record<string, unknown>).role === "SCOUT" || (user as Record<string, unknown>).role === "OWNER" || (user as Record<string, unknown>).role === "ADMIN")
    && typeof (user as Record<string, unknown>).fullName === "string";
}

function notify(session: AuthSession | null): void {
  listeners.forEach((listener) => listener(session));
}

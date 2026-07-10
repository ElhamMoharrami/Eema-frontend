import Cookies from 'js-cookie';
import { setAccessToken } from './api-client';

const REFRESH_TOKEN_KEY = 'eema_refresh_token';

// Refresh token lives in a JS-readable cookie (httpOnly not possible from Next.js client).
// In a production hardening pass, move this to a backend-set httpOnly cookie.
// For V1, this is acceptable.

export function saveRefreshToken(token: string) {
  Cookies.set(REFRESH_TOKEN_KEY, token, {
    expires: 7,    // days
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function getRefreshToken(): string | null {
  return Cookies.get(REFRESH_TOKEN_KEY) ?? null;
}

export function clearRefreshToken() {
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function clearAuth() {
  setAccessToken(null);
  clearRefreshToken();
}

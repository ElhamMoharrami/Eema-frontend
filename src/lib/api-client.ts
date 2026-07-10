import { AuthResponse, BookingDto, CheckoutRequest, CheckoutResponse,
  CreateVenueRequest, LoginRequest, MatchRequest, MatchResponse,
  RefreshRequest, RegisterRequest, UserDto, VenueDto, VenueListDto } from './api-types';

// ─── Validate env ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and fill it in.'
  );
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isNotFound()     { return this.status === 404; }
  get isConflict()     { return this.status === 409; }
}

// ─── Token management (module-level, in-memory) ───────────────────────────────
// Access token lives in memory only — never localStorage, never a cookie you
// read from JS. Refresh token is in an httpOnly cookie set by the backend.
// On page refresh, call /api/auth/refresh to get a new access token.

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─── Core request function ────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (withAuth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends cookies (refresh token)
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: (data: RefreshRequest) =>
    request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () =>
    request<UserDto>('/api/auth/me', {}, true),
};

// ─── Venues ───────────────────────────────────────────────────────────────────

export const venueApi = {
  list: (tag?: string) =>
    request<VenueListDto[]>(
      `/api/venues${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`,
    ),

  get: (id: string) =>
    request<VenueDto>(`/api/venues/${id}`),

  create: (data: CreateVenueRequest) =>
    request<VenueDto>('/api/venues', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  myVenues: () =>
    request<VenueDto[]>('/api/venues/my', {}, true),
};

// ─── AI Match ─────────────────────────────────────────────────────────────────

export const matchApi = {
  search: (data: MatchRequest) =>
    request<MatchResponse>('/api/match', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingApi = {
  list: () =>
    request<BookingDto[]>('/api/bookings', {}, true),

  checkout: (data: CheckoutRequest) =>
    request<CheckoutResponse>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),
};

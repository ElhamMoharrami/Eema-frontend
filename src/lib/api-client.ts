import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserDto,
  VenueDto,
  VenueListDto,
  CreateVenueRequest,
  MatchRequest,
  MatchResponse,
  BookingDto,
  CheckoutRequest,
  CheckoutResponse,
} from './api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message ?? 'Request failed');
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  auth: {
    register: (body: RegisterRequest) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: LoginRequest) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    refresh: (refreshToken: string) =>
      request<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    me: () => request<UserDto>('/api/auth/me'),
  },
  venues: {
    list: (tag?: string) =>
      request<VenueListDto[]>(`/api/venues${tag ? `?tag=${tag}` : ''}`),
    get: (id: string) =>
      request<VenueDto>(`/api/venues/${id}`),
    create: (body: CreateVenueRequest) =>
      request<VenueDto>('/api/venues', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  match: {
    search: (body: MatchRequest) =>
      request<MatchResponse>('/api/match', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  bookings: {
    list: () => request<BookingDto[]>('/api/bookings'),
    checkout: (body: CheckoutRequest) =>
      request<CheckoutResponse>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
};

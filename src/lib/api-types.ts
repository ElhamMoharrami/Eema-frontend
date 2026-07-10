// These types mirror the Spring Boot DTO contract in eema-backend.
// If you change a backend DTO response shape, update this file manually.
// Source of truth: eema-backend/src/main/java/com/eema/backend/dto/

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'SCOUT' | 'OWNER' | 'ADMIN';

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
  user: UserDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'SCOUT' | 'OWNER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ─── Venues ──────────────────────────────────────────────────────────────────

export type VenueStatus = 'pending' | 'active' | 'suspended';

export interface VenueListDto {
  id: string;
  name: string;
  neighbourhood: string;
  sizeM2: number;
  dayRateEur: number;
  tags: string[];
  firstPhotoUrl: string | null;
  status: VenueStatus;
}

export interface VenueDto extends VenueListDto {
  description: string | null;
  clipUrl: string | null;
  photoUrls: string[];
  ownerId: string | null;
  createdAt: string;
}

export interface CreateVenueRequest {
  name: string;
  neighbourhood: string;
  sizeM2: number;
  dayRateEur: number;
  tags: string[];
  description?: string;
  clipUrl?: string;
}

// ─── Match / AI ──────────────────────────────────────────────────────────────

export interface MatchRequest {
  brief: string;
  venueId?: string; // optional: request quote for a specific venue
}

export interface MatchedVenue {
  venue: VenueListDto;
  score: number;
  explanation: string;
  quoteItems?: QuoteItem[];
}

export interface QuoteItem {
  label: string;
  amount: number;
  note?: string;
}

export interface MatchResponse {
  venues: MatchedVenue[];
  brief: string;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'paid' | 'confirmed' | 'paid' | 'confirmed' | 'cancelled' | 'refunded';

export interface BookingDto {
  id: string;
  venueId: string;
  scoutId: string;
  molliePaymentId: string | null;
  status: BookingStatus;
  bookingAmountEur: number;
  serviceFeeEur: number;
  eemaCommissionEur: number;
  ownerPayoutEur: number;
  shootDate: string | null;
  rawBrief: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface CheckoutRequest {
  venueId: string;
  shootDate: string; // ISO date: YYYY-MM-DD
  rawBrief?: string;
  scoutContact: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CheckoutResponse {
  bookingId: string;
  checkoutUrl: string; // Mollie payment page URL — redirect to this
  molliePaymentId: string;
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

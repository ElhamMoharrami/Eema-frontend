// These types mirror the Spring Boot DTO contract.
// If you change a backend DTO, update this file manually.
// Source of truth: eema-backend/src/main/java/.../dto/

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'SCOUT' | 'OWNER' | 'ADMIN';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'SCOUT' | 'OWNER' | 'ADMIN';
  createdAt: string; // ISO date string
}

export interface VenueDto {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  dayRateEur: number;
  tags: string[];
  photoPaths: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  ownerId: string;
  createdAt: string; // ISO date string
}

export interface VenueListDto {
  id: string;
  name: string;
  description?: string;
  city: string;
  country: string;
  dayRateEur: number;
  tags: string[];
  mainPhoto?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface CreateVenueRequest {
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  dayRateEur: number;
  tags: string[];
  photoPaths: string[];
}

export interface MatchRequest {
  shootDate: string; // ISO date string
  brief: string;
  budgetMinEur?: number;
  budgetMaxEur?: number;
  tags?: string[];
}

export interface MatchResponse {
  venues: VenueDto[];
  total: number;
}

export interface BookingDto {
  id: string;
  venueId: string;
  scoutId: string;
  molliePaymentId?: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'CANCELLED';
  bookingAmountEur: number;
  serviceFeeEur: number;
  eeemaCommissionEur: number;
  ownerPayoutEur: number;
  shootDate: string; // ISO date string
  rawBrief?: string;
  scoutContact: Record<string, any>; // JSON object
  ownerContact: Record<string, any>; // JSON object
  calaVerified: boolean;
  createdAt: string; // ISO date string
  paidAt?: string; // ISO date string
  confirmedAt?: string; // ISO date string
  cancelledAt?: string; // ISO date string
}

export interface CheckoutRequest {
  venueId: string;
  shootDate: string; // ISO date string
  rawBrief?: string;
  scoutContact: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CheckoutResponse {
  paymentUrl: string;
  orderId: string;
}

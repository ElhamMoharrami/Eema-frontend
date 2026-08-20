import type { User } from "./auth";

export type VenueStatus = "DRAFT" | "PENDING" | "ACTIVE" | "SUSPENDED";

export type VenueList = {
  id: string;
  name: string;
  neighbourhood: string;
  sizeM2: number;
  hourlyRateEur: number;
  minimumBookingMinutes: number;
  fullDayRateEur: number | null;
  tags: string[];
  firstPhotoUrl: string | null;
  status: VenueStatus;
};

export type Venue = {
  id: string;
  owner: User;
  name: string;
  neighbourhood: string;
  sizeM2: number;
  hourlyRateEur: number;
  minimumBookingMinutes: number;
  fullDayRateEur: number | null;
  tags: string[];
  photoPaths: string[];
  clipUrl: string | null;
  description: string | null;
  timezone: string;
  status: VenueStatus;
  createdAt: string;
  updatedAt: string;
};

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type AvailabilityOverrideType = "AVAILABLE" | "BLOCKED";

export type WeeklyInterval = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type WeeklyIntervalRequest = Omit<WeeklyInterval, "id">;

export type AvailabilityOverride = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  type: AvailabilityOverrideType;
  allDay: boolean;
};

export type VenueAvailabilitySettings = {
  venueId: string;
  timezone: string;
  weekly: WeeklyInterval[];
  overrides: AvailabilityOverride[];
};

export type CreateAvailabilityOverrideRequest = Omit<AvailabilityOverride, "id">;

export type CreateVenueRequest = {
  name: string;
  neighbourhood: string;
  sizeM2: number;
  hourlyRateEur: number;
  minimumBookingMinutes: number;
  fullDayRateEur: number | null;
  tags: string[];
  description?: string;
  clipUrl?: string;
};

export type UpdateVenueRequest = {
  name: string;
  neighbourhood: string;
  sizeM2: number;
  hourlyRateEur: number;
  minimumBookingMinutes: number;
  fullDayRateEur: number | null;
  tags: string[];
  description: string | null;
  clipUrl: string | null;
  timezone: string;
  photoPaths: string[];
};
